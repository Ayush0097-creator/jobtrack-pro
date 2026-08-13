from rest_framework import serializers

from .models import Interview


class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = (
            "id",
            "application",
            "company_name",
            "date",
            "time",
            "round",
            "platform",
            "interviewer_name",
            "meeting_link",
            "notes",
            "feedback",
            "reminder_sent",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "reminder_sent", "created_at", "updated_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
