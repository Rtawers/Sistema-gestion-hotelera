from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

api_v1 = [
    path("auth/", include("apps.users.urls")),
    path("", include("apps.hoteleria.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),

    # API v1
    path("api/v1/", include(api_v1)),

    # Documentación API
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# ─────────────────────────────────────────────────────────────
# Solo en DESARROLLO
# ─────────────────────────────────────────────────────────────
if settings.DEBUG:
    # Servir archivos media
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # Django Debug Toolbar (registra el namespace 'djdt')
    import debug_toolbar
    urlpatterns += [
        path("__debug__/", include(debug_toolbar.urls)),
    ]