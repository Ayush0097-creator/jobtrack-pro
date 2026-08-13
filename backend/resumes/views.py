from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from ai_engine.services import analyze_resume, extract_text_from_pdf
from notifications.services import create_notification

from .models import Resume
from .serializers import ResumeListSerializer, ResumeSerializer


class ResumeViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser]
    search_fields = ["title", "category"]
    ordering_fields = ["upload_date", "version", "ats_score"]
    ordering = ["-upload_date"]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return ResumeListSerializer
        return ResumeSerializer

    def perform_create(self, serializer):
        resume = serializer.save(user=self.request.user)
        try:
            text = extract_text_from_pdf(resume.file.path)
            resume.extracted_text = text
            analysis = analyze_resume(text, user=self.request.user)
            resume.parsed_data = analysis.get("parsed", {})
            resume.ats_score = analysis.get("ats_score")
            resume.strength_score = analysis.get("strength_score")
            resume.analysis = {
                "strengths": analysis.get("strengths", []),
                "weaknesses": analysis.get("weaknesses", []),
                "suggestions": analysis.get("suggestions", []),
                "missing_skills": analysis.get("missing_skills", []),
            }
            resume.save()
            skills = resume.parsed_data.get("skills") or []
            if skills and not self.request.user.skills:
                self.request.user.skills = skills
                self.request.user.save(update_fields=["skills"])
            create_notification(
                user=self.request.user,
                title="Resume analyzed",
                message=f"{resume.title} scored ATS {resume.ats_score}",
                category="resume",
                link="/app/resumes",
            )
        except Exception as exc:
            resume.analysis = {"error": str(exc)}
            resume.save(update_fields=["analysis"])

    @action(detail=True, methods=["post"])
    def reanalyze(self, request, pk=None):
        resume = self.get_object()
        text = resume.extracted_text or extract_text_from_pdf(resume.file.path)
        resume.extracted_text = text
        analysis = analyze_resume(text, user=request.user)
        resume.parsed_data = analysis.get("parsed", {})
        resume.ats_score = analysis.get("ats_score")
        resume.strength_score = analysis.get("strength_score")
        resume.analysis = {
            "strengths": analysis.get("strengths", []),
            "weaknesses": analysis.get("weaknesses", []),
            "suggestions": analysis.get("suggestions", []),
            "missing_skills": analysis.get("missing_skills", []),
        }
        resume.save()
        return Response(ResumeSerializer(resume).data)

    @action(detail=True, methods=["post"])
    def set_primary(self, request, pk=None):
        resume = self.get_object()
        resume.is_primary = True
        resume.save()
        return Response(ResumeSerializer(resume).data)
