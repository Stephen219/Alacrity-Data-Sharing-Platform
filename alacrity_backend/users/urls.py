from django.urls import path
from .views import  RegisterView
# from rest_framfework_simplejwt.views import TokenRefreshView
# add login vhiejw
from .views import  RegisterView, LoginView, UserView
from rest_framework_simplejwt.views import TokenRefreshView

 
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("login/", LoginView.as_view(), name="login"),

    path("profile/", UserView.as_view(), name="user"),



]