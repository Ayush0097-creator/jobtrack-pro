from django.contrib import admin

from .models import JobApplication, JobMatch


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("company_name", "job_title", "status", "source", "user", "updated_at")
    list_filter = ("status", "source", "work_type")
    search_fields = ("company_name", "job_title", "user__email")


@admin.register(JobMatch)
class JobMatchAdmin(admin.ModelAdmin):
    list_display = ("application", "score", "updated_at")
