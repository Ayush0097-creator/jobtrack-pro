from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import EligibleStudent, PlacementAnnouncement, PlacementApplication, PlacementCompany

User = get_user_model()


class PlacementCompanySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    total_eligible = serializers.SerializerMethodField()
    total_applied = serializers.SerializerMethodField()
    total_selected = serializers.SerializerMethodField()
    is_deadline_passed = serializers.SerializerMethodField()

    class Meta:
        model = PlacementCompany
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")

    def get_created_by_name(self, obj):
        return obj.created_by.full_name or obj.created_by.email if obj.created_by else None

    def get_total_eligible(self, obj):
        return obj.eligible_students.filter(is_eligible=True).count()

    def get_total_applied(self, obj):
        return obj.applications.count()

    def get_total_selected(self, obj):
        return obj.applications.filter(status=PlacementApplication.Status.SELECTED).count()

    def get_is_deadline_passed(self, obj):
        if not obj.registration_deadline:
            return False
        from django.utils import timezone
        return obj.registration_deadline < timezone.now()


class StudentBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "full_name", "branch", "graduation_year", "cgpa", "backlogs", "college", "roll_number")


class EligibleStudentSerializer(serializers.ModelSerializer):
    student_detail = StudentBriefSerializer(source="student", read_only=True)
    added_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EligibleStudent
        fields = "__all__"
        read_only_fields = ("added_by", "created_at", "updated_at")

    def get_added_by_name(self, obj):
        return obj.added_by.full_name or obj.added_by.email if obj.added_by else None


class PlacementApplicationSerializer(serializers.ModelSerializer):
    student_detail = StudentBriefSerializer(source="student", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    company_role = serializers.CharField(source="company.job_role", read_only=True)
    company_package = serializers.FloatField(source="company.package_lpa", read_only=True)

    class Meta:
        model = PlacementApplication
        fields = "__all__"
        read_only_fields = ("student", "applied_at", "updated_at")


class PlacementAnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    company_name = serializers.CharField(source="company.name", read_only=True, default=None)

    class Meta:
        model = PlacementAnnouncement
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")

    def get_created_by_name(self, obj):
        return obj.created_by.full_name or obj.created_by.email if obj.created_by else None


class PlacementDashboardSerializer(serializers.Serializer):
    total_companies = serializers.IntegerField()
    active_companies = serializers.IntegerField()
    total_eligible_entries = serializers.IntegerField()
    total_applications = serializers.IntegerField()
    total_selected = serializers.IntegerField()
    total_announcements = serializers.IntegerField()
    company_breakdown = serializers.ListField()
