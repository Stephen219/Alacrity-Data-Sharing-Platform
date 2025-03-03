from django.urls import path
from .views import (Make_request,)

urlpatterns = [
    path('makerequest/', Make_request.as_view(), name='make_request'),
]
