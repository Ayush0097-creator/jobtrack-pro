from rest_framework import serializers

from resumes.serializers import ResumeListSerializer

from .models import JobApplication, JobMatch


class JobMatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobMatch
        fields = (
            "id",
            "score",
            "matched_skills",
            "missing_skills",
            "recommendations",
            "jd_skills",
            "updated_at",
        )
        read_only_fields = fields


class JobApplicationSerializer(serializers.ModelSerializer):
    job_match = JobMatchSerializer(read_only=True)
    resume_detail = ResumeListSerializer(source="resume", read_only=True)

    class Meta:
        model = JobApplication
        fields = (
            "id",
            "company_name",
            "job_title",
            "job_description",
            "job_url",
            "location",
            "work_type",
            "salary",
            "currency",
            "application_date",
            "deadline",
            "status",
            "board_order",
            "source",
            "notes",
            "interview_questions",
            "dsa_questions",
            "hr_questions",
            "personal_notes",
            "resume",
            "resume_detail",
            "match_score",
            "job_match",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "match_score", "created_at", "updated_at", "job_match", "resume_detail")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class KanbanReorderSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=[c[0] for c in JobApplication._meta.get_field("status").choices])
    board_order = serializers.IntegerField(min_value=0)
