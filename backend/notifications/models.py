from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Category(models.TextChoices):
        INTERVIEW = "interview", "Interview"
        DEADLINE = "deadline", "Deadline"
        FOLLOWUP = "followup", "Follow-up"
        RESUME = "resume", "Resume"
        SYSTEM = "system", "System"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=32, choices=Category.choices, default=Category.SYSTEM)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
