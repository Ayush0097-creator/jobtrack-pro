from django.contrib import admin

from .models import AIUsageLog


@admin.register(AIUsageLog)
class AIUsageLogAdmin(admin.ModelAdmin):
    list_display = ("feature", "provider", "success", "user", "created_at")
    list_filter = ("feature", "provider", "success")
