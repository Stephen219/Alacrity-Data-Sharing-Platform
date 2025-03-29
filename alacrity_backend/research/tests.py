import unittest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from django.contrib.auth import get_user_model
User = get_user_model()

import users.decorators
users.decorators.role_required = lambda roles: (lambda view_func: view_func)

#importing models
from datasets.models import Dataset
from research.models import AnalysisSubmission
from notifications.models import Notification


class SaveSubmissionViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="researcher1",
            email="researcher1@example.com",
            password="testpass"
        )
        self.user.role = "researcher"
        self.user.save()

        self.dataset = Dataset.objects.create(
            dataset_id="DS100",
            title="Test Dataset",
            price=100,
            schema="{}",
            contributor_id=self.user
        )
        self.url = reverse("save_submission")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_save_draft_submission(self):
        payload = {
            "dataset_id": self.dataset.dataset_id,
            "title": "Draft Title",
            "description": "Draft Description",
            "rawResults": "Some raw results",
            "summary": "Short summary",
            "status": "draft"
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Submission saved successfully!", response.data["message"])
        self.assertIsNotNone(response.data.get("id"))
        self.assertEqual(response.data.get("status"), "draft")

    def test_validation_on_publish(self):
        payload = {
            "dataset_id": self.dataset.dataset_id,
            "title": "",
            "description": "Description",
            "rawResults": "Results",
            "summary": "Summary",
            "status": "published"
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)


class ApproveRejectSubmissionViewTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="orgadmin",
            email="admin@example.com",
            password="adminpass"
        )
        self.admin.role = "organization_admin"
        self.admin.save()
        
        self.researcher = User.objects.create_user(
            username="researcher2",
            email="researcher2@example.com",
            password="testpass"
        )
        self.researcher.role = "researcher"
        self.researcher.save()

        self.dataset = Dataset.objects.create(
            dataset_id="DS200",
            title="Dataset for Review",
            price=50,
            schema="{}",
            contributor_id=self.researcher
        )
        self.submission = AnalysisSubmission.objects.create(
            researcher=self.researcher,
            title="Pending Submission",
            description="Desc",
            raw_results="Raw",
            summary="Summary",
            dataset=self.dataset,
            status="pending"
        )
        self.url = reverse("review_submission", kwargs={"submission_id": self.submission.id})
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_get_submission_for_review(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], self.submission.id)

    @patch("research.views.send_mail")
    def test_reject_submission(self, mock_send_mail):
        payload = {
            "action": "reject",
            "message": "Not acceptable."
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("rejected successfully", response.data["message"])
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, "rejected")
        mock_send_mail.assert_called()


class TogglePrivacyViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="researcher3",
            email="researcher3@example.com",
            password="testpass"
        )
        self.user.role = "researcher"
        self.user.save()
        self.dataset = Dataset.objects.create(
            dataset_id="DS300",
            title="Privacy Test Dataset",
            price=0,
            schema="{}",
            contributor_id=self.user
        )
        self.submission = AnalysisSubmission.objects.create(
            researcher=self.user,
            title="Published Submission",
            description="Desc",
            raw_results="Raw",
            summary="Summary",
            dataset=self.dataset,
            status="published",
            is_private=False
        )
        self.url = reverse("toggle_privacy", kwargs={"submission_id": self.submission.id})
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_toggle_privacy(self):
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["is_private"], True)
        self.submission.refresh_from_db()
        self.assertTrue(self.submission.is_private)


class ToggleBookmarkViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="researcher4",
            email="researcher4@example.com",
            password="testpass"
        )
        self.user.role = "researcher"
        self.user.save()
        self.dataset = Dataset.objects.create(
            dataset_id="DS400",
            title="Bookmark Dataset",
            price=0,
            schema="{}",
            contributor_id=self.user
        )
        self.submission = AnalysisSubmission.objects.create(
            researcher=self.user,
            title="Submission to Bookmark",
            description="Desc",
            raw_results="Raw",
            summary="Summary",
            dataset=self.dataset,
            status="published"
        )
        self.url = reverse("toggle-bookmark", kwargs={"submission_id": self.submission.id})
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_toggle_bookmark_add(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["bookmarked"])
        self.assertEqual(response.data["bookmark_count"], 1)

    def test_toggle_bookmark_remove(self):
        self.client.post(self.url) ##adds
        response = self.client.post(self.url) #removes bookmark
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["bookmarked"])
        self.assertEqual(response.data["bookmark_count"], 0)


class RestoreSubmissionViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="researcher5",
            email="researcher5@example.com",
            password="testpass"
        )
        self.user.role = "researcher"
        self.user.save()
        self.dataset = Dataset.objects.create(
            dataset_id="DS500",
            title="Restore Dataset",
            price=0,
            schema="{}",
            contributor_id=self.user
        )
        self.submission = AnalysisSubmission.objects.create(
            researcher=self.user,
            title="Deleted Submission",
            description="Desc",
            raw_results="Raw",
            summary="Summary",
            dataset=self.dataset,
            status="draft"
        )
        self.submission.deleted_at = now()
        self.submission.save()

        self.url = reverse("restore_submission", kwargs={"submission_id": self.submission.id})
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_restore_submission(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Submission restored successfully", response.data["message"])
        self.submission.refresh_from_db()
        self.assertIsNone(self.submission.deleted_at)
