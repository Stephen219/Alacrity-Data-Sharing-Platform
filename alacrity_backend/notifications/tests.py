from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import get_user_model
User = get_user_model()

from notifications.models import Notification

class NotificationTestCase(APITestCase):
    def setUp(self):
        """
        Create a test user and a few notifications for them.
        """
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="testpass"
        )
        #  authenticate
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create some notifications
        self.notif1 = Notification.objects.create(
            user=self.user,
            message="Unread notification 1",
            is_read=False
        )
        self.notif2 = Notification.objects.create(
            user=self.user,
            message="Unread notification 2",
            is_read=False
        )
        self.notif3 = Notification.objects.create(
            user=self.user,
            message="Read notification",
            is_read=True
        )

    def test_notification_count_unread(self):
        """
        Returns number of unread notifications.
        """
        url = reverse("notification-count")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)


    def test_mark_all_read(self):
        """
        Mark all notifications for the user as read.
        """
        url = reverse("mark-all-read")
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("All notifications marked as read.", response.data["message"])

        # Verify all notifications for user are now read
        notif_qs = Notification.objects.filter(user=self.user)
        self.assertTrue(all(n.is_read for n in notif_qs))

    def test_delete_single_notification(self):
        """
        Delete a single notification.
        """
        # delete notif1
        url = reverse("delete-notification", kwargs={"notif_id": str(self.notif1.id)})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Notification deleted.", response.data["message"])

        # Check that notif1 is no longer in the database
        self.assertFalse(Notification.objects.filter(id=self.notif1.id).exists())

    def test_delete_not_owned_notification(self):
        """
        Attempting to delete a notification that doesn't belong to the user
        should 404 (not found).
        """
        # Create a second user, a second user's notification
        other_user = User.objects.create_user(
            username="otheruser",
            email="otheruser@example.com",
            password="password"
        )
        other_notif = Notification.objects.create(
            user=other_user,
            message="Notification not owned by testuser",
            is_read=False
        )

        # Try to delete the other user's notification
        url = reverse("delete-notification", kwargs={"notif_id": str(other_notif.id)})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
