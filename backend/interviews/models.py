from django.conf import settings
from django.db import models

from applications.models import JobApplication


class InterviewRound(models.TextChoices):
    OA = "oa", "Online Assessment"
    R1 = "r1", "Round 1"
    R2 = "r2", "Round 2"
    R3 = "r3", "Round 3"
    HR = "hr", "HR"
    MANAGERIAL = "managerial", "Managerial"
    FINAL = "final", "Final"


class Interview(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interviews")
    application = models.ForeignKey(
        JobApplication, on_delete=models.CASCADE, related_name="interviews", null=True, blank=True
    )
    company_name = models.CharField(max_length=200)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    round = models.CharField(max_length=32, choices=InterviewRound.choices, default=InterviewRound.R1)
    platform = models.CharField(max_length=100, blank=True)
    interviewer_name = models.CharField(max_length=150, blank=True)
    meeting_link = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    feedback = models.TextField(blank=True)
    reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "time"]

    def __str__(self):
        return f"{self.company_name} ({self.round}) on {self.date}"
