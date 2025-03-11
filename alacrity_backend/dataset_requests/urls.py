from django.urls import path
<<<<<<< HEAD
from .views import (Make_request,ViewAllDatasetRequests,AcceptRejectRequest)
=======

from .views import (Make_request,ViewAllDatasetRequests, ViewDatasetAccess)

from .views import (Make_request,ViewAllDatasetRequests,AcceptRejectRequest)

>>>>>>> 5524f00ebdb33e0df9be2315414415e6435c2b7f

urlpatterns = [ 
    path('makerequest/', Make_request.as_view(), name='make_request'), 
    path('viewrequests/',ViewAllDatasetRequests.as_view(), name='view_requests'),
<<<<<<< HEAD
    path('acceptreject/<str:id>/', AcceptRejectRequest.as_view(), name='accept_reject'),
=======

    path('dataset/access/<str:dataset_id>/', ViewDatasetAccess.as_view(), name='dataset_access'),

    path('acceptreject/<str:id>/', AcceptRejectRequest.as_view(), name='accept_reject'),

>>>>>>> 5524f00ebdb33e0df9be2315414415e6435c2b7f
]

