from django.urls import path
from .views import DeleteSingleNotificationView, MarkAllReadView, NotificationCountView, NotificationListView

urlpatterns = [
    path('count/', NotificationCountView.as_view(), name='notification-count'),
    path('list/', NotificationListView.as_view(), name='notification-list'),
    path('mark_all_read/', MarkAllReadView.as_view(), name='mark-all-read'),

    path('<str:notif_id>/delete/', DeleteSingleNotificationView.as_view(), name='delete-notification'),
]
