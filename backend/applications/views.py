from django.db.models import Count, Q
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ApplicationStatus, JobApplication
from .serializers import JobApplicationSerializer, KanbanReorderSerializer


class JobApplicationFilter(filters.FilterSet):
    company = filters.CharFilter(field_name="company_name", lookup_expr="icontains")
    role = filters.CharFilter(field_name="job_title", lookup_expr="icontains")
    status = filters.CharFilter(field_name="status")
    location = filters.CharFilter(field_name="location", lookup_expr="icontains")
    source = filters.CharFilter(field_name="source")
    date_from = filters.DateFilter(field_name="application_date", lookup_expr="gte")
    date_to = filters.DateFilter(field_name="application_date", lookup_expr="lte")
    salary_min = filters.NumberFilter(field_name="salary", lookup_expr="gte")
    salary_max = filters.NumberFilter(field_name="salary", lookup_expr="lte")

    class Meta:
        model = JobApplication
        fields = ["company", "role", "status", "location", "source", "work_type"]


class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    filterset_class = JobApplicationFilter
    search_fields = ["company_name", "job_title", "location", "notes"]
    ordering_fields = ["created_at", "updated_at", "deadline", "salary", "application_date", "company_name"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        qs = JobApplication.objects.select_related("resume", "job_match")
        if self.request.user.is_staff and self.request.query_params.get("all") == "1":
            return qs
        return qs.filter(user=self.request.user)

    @action(detail=False, methods=["post"], url_path="kanban-reorder")
    def kanban_reorder(self, request):
        serializer = KanbanReorderSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        ids = [item["id"] for item in serializer.validated_data]
        apps = {
            a.id: a
            for a in JobApplication.objects.filter(user=request.user, id__in=ids)
        }
        updated = []
        for item in serializer.validated_data:
            app = apps.get(item["id"])
            if not app:
                continue
            app.status = item["status"]
            app.board_order = item["board_order"]
            updated.append(app)
        if updated:
            JobApplication.objects.bulk_update(updated, ["status", "board_order", "updated_at"])
        return Response({"updated": len(updated)})

    @action(detail=False, methods=["get"])
    def board(self, request):
        qs = self.filter_queryset(self.get_queryset()).order_by("board_order", "-updated_at")
        data = {status_key: [] for status_key, _ in ApplicationStatus.choices}
        for app in qs:
            data.setdefault(app.status, []).append(JobApplicationSerializer(app).data)
        return Response(data)


class AnalyticsOverviewView(APIView):
    def get(self, request):
        qs = JobApplication.objects.filter(user=request.user)
        total = qs.count()
        applied = qs.exclude(status=ApplicationStatus.SAVED).count()
        interviews = qs.filter(
            status__in=[
                ApplicationStatus.INTERVIEW_R1,
                ApplicationStatus.INTERVIEW_R2,
                ApplicationStatus.HR_ROUND,
                ApplicationStatus.OA_CLEARED,
                ApplicationStatus.ONLINE_ASSESSMENT,
            ]
        ).count()
        rejections = qs.filter(status=ApplicationStatus.REJECTED).count()
        offers = qs.filter(status=ApplicationStatus.OFFER).count()
        decided = offers + rejections
        offer_rate = round((offers / decided) * 100, 1) if decided else 0.0
        interview_conversion = round((interviews / applied) * 100, 1) if applied else 0.0

        by_status = list(qs.values("status").annotate(count=Count("id")).order_by("status"))
        by_source = list(qs.values("source").annotate(count=Count("id")).order_by("-count"))

        source_success = []
        for row in by_source:
            source = row["source"]
            source_qs = qs.filter(source=source)
            src_total = source_qs.count()
            src_interviews = source_qs.filter(
                status__in=[
                    ApplicationStatus.INTERVIEW_R1,
                    ApplicationStatus.INTERVIEW_R2,
                    ApplicationStatus.HR_ROUND,
                    ApplicationStatus.OFFER,
                ]
            ).count()
            src_offers = source_qs.filter(status=ApplicationStatus.OFFER).count()
            source_success.append(
                {
                    "source": source,
                    "applications": src_total,
                    "interview_rate": round((src_interviews / src_total) * 100, 1) if src_total else 0,
                    "offers": src_offers,
                }
            )
        source_success.sort(key=lambda x: (x["offers"], x["interview_rate"]), reverse=True)

        monthly = (
            qs.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        weekly = (
            qs.annotate(week=TruncWeek("created_at"))
            .values("week")
            .annotate(count=Count("id"))
            .order_by("week")
        )

        return Response(
            {
                "cards": {
                    "total_applications": total,
                    "applied_jobs": applied,
                    "interviews_scheduled": interviews,
                    "rejections": rejections,
                    "offers_received": offers,
                    "offer_rate": offer_rate,
                    "interview_conversion_rate": interview_conversion,
                },
                "by_status": by_status,
                "by_source": by_source,
                "source_success": source_success,
                "applications_per_month": [
                    {"month": m["month"].date().isoformat() if m["month"] else None, "count": m["count"]}
                    for m in monthly
                ],
                "weekly_activity": [
                    {"week": w["week"].date().isoformat() if w["week"] else None, "count": w["count"]}
                    for w in weekly
                ],
                "generated_at": timezone.now().isoformat(),
            }
        )


class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from django.db.models.functions import TruncMonth
        from ai_engine.models import AIUsageLog
        from interviews.models import Interview
        from resumes.models import Resume

        User = get_user_model()
        students = User.objects.filter(role="student").count()
        admins = User.objects.filter(role="admin").count()
        active_students = User.objects.filter(role="student", is_active=True).count()

        status_dist = list(
            JobApplication.objects.values("status").annotate(count=Count("id")).order_by("-count")
        )
        monthly = (
            JobApplication.objects.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        recent_ai = list(
            AIUsageLog.objects.select_related("user")
            .order_by("-created_at")[:15]
            .values("id", "feature", "provider", "success", "created_at", "user__email")
        )

        return Response(
            {
                "users": User.objects.count(),
                "students": students,
                "admins": admins,
                "active_students": active_students,
                "applications": JobApplication.objects.count(),
                "interviews": Interview.objects.count(),
                "resumes": Resume.objects.count(),
                "ai_calls": AIUsageLog.objects.count(),
                "ai_by_feature": list(
                    AIUsageLog.objects.values("feature").annotate(count=Count("id")).order_by("-count")
                ),
                "applications_by_status": status_dist,
                "applications_per_month": [
                    {
                        "month": m["month"].date().isoformat() if m["month"] else None,
                        "count": m["count"],
                    }
                    for m in monthly
                ],
                "recent_ai": recent_ai,
            }
        )


class AdminApplicationListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from .serializers import JobApplicationSerializer

        qs = JobApplication.objects.select_related("user", "resume").order_by("-updated_at")
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        if search:
            qs = qs.filter(
                Q(company_name__icontains=search)
                | Q(job_title__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__full_name__icontains=search)
            )
        if status_filter:
            qs = qs.filter(status=status_filter)
        qs = qs[:200]
        data = []
        for app in qs:
            row = JobApplicationSerializer(app).data
            row["student_email"] = app.user.email
            row["student_name"] = app.user.full_name or app.user.username
            data.append(row)
        return Response({"count": len(data), "results": data})
