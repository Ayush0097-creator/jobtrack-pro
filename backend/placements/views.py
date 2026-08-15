from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import EligibleStudent, PlacementAnnouncement, PlacementApplication, PlacementCompany
from .serializers import (
    EligibleStudentSerializer,
    PlacementAnnouncementSerializer,
    PlacementApplicationSerializer,
    PlacementCompanySerializer,
)

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.role == "admin" or request.user.is_superuser)
        )


# ─── Admin: Company Management ────────────────────────────────────────────────

class PlacementCompanyViewSet(ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = PlacementCompanySerializer
    queryset = PlacementCompany.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="compute-eligible")
    def compute_eligible(self, request, pk=None):
        """Auto-compute eligible students based on criteria and add them."""
        company = self.get_object()
        students = User.objects.filter(role="student", is_active=True)

        if company.min_cgpa:
            students = students.filter(cgpa__gte=company.min_cgpa)
        if company.graduation_year:
            students = students.filter(graduation_year=company.graduation_year)
        if company.allowed_branches:
            students = students.filter(branch__in=company.allowed_branches)
        if company.max_backlogs == 0:
            students = students.filter(backlogs=0)
        elif company.max_backlogs > 0:
            students = students.filter(backlogs__lte=company.max_backlogs)

        added, skipped = 0, 0
        for student in students:
            _, created = EligibleStudent.objects.get_or_create(
                company=company,
                student=student,
                defaults={"added_by": request.user, "is_eligible": True},
            )
            if created:
                added += 1
            else:
                skipped += 1

        return Response({"added": added, "skipped": skipped, "total": added + skipped})


# ─── Admin: Eligible Students ─────────────────────────────────────────────────

