from django.urls import path
from .views import (Make_request,ViewAllDatasetRequests)

urlpatterns = [ 
    path('makerequest/', Make_request.as_view(), name='make_request'), 
    path('viewrequests/',ViewAllDatasetRequests.as_view(), name='view_requests'),
]

