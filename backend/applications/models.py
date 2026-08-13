from django.conf import settings
from django.db import models


class ApplicationStatus(models.TextChoices):
    SAVED = "saved", "Saved"
    APPLIED = "applied", "Applied"
    ONLINE_ASSESSMENT = "online_assessment", "Online Assessment"
    OA_CLEARED = "oa_cleared", "OA Cleared"
    INTERVIEW_R1 = "interview_r1", "Interview Round 1"
    INTERVIEW_R2 = "interview_r2", "Interview Round 2"
    HR_ROUND = "hr_round", "HR Round"
    OFFER = "offer", "Offer Received"
    REJECTED = "rejected", "Rejected"


class WorkType(models.TextChoices):
    REMOTE = "remote", "Remote"
    HYBRID = "hybrid", "Hybrid"
    ONSITE = "onsite", "Onsite"


class ApplicationSource(models.TextChoices):
    LINKEDIN = "linkedin", "LinkedIn"
    INTERNSHALA = "internshala", "Internshala"
    NAUKRI = "naukri", "Naukri"
    INDEED = "indeed", "Indeed"
    CAREER_PAGE = "career_page", "Company Career Page"
    REFERRAL = "referral", "Referral"
    OTHER = "other", "Other"


class JobApplication(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications")
    company_name = models.CharField(max_length=200)
    job_title = models.CharField(max_length=200)
    job_description = models.TextField(blank=True)
    job_url = models.URLField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    work_type = models.CharField(max_length=20, choices=WorkType.choices, default=WorkType.REMOTE)
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default="INR")
    application_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=32, choices=ApplicationStatus.choices, default=ApplicationStatus.SAVED, db_index=True
    )
    board_order = models.PositiveIntegerField(default=0)
    source = models.CharField(
        max_length=32, choices=ApplicationSource.choices, default=ApplicationSource.OTHER, db_index=True
    )
    notes = models.TextField(blank=True)
    interview_questions = models.TextField(blank=True)
    dsa_questions = models.TextField(blank=True)
    hr_questions = models.TextField(blank=True)
    personal_notes = models.TextField(blank=True)
    resume = models.ForeignKey(
        "resumes.Resume",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applications",
    )
    match_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["user", "deadline"]),
        ]

    def __str__(self):
        return f"{self.company_name} — {self.job_title}"


class JobMatch(models.Model):
    application = models.OneToOneField(
        JobApplication, on_delete=models.CASCADE, related_name="job_match"
    )
    score = models.FloatField(default=0)
    matched_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    jd_skills = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Match {self.score}% for {self.application_id}"
