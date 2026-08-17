import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Automatically create or update a superuser from environment variables or defaults (Render-friendly)"

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, help="Superuser email")
        parser.add_argument("--username", type=str, help="Superuser username")
        parser.add_argument("--password", type=str, help="Superuser password")
        parser.add_argument("--full-name", type=str, help="Superuser full name")

    def handle(self, *args, **options):
        email = (
            options.get("email")
            or os.getenv("DJANGO_SUPERUSER_EMAIL")
            or "admin@jobtrackpro.com"
        ).strip().lower()

        username = (
            options.get("username")
            or os.getenv("DJANGO_SUPERUSER_USERNAME")
            or email.split("@")[0]
        ).strip()

        password = (
            options.get("password")
            or os.getenv("DJANGO_SUPERUSER_PASSWORD")
            or "Admin@12345"
        )

        full_name = (
            options.get("full_name")
            or os.getenv("DJANGO_SUPERUSER_FULL_NAME")
            or "Administrator"
        ).strip()

        if not email or not password:
            self.stderr.write(self.style.ERROR("Email and password are required."))
            return

        try:
            user = User.objects.filter(email__iexact=email).first()

            if user:
                # If changing username, make sure it's not taken by another user
                if username and username != user.username:
                    candidate = username
                    i = 1
                    while User.objects.filter(username=candidate).exclude(id=user.id).exists():
                        candidate = f"{username}_{i}"
                        i += 1
                    user.username = candidate

                user.full_name = full_name or user.full_name
                user.role = "admin"
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.is_email_verified = True
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Superuser '{email}' updated successfully (username: {user.username}) with admin & staff privileges."
                    )
                )
            else:
                candidate = username
                i = 1
                while User.objects.filter(username=candidate).exists():
                    candidate = f"{username}_{i}"
                    i += 1

                user = User.objects.create(
                    email=email,
                    username=candidate,
                    full_name=full_name,
                    role="admin",
                    is_staff=True,
                    is_superuser=True,
                    is_active=True,
                    is_email_verified=True,
                )
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Superuser '{email}' created successfully with username '{candidate}'."
                    )
                )
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error creating superuser: {e}"))
