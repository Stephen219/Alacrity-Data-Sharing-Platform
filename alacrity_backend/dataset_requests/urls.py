from django.urls import path


from .views import (Make_request, UserDatasetRequestsView,View_pending,request_actions,view_requests)


urlpatterns = [ 
    path('makerequest/', Make_request.as_view(), name='make_request'), 
    path('viewpending/',View_pending.as_view(), name='view_requests'),
    path('requestaction/<str:id>/', request_actions.as_view(), name='request_actions'),
     path('viewrequests/', view_requests.as_view(), name='view_requests'),
     path('userrequests/', UserDatasetRequestsView.as_view(), name='user-dataset-requests'),
    # path('dataset/access/<str:dataset_id>/', ViewDatasetAccess.as_view(), name='dataset_access'),
]

