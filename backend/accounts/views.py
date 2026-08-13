import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import EmailVerificationToken, PasswordResetToken
from .serializers import (
    AdminUserSerializer,
    ChangePasswordSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .tokens import AdminTokenObtainPairSerializer, EmailTokenObtainPairSerializer, StudentTokenObtainPairSerializer

User = get_user_model()


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def send_verification_email(user, token):
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_mail(
        subject="Verify your JobTrack Pro email",
        message=f"Hi {user.full_name or user.email},\n\nVerify your account:\n{link}\n",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = secrets.token_urlsafe(32)
        EmailVerificationToken.objects.create(user=user, token=token)
        send_verification_email(user, token)
        data = {
            "user": UserSerializer(user).data,
            **tokens_for_user(user),
            "message": "Registered successfully. Check your email to verify (console in DEBUG).",
        }
        return Response(data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = StudentTokenObtainPairSerializer


class AdminLoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = AdminTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Logged out."})


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": ["Incorrect password."]}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password updated."})


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"detail": "Token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            record = EmailVerificationToken.objects.select_related("user").get(token=token, used=False)
        except EmailVerificationToken.DoesNotExist:
            return Response({"detail": "Invalid or used token."}, status=status.HTTP_400_BAD_REQUEST)
        if record.created_at < timezone.now() - timedelta(days=2):
            return Response({"detail": "Token expired."}, status=status.HTTP_400_BAD_REQUEST)
        record.used = True
        record.save()
        record.user.is_email_verified = True
        record.user.save(update_fields=["is_email_verified"])
        return Response({"detail": "Email verified."})


class ResendVerificationView(APIView):
    def post(self, request):
        user = request.user
        if user.is_email_verified:
            return Response({"detail": "Already verified."})
        token = secrets.token_urlsafe(32)
        EmailVerificationToken.objects.create(user=user, token=token)
        send_verification_email(user, token)
        return Response({"detail": "Verification email sent."})


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "If that email exists, a reset link was sent."})
        token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(user=user, token=token)
        link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_mail(
            subject="Reset your JobTrack Pro password",
            message=f"Reset your password:\n{link}\n",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
        return Response({"detail": "If that email exists, a reset link was sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        try:
            record = PasswordResetToken.objects.select_related("user").get(token=token, used=False)
        except PasswordResetToken.DoesNotExist:
            return Response({"detail": "Invalid or used token."}, status=status.HTTP_400_BAD_REQUEST)
        if record.created_at < timezone.now() - timedelta(hours=24):
            return Response({"detail": "Token expired."}, status=status.HTTP_400_BAD_REQUEST)
        user = record.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        record.used = True
        record.save()
        return Response({"detail": "Password reset successful."})


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    search_fields = ["email", "full_name", "username"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        from django.db.models import Count

        return User.objects.annotate(application_count=Count("applications")).order_by("-date_joined")


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all()

    def get_queryset(self):
        from django.db.models import Count

        return User.objects.annotate(application_count=Count("applications"))

    def perform_update(self, serializer):
        user = serializer.save()
        # Keep staff flag in sync when role changes via admin API
        if user.role == "admin":
            user.is_staff = True
            user.save(update_fields=["is_staff"])
        elif not user.is_superuser:
            user.is_staff = False
            user.save(update_fields=["is_staff"])
