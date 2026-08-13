from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        from django.db.models.signals import post_save
        from django.dispatch import receiver
        from django.contrib.auth import get_user_model

        User = get_user_model()

        @receiver(post_save, sender=User)
        def sync_admin_role(sender, instance, **kwargs):
            if instance.is_superuser and instance.role != "admin":
                User.objects.filter(pk=instance.pk).update(role="admin", is_staff=True)
