from django.urls import path

from .views import CareerCoachView, CoverLetterView, InterviewPrepView, JobMatchView

urlpatterns = [
    path("job-match/", JobMatchView.as_view(), name="job_match"),
    path("cover-letter/", CoverLetterView.as_view(), name="cover_letter"),
    path("career-coach/", CareerCoachView.as_view(), name="career_coach"),
    path("interview-prep/", InterviewPrepView.as_view(), name="interview_prep"),
]
