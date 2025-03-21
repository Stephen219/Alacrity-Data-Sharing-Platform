from django.urls import path


from .views import (Make_request,View_pending,AcceptRejectRequest,view_requests)


urlpatterns = [ 
    path('makerequest/', Make_request.as_view(), name='make_request'), 
    path('viewpending/',View_pending.as_view(), name='view_requests'),
    path('acceptreject/<str:id>/', AcceptRejectRequest.as_view(), name='accept_reject'),
     path('viewrequests/', view_requests.as_view(), name='view_requests'),
    # path('dataset/access/<str:dataset_id>/', ViewDatasetAccess.as_view(), name='dataset_access'),
]

