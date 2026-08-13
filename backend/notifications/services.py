from django.conf import settings
from django.core.mail import send_mail

from .models import Notification


def create_notification(user, title, message, category="system", link="", send_email=False):
    n = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        category=category,
        link=link,
    )
    if send_email:
        send_mail(
            subject=f"[JobTrack Pro] {title}",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
        n.email_sent = True
        n.save(update_fields=["email_sent"])
    return n
