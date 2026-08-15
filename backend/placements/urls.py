from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EligibleStudentViewSet,
    MyEligibleCompaniesView,
    MyPlacementApplicationsView,
    PlacementAnnouncementAdminViewSet,
    PlacementApplicationAdminViewSet,
    PlacementCompanyViewSet,
    PlacementDashboardView,
    PublicAnnouncementView,
)

router = DefaultRouter()
router.register("companies", PlacementCompanyViewSet, basename="placement-companies")
router.register("eligible-students", EligibleStudentViewSet, basename="eligible-students")
router.register("admin/applications", PlacementApplicationAdminViewSet, basename="placement-admin-apps")
router.register("admin/announcements", PlacementAnnouncementAdminViewSet, basename="placement-admin-ann")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/", PlacementDashboardView.as_view(), name="placement-dashboard"),
    # Student endpoints
    path("my/eligible-companies/", MyEligibleCompaniesView.as_view(), name="my-eligible-companies"),
    path("my/applications/", MyPlacementApplicationsView.as_view(), name="my-placement-apps"),
    path("announcements/", PublicAnnouncementView.as_view(), name="placement-announcements"),
]
