from django.contrib import admin
from .models import EligibleStudent, PlacementAnnouncement, PlacementApplication, PlacementCompany


@admin.register(PlacementCompany)
class PlacementCompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "job_role", "package_lpa", "is_active", "visit_date", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "job_role")


@admin.register(EligibleStudent)
class EligibleStudentAdmin(admin.ModelAdmin):
    list_display = ("student", "company", "is_eligible", "created_at")
    list_filter = ("is_eligible", "company")


@admin.register(PlacementApplication)
class PlacementApplicationAdmin(admin.ModelAdmin):
    list_display = ("student", "company", "status", "applied_at")
    list_filter = ("status", "company")


@admin.register(PlacementAnnouncement)
class PlacementAnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "company", "is_published", "created_at")
    list_filter = ("is_published", "category")
