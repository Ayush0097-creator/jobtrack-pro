from django.conf import settings
from django.db import models


class ResumeCategory(models.TextChoices):
    SOFTWARE = "software", "Software Developer"
    DATA = "data", "Data Analyst"
    FULLSTACK = "fullstack", "Full Stack"
    BACKEND = "backend", "Backend"
    FRONTEND = "frontend", "Frontend"
    MOBILE = "mobile", "Mobile"
    OTHER = "other", "Other"


class Resume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes")
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=32, choices=ResumeCategory.choices, default=ResumeCategory.OTHER)
    file = models.FileField(upload_to="resumes/")
    version = models.PositiveIntegerField(default=1)
    is_primary = models.BooleanField(default=False)
    extracted_text = models.TextField(blank=True)
    parsed_data = models.JSONField(default=dict, blank=True)
    ats_score = models.FloatField(null=True, blank=True)
    strength_score = models.FloatField(null=True, blank=True)
    analysis = models.JSONField(default=dict, blank=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-upload_date"]
        unique_together = ("user", "title", "version")

    def __str__(self):
        return f"{self.title} v{self.version}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            Resume.objects.filter(user=self.user, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
