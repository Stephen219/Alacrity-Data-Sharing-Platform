from django.urls import path
from .views import (Make_request,view_requests)

urlpatterns = [ 
    path('makerequest/', Make_request.as_view(), name='make_request'), 
    path('viewrequests/', view_requests, name='view_requests'), 
]

