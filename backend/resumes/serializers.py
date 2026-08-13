from rest_framework import serializers

from .models import Resume


class ResumeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = (
            "id",
            "title",
            "category",
            "version",
            "is_primary",
            "ats_score",
            "strength_score",
            "upload_date",
            "file",
        )


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = (
            "id",
            "title",
            "category",
            "file",
            "version",
            "is_primary",
            "extracted_text",
            "parsed_data",
            "ats_score",
            "strength_score",
            "analysis",
            "upload_date",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "extracted_text",
            "parsed_data",
            "ats_score",
            "strength_score",
            "analysis",
            "upload_date",
            "updated_at",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        title = validated_data.get("title", "Resume")
        latest = (
            Resume.objects.filter(user=user, title=title).order_by("-version").first()
        )
        validated_data["version"] = (latest.version + 1) if latest else 1
        validated_data["user"] = user
        return super().create(validated_data)
