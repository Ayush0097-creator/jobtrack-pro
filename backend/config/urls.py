from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/applications/", include("applications.urls")),
    path("api/interviews/", include("interviews.urls")),
    path("api/resumes/", include("resumes.urls")),
    path("api/ai/", include("ai_engine.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/analytics/", include("applications.analytics_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
