import json
import re
from typing import Any, Optional

from django.conf import settings

from .models import AIUsageLog

COMMON_SKILLS = [
    "python", "java", "javascript", "typescript", "react", "node.js", "nodejs", "django",
    "flask", "fastapi", "sql", "postgresql", "mongodb", "redis", "aws", "azure", "gcp",
    "docker", "kubernetes", "git", "linux", "html", "css", "tailwind", "next.js", "vue",
    "angular", "c++", "c#", "go", "rust", "kotlin", "swift", "machine learning", "tensorflow",
    "pytorch", "pandas", "numpy", "rest apis", "graphql", "ci/cd", "jenkins", "kafka",
    "spark", "hadoop", "tableau", "power bi", "figma", "agile", "scrum", "system design",
]


def log_usage(user, feature: str, provider: str, success: bool = True, meta: Optional[dict] = None):
    AIUsageLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        feature=feature,
        provider=provider,
        success=success,
        meta=meta or {},
    )


def extract_text_from_pdf(path: str) -> str:
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(path)
        chunks = []
        for page in reader.pages:
            chunks.append(page.extract_text() or "")
        return "\n".join(chunks).strip()
    except Exception:
        return ""


def _extract_skills(text: str) -> list[str]:
    lower = text.lower()
    found = []
    for skill in COMMON_SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, lower):
            found.append(skill.title() if skill.islower() else skill)
    # normalize node.js
    normalized = []
    for s in found:
        if s.lower() in ("nodejs", "node.js"):
            s = "Node.js"
        if s not in normalized:
            normalized.append(s)
    return normalized


def _heuristic_resume_analysis(text: str) -> dict[str, Any]:
    skills = _extract_skills(text)
    has_summary = bool(re.search(r"\b(summary|objective|profile)\b", text, re.I))
    has_projects = bool(re.search(r"\bprojects?\b", text, re.I))
    has_experience = bool(re.search(r"\b(experience|work history|employment)\b", text, re.I))
    has_education = bool(re.search(r"\b(education|university|bachelor|master|b\.?tech)\b", text, re.I))
    has_metrics = bool(re.search(r"\d+%|\$\d+|increased|reduced|improved", text, re.I))
    has_certs = bool(re.search(r"\b(certification|certified|aws certified)\b", text, re.I))

    score = 40
    strengths, weaknesses, suggestions = [], [], []
    if skills:
        score += min(20, len(skills) * 2)
        strengths.append("Strong technical skills coverage")
    else:
        weaknesses.append("Few recognizable technical skills detected")
        suggestions.append("Add a dedicated skills section with relevant tools")
    if has_projects:
        score += 10
        strengths.append("Good project section")
    else:
        weaknesses.append("Projects section missing or weak")
        suggestions.append("Add 2–3 projects with tech stack and outcomes")
    if has_experience:
        score += 8
    if has_education:
        score += 5
    if has_summary:
        score += 5
    else:
        weaknesses.append("Weak or missing summary section")
        suggestions.append("Add a 2–3 line professional summary")
    if has_metrics:
        score += 8
        strengths.append("Includes quantified achievements")
    else:
        weaknesses.append("Missing quantified achievements")
        suggestions.append("Add measurable results (%, revenue, latency, users)")
    if has_certs:
        score += 4
    else:
        suggestions.append("Include relevant certifications if available")

    ats = max(0, min(100, score))
    strength = max(0, min(100, score - 5 + (5 if has_metrics else 0)))

    education_match = re.search(r"(.{0,80}(bachelor|master|b\.?tech|m\.?tech|university).{0,80})", text, re.I)
    return {
        "ats_score": float(ats),
        "strength_score": float(strength),
        "strengths": strengths or ["Readable structure"],
        "weaknesses": weaknesses or ["Could be more tailored"],
        "suggestions": suggestions or ["Tailor resume keywords to each JD"],
        "missing_skills": ["Docker", "AWS", "System Design"][: max(0, 3 - len(skills) // 3)],
        "parsed": {
            "skills": skills,
            "education": education_match.group(0).strip() if education_match else "",
            "experience": "Detected" if has_experience else "",
            "projects": "Detected" if has_projects else "",
            "certifications": "Detected" if has_certs else "",
        },
    }


def _call_llm(prompt: str, system: str = "You are a career coach and ATS expert. Respond in JSON only.") -> Optional[str]:
    provider = settings.AI_PROVIDER
    try:
        if provider == "openai" and settings.OPENAI_API_KEY:
            from openai import OpenAI

            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            resp = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
            )
            return resp.choices[0].message.content
        if settings.GEMINI_API_KEY:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=f"{system}\n\n{prompt}",
                config=types.GenerateContentConfig(
                    temperature=0.3,
                ),
            )
            return response.text
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("LLM call failed: %s", e)
        return None
    return None


def _parse_json_response(text: str) -> Optional[dict]:
    if not text:
        return None
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                return None
    return None


def analyze_resume(text: str, user=None) -> dict[str, Any]:
    provider = settings.AI_PROVIDER if (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY) else "heuristic"
    if provider != "heuristic":
        prompt = f"""Analyze this resume for ATS readiness. Return JSON with keys:
ats_score (0-100), strength_score (0-100), strengths (array), weaknesses (array),
suggestions (array), missing_skills (array), parsed (object with skills, education, experience, projects, certifications).

Resume:
{text[:12000]}
"""
        raw = _call_llm(prompt)
        data = _parse_json_response(raw or "")
        if data:
            log_usage(user, "resume_analyze", provider, True)
            data.setdefault("parsed", {})
            if not data["parsed"].get("skills"):
                data["parsed"]["skills"] = _extract_skills(text)
            return data
        log_usage(user, "resume_analyze", provider, False)
    result = _heuristic_resume_analysis(text)
    log_usage(user, "resume_analyze", "heuristic", True)
    return result


