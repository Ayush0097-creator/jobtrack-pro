from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["full_name"] = user.full_name
        token["role"] = getattr(user, "role", "student")
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "full_name": self.user.full_name,
            "is_staff": self.user.is_staff,
            "is_email_verified": self.user.is_email_verified,
            "role": getattr(self.user, "role", "student"),
            "is_admin": getattr(self.user, "is_admin_role", self.user.is_staff),
        }
        return data


class AdminTokenObtainPairSerializer(EmailTokenObtainPairSerializer):
    """Login endpoint restricted to admin portal users."""

    def validate(self, attrs):
        data = super().validate(attrs)
        if not getattr(self.user, "is_admin_role", False):
            raise serializers.ValidationError(
                {"detail": "Admin credentials required for this portal."}
            )
        return data


class StudentTokenObtainPairSerializer(EmailTokenObtainPairSerializer):
    """Student portal login — admins are redirected by the frontend, but can still authenticate."""

    def validate(self, attrs):
        return super().validate(attrs)
