from django.contrib import admin

from .models import Interview


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ("company_name", "date", "time", "round", "user")
    list_filter = ("round", "date")
    search_fields = ("company_name", "interviewer_name", "user__email")
