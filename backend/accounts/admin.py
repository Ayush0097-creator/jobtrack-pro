from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import EmailVerificationToken, PasswordResetToken, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "full_name", "role", "is_staff", "is_email_verified", "date_joined")
    list_filter = ("role", "is_staff", "is_email_verified", "is_active")
    search_fields = ("email", "full_name", "username")
    ordering = ("-date_joined",)
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Profile",
            {
                "fields": (
                    "full_name",
                    "role",
                    "phone",
                    "linkedin_url",
                    "github_url",
                    "portfolio_url",
                    "skills",
                    "education",
                    "is_email_verified",
                    "avatar",
                )
            },
        ),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {"fields": ("email", "full_name", "role")}),
    )


admin.site.register(EmailVerificationToken)
admin.site.register(PasswordResetToken)
