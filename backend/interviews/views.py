from datetime import timedelta

from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from notifications.services import create_notification

from .models import Interview
from .serializers import InterviewSerializer


class InterviewFilter(filters.FilterSet):
    date_from = filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = filters.DateFilter(field_name="date", lookup_expr="lte")
    company = filters.CharFilter(field_name="company_name", lookup_expr="icontains")
    round = filters.CharFilter(field_name="round")

    class Meta:
        model = Interview
        fields = ["company", "round", "application"]


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    filterset_class = InterviewFilter
    search_fields = ["company_name", "interviewer_name", "notes", "feedback"]
    ordering_fields = ["date", "time", "created_at"]
    ordering = ["date", "time"]

    def get_queryset(self):
        return Interview.objects.filter(user=self.request.user).select_related("application")

    def perform_create(self, serializer):
        interview = serializer.save(user=self.request.user)
        create_notification(
            user=self.request.user,
            title=f"Interview scheduled: {interview.company_name}",
            message=f"{interview.get_round_display()} on {interview.date}",
            category="interview",
            link="/app/interviews",
        )

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        today = timezone.localdate()
        qs = self.get_queryset().filter(date__gte=today, date__lte=today + timedelta(days=14))
        return Response(InterviewSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def calendar(self, request):
        qs = self.filter_queryset(self.get_queryset())
        events = [
            {
                "id": i.id,
                "title": f"{i.company_name} — {i.get_round_display()}",
                "date": i.date.isoformat(),
                "time": i.time.isoformat() if i.time else None,
                "company_name": i.company_name,
                "round": i.round,
                "meeting_link": i.meeting_link,
            }
            for i in qs
        ]
        return Response(events)
