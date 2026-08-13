from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from applications.models import JobApplication
from interviews.models import Interview
from notifications.services import create_notification

from django.utils import timezone
from datetime import timedelta

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "title", "message", "category", "link", "is_read", "created_at")
        read_only_fields = fields


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        n = self.get_object()
        n.is_read = True
        n.save(update_fields=["is_read"])
        return Response(NotificationSerializer(n).data)

    @action(detail=False, methods=["post"])
    def read_all(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"updated": updated})

    @action(detail=False, methods=["post"])
    def refresh_reminders(self, request):
        """Create in-app reminders for upcoming interviews and deadlines."""
        user = request.user
        today = timezone.localdate()
        created = 0

        for interview in Interview.objects.filter(
            user=user, date__gte=today, date__lte=today + timedelta(days=2), reminder_sent=False
        ):
            create_notification(
                user=user,
                title=f"Upcoming interview: {interview.company_name}",
                message=f"{interview.get_round_display()} on {interview.date}",
                category="interview",
                link="/app/interviews",
                send_email=True,
            )
            interview.reminder_sent = True
            interview.save(update_fields=["reminder_sent"])
            created += 1

        for app in JobApplication.objects.filter(
            user=user, deadline__gte=today, deadline__lte=today + timedelta(days=3)
        ).exclude(status="rejected"):
            exists = Notification.objects.filter(
                user=user,
                category="deadline",
                title__icontains=app.company_name,
                created_at__date=today,
            ).exists()
            if not exists:
                create_notification(
                    user=user,
                    title=f"Deadline soon: {app.company_name}",
                    message=f"{app.job_title} deadline is {app.deadline}",
                    category="deadline",
                    link="/app/applications",
                    send_email=True,
                )
                created += 1

        return Response({"created": created})
