from django.contrib import admin

from .models import Resume


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "version", "ats_score", "user", "upload_date")
    list_filter = ("category",)
    search_fields = ("title", "user__email")
