from django.urls import path
from .views import LoginView, CSRFTokenView, RegisterView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('csrf-token/', CSRFTokenView.as_view(), name='csrf-token'),
    path("register/", RegisterView.as_view(), name="register"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]