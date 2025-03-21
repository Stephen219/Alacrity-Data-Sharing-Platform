from django.urls import path
from .views import (Make_request,ViewAllDatasetRequests,AcceptRejectRequest)

from .views import (Make_request,ViewAllDatasetRequests)

from .views import (Make_request,ViewAllDatasetRequests,AcceptRejectRequest, user_requests)


urlpatterns = [ 
    path('makerequest/', Make_request.as_view(), name='make_request'), 
    path('viewrequests/',ViewAllDatasetRequests.as_view(), name='view_requests'),
    path('acceptreject/<str:id>/', AcceptRejectRequest.as_view(), name='accept_reject'),
    path('userrequests/', user_requests.as_view(), name='user_requests'),


    # path('dataset/access/<str:dataset_id>/', ViewDatasetAccess.as_view(), name='dataset_access'),

    path('acceptreject/<str:id>/', AcceptRejectRequest.as_view(), name='accept_reject'),

]

