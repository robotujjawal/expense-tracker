from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie

urlpatterns = [
    # Ensure the CSRF cookie is set when serving the single-page app so
    # the frontend can perform authenticated POST requests.
    path('', ensure_csrf_cookie(TemplateView.as_view(template_name='index.html')), name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('tracker.urls')),
]
