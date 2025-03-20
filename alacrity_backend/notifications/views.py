from django.shortcuts import get_object_or_404, render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from notifications.models import Notification

class NotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        return Response({"count": unread_count}, status=200)
    
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        notifications = Notification.objects.filter(user=user).order_by("-created_at")
        data = [
            {
                "id": str(n.id),
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
                "link": n.link,
            }
            for n in notifications
        ]
        return Response(data, status=200)
    
class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        """
        Mark all notifications for user as read.
        """
        user = request.user
        Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."}, status=200)
    
class DeleteSingleNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, notif_id):
        user = request.user
        notif = get_object_or_404(Notification, id=notif_id, user=user)
        notif.delete() 
        return Response({"message": "Notification deleted."}, status=200)


