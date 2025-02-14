from django.urls import path
from .views import  RegisterView
# from rest_framework_simplejwt.views import TokenRefreshView
 
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
]