from django.urls import path
from .views import  RegisterView
# from rest_framfework_simplejwt.views import TokenRefreshView
# add login viejw
 
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
]