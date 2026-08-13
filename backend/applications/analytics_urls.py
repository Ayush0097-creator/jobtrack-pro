from django.urls import path

from .views import AdminAnalyticsView, AdminApplicationListView, AnalyticsOverviewView

urlpatterns = [
    path("overview/", AnalyticsOverviewView.as_view(), name="analytics_overview"),
    path("admin/", AdminAnalyticsView.as_view(), name="admin_analytics"),
    path("admin/applications/", AdminApplicationListView.as_view(), name="admin_applications"),
]
