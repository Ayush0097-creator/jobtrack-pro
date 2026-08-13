from io import BytesIO

from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from applications.models import JobApplication, JobMatch
from resumes.models import Resume

from .services import (
    career_coach_reply,
    compute_job_match,
    generate_cover_letter,
    generate_interview_prep,
)


class JobMatchView(APIView):
    def post(self, request):
        application_id = request.data.get("application_id")
        resume_id = request.data.get("resume_id")
        job_description = request.data.get("job_description", "")
        resume_text = request.data.get("resume_text", "")

        application = None
        if application_id:
            try:
                application = JobApplication.objects.get(id=application_id, user=request.user)
                job_description = job_description or application.job_description
                if application.resume_id and not resume_id:
                    resume_id = application.resume_id
            except JobApplication.DoesNotExist:
                return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        if resume_id and not resume_text:
            try:
                resume = Resume.objects.get(id=resume_id, user=request.user)
                resume_text = resume.extracted_text or ""
            except Resume.DoesNotExist:
                return Response({"detail": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        if not resume_text:
            primary = Resume.objects.filter(user=request.user, is_primary=True).first()
            if primary:
                resume_text = primary.extracted_text
            else:
                latest = Resume.objects.filter(user=request.user).first()
                resume_text = latest.extracted_text if latest else ""

        if not job_description or not resume_text:
            return Response(
                {"detail": "job_description and resume content are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = compute_job_match(resume_text, job_description, user=request.user)
        if application:
            JobMatch.objects.update_or_create(
                application=application,
                defaults={
                    "score": result["score"],
                    "matched_skills": result["matched_skills"],
                    "missing_skills": result["missing_skills"],
                    "recommendations": result["recommendations"],
                    "jd_skills": result["jd_skills"],
                },
            )
            application.match_score = result["score"]
            application.save(update_fields=["match_score", "updated_at"])
        return Response(result)


class CoverLetterView(APIView):
    def post(self, request):
        company = request.data.get("company_name", "")
        position = request.data.get("position", "")
        job_description = request.data.get("job_description", "")
        resume_id = request.data.get("resume_id")
        resume_text = request.data.get("resume_text", "")
        as_pdf = str(request.data.get("as_pdf", "")).lower() in ("1", "true", "yes")

        if resume_id and not resume_text:
            try:
                resume = Resume.objects.get(id=resume_id, user=request.user)
                resume_text = resume.extracted_text
            except Resume.DoesNotExist:
                return Response({"detail": "Resume not found."}, status=404)

        if not resume_text:
            resume = Resume.objects.filter(user=request.user).order_by("-is_primary", "-upload_date").first()
            resume_text = resume.extracted_text if resume else ""

        if not all([company, position, job_description, resume_text]):
            return Response(
                {"detail": "company_name, position, job_description, and resume are required."},
                status=400,
            )

        letter = generate_cover_letter(resume_text, job_description, company, position, user=request.user)
        if as_pdf:
            buffer = BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)
            width, height = letter
            y = height - 72
            c.setFont("Helvetica", 11)
            for line in letter.splitlines():
                if y < 72:
                    c.showPage()
                    c.setFont("Helvetica", 11)
                    y = height - 72
                c.drawString(72, y, line[:95])
                y -= 16
            c.save()
            buffer.seek(0)
            response = HttpResponse(buffer.read(), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="cover_letter_{company}.pdf"'
            return response
        return Response({"cover_letter": letter})


class CareerCoachView(APIView):
    def post(self, request):
        message = request.data.get("message", "").strip()
        context = request.data.get("context", "")
        if not message:
            return Response({"detail": "message required"}, status=400)
        reply = career_coach_reply(message, context=context, user=request.user)
        return Response({"reply": reply})


class InterviewPrepView(APIView):
    def post(self, request):
        company = request.data.get("company_name", "the company")
        role = request.data.get("role", "Software Engineer")
        data = generate_interview_prep(company, role, user=request.user)
        return Response(data)
