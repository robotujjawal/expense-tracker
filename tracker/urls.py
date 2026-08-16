from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet, TransactionViewSet, SummaryView,
)
from .auth_api import LoginView, SignupView, LogoutView, CurrentUserView

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/signup/', SignupView.as_view(), name='api-signup'),
    path('auth/logout/', LogoutView.as_view(), name='api-logout'),
    path('auth/user/', CurrentUserView.as_view(), name='api-current-user'),
    path('summary/', SummaryView.as_view(), name='summary'),
    path('', include(router.urls)),
]
