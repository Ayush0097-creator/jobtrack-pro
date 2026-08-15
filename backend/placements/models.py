from django.conf import settings
from django.db import models


class PlacementCompany(models.Model):
    """A company participating in campus placement."""

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    logo_url = models.URLField(blank=True)
    website = models.URLField(blank=True)

    # Job details
    job_role = models.CharField(max_length=200)
    job_location = models.CharField(max_length=200, blank=True)
    package_lpa = models.FloatField(null=True, blank=True, help_text="CTC in LPA")

    # Eligibility criteria
    min_cgpa = models.FloatField(default=0.0, help_text="Minimum CGPA required")
    allowed_branches = models.JSONField(
        default=list,
        blank=True,
        help_text="List of allowed branches. Empty = all branches.",
    )
    required_skills = models.JSONField(default=list, blank=True)
    graduation_year = models.IntegerField(
        null=True, blank=True, help_text="Eligible graduation year. Null = any."
    )
    max_backlogs = models.IntegerField(
        default=0, help_text="Max allowed active backlogs. 0 = no backlogs allowed."
    )

    # Schedule
    registration_deadline = models.DateTimeField(null=True, blank=True)
    visit_date = models.DateField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_companies",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Placement Companies"

    def __str__(self):
        return f"{self.name} — {self.job_role}"


class EligibleStudent(models.Model):
    """Admin-controlled eligibility of a student for a placement company."""

    company = models.ForeignKey(
        PlacementCompany,
        on_delete=models.CASCADE,
        related_name="eligible_students",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="placement_eligibilities",
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="eligibilities_added",
    )
    is_eligible = models.BooleanField(default=True)
    override_reason = models.TextField(blank=True, help_text="Reason for manual override")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("company", "student")
        ordering = ["-created_at"]

    def __str__(self):
        status = "eligible" if self.is_eligible else "ineligible"
        return f"{self.student.email} — {self.company.name} ({status})"


class PlacementApplication(models.Model):
    """A student's application to a placement company drive."""

    class Status(models.TextChoices):
        APPLIED = "applied", "Applied"
        SHORTLISTED = "shortlisted", "Shortlisted"
        ON_HOLD = "on_hold", "On Hold"
        SELECTED = "selected", "Selected"
        REJECTED = "rejected", "Rejected"

    company = models.ForeignKey(
        PlacementCompany,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="placement_applications",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPLIED,
        db_index=True,
    )
    admin_notes = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("company", "student")
        ordering = ["-applied_at"]

    def __str__(self):
        return f"{self.student.email} → {self.company.name} [{self.status}]"


class PlacementAnnouncement(models.Model):
    """Admin-created announcements about placement activities."""

    class Category(models.TextChoices):
        GENERAL = "general", "General"
        COMPANY_VISIT = "company_visit", "Company Visit"
        REGISTRATION = "registration", "Registration"
        APTITUDE = "aptitude", "Aptitude Test"
        INTERVIEW = "interview", "Interview"
        RESULT = "result", "Result"
        OFFER = "offer", "Offer Letter"

    title = models.CharField(max_length=300)
    content = models.TextField()
    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.GENERAL,
        db_index=True,
    )
    company = models.ForeignKey(
        PlacementCompany,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements",
        help_text="Leave blank for global announcements.",
    )
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="placement_announcements",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.category}] {self.title}"