class EligibleStudentViewSet(ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = EligibleStudentSerializer

    def get_queryset(self):
        qs = EligibleStudent.objects.select_related("student", "company", "added_by")
        company_id = self.request.query_params.get("company")
        if company_id:
            qs = qs.filter(company_id=company_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

    @action(detail=False, methods=["post"], url_path="bulk-add")
    def bulk_add(self, request):
        """Add multiple students to a company at once."""
        company_id = request.data.get("company")
        student_ids = request.data.get("student_ids", [])
        if not company_id or not student_ids:
            return Response({"detail": "company and student_ids required."}, status=400)
        try:
            company = PlacementCompany.objects.get(id=company_id)
        except PlacementCompany.DoesNotExist:
            return Response({"detail": "Company not found."}, status=404)

        added, skipped = 0, 0
        for sid in student_ids:
            try:
                student = User.objects.get(id=sid, role="student")
                _, created = EligibleStudent.objects.get_or_create(
                    company=company,
                    student=student,
                    defaults={"added_by": request.user, "is_eligible": True},
                )
                if created:
                    added += 1
                else:
                    skipped += 1
            except User.DoesNotExist:
                skipped += 1
        return Response({"added": added, "skipped": skipped})


# ─── Admin: Application Management ───────────────────────────────────────────

class PlacementApplicationAdminViewSet(ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = PlacementApplicationSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = PlacementApplication.objects.select_related("student", "company")
        company_id = self.request.query_params.get("company")
        status_filter = self.request.query_params.get("status")
        if company_id:
            qs = qs.filter(company_id=company_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


# ─── Admin: Announcements ─────────────────────────────────────────────────────

class PlacementAnnouncementAdminViewSet(ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = PlacementAnnouncementSerializer

    def get_queryset(self):
        return PlacementAnnouncement.objects.select_related("company", "created_by")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        ann = self.get_object()
        ann.is_published = True
        ann.save(update_fields=["is_published"])
        return Response({"detail": "Published.", "is_published": True})

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk=None):
        ann = self.get_object()
        ann.is_published = False
        ann.save(update_fields=["is_published"])
        return Response({"detail": "Unpublished.", "is_published": False})


# ─── Admin: Dashboard ─────────────────────────────────────────────────────────

class PlacementDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        companies = PlacementCompany.objects.all()
        total = companies.count()
        active = companies.filter(is_active=True).count()
        total_eligible = EligibleStudent.objects.filter(is_eligible=True).count()
        total_apps = PlacementApplication.objects.count()
        total_selected = PlacementApplication.objects.filter(
            status=PlacementApplication.Status.SELECTED
        ).count()
        total_ann = PlacementAnnouncement.objects.count()

        breakdown = []
        for c in companies.order_by("-created_at")[:10]:
            breakdown.append({
                "id": c.id,
                "name": c.name,
                "job_role": c.job_role,
                "package_lpa": c.package_lpa,
                "eligible": c.eligible_students.filter(is_eligible=True).count(),
                "applied": c.applications.count(),
                "shortlisted": c.applications.filter(status="shortlisted").count(),
                "selected": c.applications.filter(status="selected").count(),
                "is_active": c.is_active,
                "visit_date": c.visit_date,
                "registration_deadline": c.registration_deadline,
            })

        return Response({
            "total_companies": total,
            "active_companies": active,
            "total_eligible_entries": total_eligible,
            "total_applications": total_apps,
            "total_selected": total_selected,
            "total_announcements": total_ann,
            "company_breakdown": breakdown,
        })


# ─── Student: My Eligible Companies ──────────────────────────────────────────

class MyEligibleCompaniesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        eligibilities = EligibleStudent.objects.filter(
            student=request.user, is_eligible=True, company__is_active=True
        ).select_related("company")

        data = []
        for e in eligibilities:
            c = e.company
            applied = PlacementApplication.objects.filter(
                company=c, student=request.user
            ).first()
            is_deadline_passed = (
                c.registration_deadline and c.registration_deadline < timezone.now()
            )
            data.append({
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "logo_url": c.logo_url,
                "website": c.website,
                "job_role": c.job_role,
                "job_location": c.job_location,
                "package_lpa": c.package_lpa,
                "registration_deadline": c.registration_deadline,
                "visit_date": c.visit_date,
                "is_deadline_passed": is_deadline_passed,
                "application_status": applied.status if applied else None,
                "applied": applied is not None,
            })
        return Response(data)


# ─── Student: Apply & Track ───────────────────────────────────────────────────

class MyPlacementApplicationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        apps = PlacementApplication.objects.filter(
            student=request.user
        ).select_related("company")
        serializer = PlacementApplicationSerializer(apps, many=True)
        return Response(serializer.data)

    def post(self, request):
        company_id = request.data.get("company")
        if not company_id:
            return Response({"detail": "company required."}, status=400)
        try:
            company = PlacementCompany.objects.get(id=company_id, is_active=True)
        except PlacementCompany.DoesNotExist:
            return Response({"detail": "Company not found."}, status=404)

        # Check eligibility
        is_eligible = EligibleStudent.objects.filter(
            company=company, student=request.user, is_eligible=True
        ).exists()
        if not is_eligible:
            return Response(
                {"detail": "You are not eligible for this company."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check deadline
        if company.registration_deadline and company.registration_deadline < timezone.now():
            return Response({"detail": "Registration deadline has passed."}, status=400)

        app, created = PlacementApplication.objects.get_or_create(
            company=company, student=request.user
        )
        if not created:
            return Response({"detail": "Already applied."}, status=400)

        serializer = PlacementApplicationSerializer(app)
        return Response(serializer.data, status=201)


# ─── Student: Announcements (read-only) ───────────────────────────────────────

class PublicAnnouncementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = PlacementAnnouncement.objects.filter(is_published=True).select_related("company")
        category = request.query_params.get("category")
        company_id = request.query_params.get("company")
        if category:
            qs = qs.filter(category=category)
        if company_id:
            qs = qs.filter(company_id=company_id)
        serializer = PlacementAnnouncementSerializer(qs, many=True)
        return Response(serializer.data)