def compute_job_match(resume_text: str, job_description: str, user=None) -> dict[str, Any]:
    resume_skills = _extract_skills(resume_text)
    jd_skills = _extract_skills(job_description)
    resume_set = {s.lower() for s in resume_skills}
    matched = [s for s in jd_skills if s.lower() in resume_set]
    missing = [s for s in jd_skills if s.lower() not in resume_set]
    score = round((len(matched) / len(jd_skills)) * 100, 1) if jd_skills else 50.0

    provider = settings.AI_PROVIDER if (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY) else "heuristic"
    recommendations = [f"Learn {s} basics" for s in missing[:3]]
    if not recommendations:
        recommendations = ["Tailor your summary to emphasize matched skills"]

    if provider != "heuristic":
        prompt = f"""Compare resume skills to JD. Return JSON:
score (0-100), matched_skills, missing_skills, recommendations, jd_skills.
Resume skills: {resume_skills}
JD:
{job_description[:8000]}
"""
        data = _parse_json_response(_call_llm(prompt) or "")
        if data:
            log_usage(user, "job_match", provider, True)
            return {
                "score": float(data.get("score", score)),
                "matched_skills": data.get("matched_skills", matched),
                "missing_skills": data.get("missing_skills", missing),
                "recommendations": data.get("recommendations", recommendations),
                "jd_skills": data.get("jd_skills", jd_skills),
            }
        log_usage(user, "job_match", provider, False)

    log_usage(user, "job_match", "heuristic", True)
    return {
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "recommendations": recommendations,
        "jd_skills": jd_skills,
    }


def generate_cover_letter(resume_text: str, job_description: str, company: str, position: str, user=None) -> str:
    provider = settings.AI_PROVIDER if (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY) else "heuristic"
    if provider != "heuristic":
        prompt = f"""Write a professional cover letter (no JSON). Company: {company}. Position: {position}.
Resume excerpt:
{resume_text[:6000]}
JD:
{job_description[:6000]}
"""
        raw = _call_llm(prompt, system="You are an expert career writer. Write polished cover letters.")
        if raw:
            log_usage(user, "cover_letter", provider, True)
            return raw.strip()
        log_usage(user, "cover_letter", provider, False)

    skills = ", ".join(_extract_skills(resume_text)[:6]) or "software engineering"
    letter = f"""Dear Hiring Manager,

I am writing to express my interest in the {position} role at {company}. With experience across {skills}, I am excited about the opportunity to contribute to your team.

After reviewing the job description, I believe my background aligns well with your requirements. I am particularly drawn to {company}'s mission and would welcome the chance to bring strong problem-solving skills, ownership, and collaboration to this position.

I have attached my resume for your consideration and would appreciate the opportunity to discuss how I can add value to {company}.

Thank you for your time and consideration.

Sincerely,
[Your Name]
"""
    log_usage(user, "cover_letter", "heuristic", True)
    return letter.strip()


def career_coach_reply(message: str, context: str = "", user=None) -> str:
    provider = settings.AI_PROVIDER if (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY) else "heuristic"
    if provider != "heuristic":
        prompt = f"Context:\n{context[:4000]}\n\nUser question:\n{message}"
        raw = _call_llm(prompt, system="You are JobTrack Pro AI Career Coach. Be practical and concise. Plain text.")
        if raw:
            log_usage(user, "career_coach", provider, True)
            return raw.strip()
        log_usage(user, "career_coach", provider, False)

    log_usage(user, "career_coach", "heuristic", True)
    lower = message.lower()
    if "resume" in lower:
        return (
            "Focus your resume on impact: role → action → metric. Mirror JD keywords in your skills "
            "and project bullets, keep it to one page for early-career roles, and quantify outcomes."
        )
    if "interview" in lower or "dsa" in lower:
        return (
            "For interviews: practice 2–3 DSA patterns daily (arrays, hashing, trees, DP), "
            "prepare STAR stories, and research the company's recent product/tech blog posts."
        )
    return (
        "Track every application, tailor each resume to the JD, follow up after 7–10 days, "
        "and convert interview notes into a personal question bank. Consistency beats intensity."
    )


def generate_interview_prep(company: str, role: str, user=None) -> dict[str, Any]:
    provider = settings.AI_PROVIDER if (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY) else "heuristic"
    if provider != "heuristic":
        prompt = f"""Generate interview prep for {role} at {company}. Return JSON with keys:
dsa_questions (array of strings), hr_questions (array), technical_questions (array).
"""
        data = _parse_json_response(_call_llm(prompt) or "")
        if data:
            log_usage(user, "interview_prep", provider, True)
            return data
        log_usage(user, "interview_prep", provider, False)

    log_usage(user, "interview_prep", "heuristic", True)
    return {
        "dsa_questions": [
            "Two Sum / hashing warm-up",
            "Longest substring without repeating characters",
            "Merge intervals",
            "Binary tree level-order traversal",
            "Detect cycle in linked list",
        ],
        "hr_questions": [
            f"Why do you want to join {company}?",
            "Tell me about a time you handled conflict in a team.",
            "Where do you see yourself in 3 years?",
            "Describe a project you are most proud of.",
        ],
        "technical_questions": [
            f"Walk through a system design relevant to {role}.",
            "Explain REST vs GraphQL and when you'd choose each.",
            "How do you debug a production performance issue?",
            "Describe your approach to writing tests.",
        ],
    }
