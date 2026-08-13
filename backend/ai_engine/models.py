from django.conf import settings
from django.db import models


class AIUsageLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_usage", null=True, blank=True
    )
    feature = models.CharField(max_length=64)
    provider = models.CharField(max_length=32, blank=True)
    success = models.BooleanField(default=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.feature} ({self.provider})"
