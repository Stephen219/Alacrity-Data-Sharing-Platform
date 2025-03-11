from django.urls import path

from .views import (Make_request,ViewAllDatasetRequests, ViewDatasetAccess)

from .views import (Make_request,ViewAllDatasetRequests,AcceptRejectRequest)


urlpatterns = [ 
    path('makerequest/', Make_request.as_view(), name='make_request'), 
    path('viewrequests/',ViewAllDatasetRequests.as_view(), name='view_requests'),

    path('dataset/access/<str:dataset_id>/', ViewDatasetAccess.as_view(), name='dataset_access'),

    path('acceptreject/<str:id>/', AcceptRejectRequest.as_view(), name='accept_reject'),

]

