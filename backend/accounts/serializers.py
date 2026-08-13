from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import UserRole

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "full_name",
            "phone",
            "linkedin_url",
            "github_url",
            "portfolio_url",
            "skills",
            "education",
            "is_email_verified",
            "is_staff",
            "is_active",
            "role",
            "is_admin",
            "date_joined",
            "last_login",
        )
        read_only_fields = (
            "id",
            "email",
            "is_email_verified",
            "is_staff",
            "is_active",
            "role",
            "is_admin",
            "date_joined",
            "last_login",
        )

    def get_is_admin(self, obj):
        return obj.is_admin_role


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin can manage role/active status for students."""

    is_admin = serializers.SerializerMethodField()
    application_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "full_name",
            "phone",
            "linkedin_url",
            "github_url",
            "portfolio_url",
            "skills",
            "education",
            "is_email_verified",
            "is_staff",
            "is_active",
            "role",
            "is_admin",
            "application_count",
            "date_joined",
            "last_login",
        )
        read_only_fields = (
            "id",
            "email",
            "username",
            "is_email_verified",
            "is_staff",
            "is_admin",
            "application_count",
            "date_joined",
            "last_login",
        )

    def get_is_admin(self, obj):
        return obj.is_admin_role

    def validate_role(self, value):
        if value not in (UserRole.STUDENT, UserRole.ADMIN):
            raise serializers.ValidationError("Invalid role.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "full_name", "password", "password_confirm")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        email = validated_data["email"]
        username = email.split("@")[0][:40]
        base = username
        i = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{i}"
            i += 1
        user = User(username=username, role=UserRole.STUDENT, **validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        validate_password(value)
        return value
