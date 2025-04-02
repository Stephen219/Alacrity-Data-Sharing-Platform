from django.db import models
from django.db.models import Count, Value, F, functions
from django.utils.timezone import now
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.db.models import Count
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import permission_classes
from django.core.mail import send_mail
from alacrity_backend.config import FRONTEND_URL
from research.serializers import AnalysisSubmissionSerializer , PublishedResearchSerializer
from users.decorators import role_required
from .models import AnalysisSubmission , PublishedResearch
from rest_framework.generics import ListAPIView
from datasets.models import Dataset
from django.conf import settings
from html.parser import HTMLParser
from notifications.models import Notification
from users.models import User
from rest_framework import status
from django.utils.html import strip_tags


class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []

    def handle_data(self, data):
        self.text.append(data)

    def get_text(self):
        return ''.join(self.text)

def strip_html(html):
    stripper = HTMLStripper()
    stripper.feed(html)
    return stripper.get_text()

class SaveSubmissionView(APIView):
    permission_classes = [IsAuthenticated]
    @role_required(['contributor', 'organization_admin', 'researcher'])
    def post(self, request):
        """
        Allows researchers to save drafts or submit for review.
        Notifies organisations when submission submitted for review 
        """
        try:
            data = request.data
            researcher = request.user
            submission_id = data.get("id")
            dataset_id = data.get("dataset_id")

            # Ensure new submissions always have a dataset
            if not dataset_id:
                return Response({"error": "Dataset ID is required to submit research."}, status=400)

            dataset = get_object_or_404(Dataset, dataset_id=dataset_id)

            if submission_id:
                submission = get_object_or_404(AnalysisSubmission, id=submission_id, researcher=researcher)

                # Prevents editing after approval
                if submission.status in ['approved', 'published']:
                    return Response({"error": "Approved research cannot be modified."}, status=400)
            else:
                submission = AnalysisSubmission(researcher=researcher)

            submission.title = data.get("title", submission.title)
            submission.description = data.get("description", submission.description)
            submission.raw_results = data.get("rawResults", submission.raw_results)
            submission.summary = data.get("summary", submission.summary)
            submission.status = data.get("status", submission.status)

            if dataset_id:
                dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
                submission.dataset = dataset
            elif submission.status == "published" and not submission.dataset:
                raise ValidationError("A dataset must be linked before publishing.")

            if len(submission.title.split()) > 15:
                raise ValidationError("Title cannot exceed 15 words.")
            if len(submission.summary.split()) > 250:
                raise ValidationError("Summary cannot exceed 250 words.")
            if "image" in request.FILES:
                submission.image = request.FILES["image"]

            if submission.status == "published":
                if not all([submission.title, submission.description, submission.raw_results, submission.summary]):
                    raise ValidationError("All fields must be filled before publishing.")
                
            if submission.status == "published":
                submission.status = "pending"

            submission.save()

            if submission.status == "pending":
                # finds the organisation that owns this dataset
                # The dataset has dataset.contributor_id, which is a user with .organisation
                org_id = submission.dataset.contributor_id.organization_id  # might be None if no org
                if org_id:
                    clean_title = strip_html(submission.title)

                    # 2) finds all org admins in that org
                    org_admins = User.objects.filter(
                        organization_id=org_id,
                        role='organization_admin'
                    )
                    # 3) creates a notification for each admin
                    for admin_user in org_admins:
                        Notification.objects.create(
                            user=admin_user,
                            message=f"A new research submission '{clean_title}' by {researcher.email} is pending your approval.",
                            link=f"{FRONTEND_URL}/requests/submissions/{submission.id}"
                        )
                    
                    # 4) also sends them an email
                    email_subject = "New Research Submission Pending Approval"
                    email_body = (
                        f"Hello,\n\n"
                        f"A new research submission '{submission.title}' by {researcher.email} requires your approval.\n"
                        f"Please log in to review it.\n\n"
                        f"Best regards,\nAlacrity Team"
                    )
                    for admin_user in org_admins:
                        try:
                            send_mail(
                                subject=email_subject,
                                message=email_body,
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                recipient_list=[admin_user.email],
                                fail_silently=False,
                            )
                        except Exception as e:
                            print(f"Failed to email {admin_user.email} about new submission: {e}")
                else:
                    print("No organisation found for this dataset's contributor.")

            return Response({
                "message": "Submission saved successfully!",
                "id": submission.id,
                "status": submission.status,
                "image": request.build_absolute_uri(submission.image.url) if submission.image else None,
                "dataset_id": submission.dataset.dataset_id if submission.dataset else None
            }, status=200)

        except ValidationError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        
class PendingSubmissionsView(ListAPIView):
    """
    Retrieves all pending research submissions that require approval.
    Only accessible to organization admins.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AnalysisSubmissionSerializer

    @role_required(['organization_admin'])
    def get(self, request, *args, **kwargs):
        pending_submissions = AnalysisSubmission.objects.filter(status="pending")
        
        # serializer returns JSON data
        serializer = self.serializer_class(pending_submissions, many=True)
        return Response(serializer.data)

        
class ApproveRejectSubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['organization_admin'])
    def get(self, request, submission_id):
        """
        Retrieve a single submission details for review.
        """
        submission = get_object_or_404(AnalysisSubmission, id=submission_id, status="pending")
        serializer = AnalysisSubmissionSerializer(submission)
        return Response(serializer.data, status=200)

    @role_required(['organization_admin'])
    def post(self, request, submission_id):
        """
        Allows an organization admin to approve or reject a research submission.
        Sends an email notification to the researcher.
        """
        action = request.data.get('action')
        admin = request.user
        message = request.data.get('message', '')

        submission = get_object_or_404(AnalysisSubmission, id=submission_id)

        if submission.status not in ['pending']:
            return Response({"error": "This research has already been reviewed."}, status=400)
        
        clean_title = strip_html(submission.title)
        clean_message = strip_html(message)

        if action == "approve":
            submission.status = "published"
            email_subject = "Your Research Submission Has Been Approved!"
            email_body = f"Dear Researcher,\n\nYour research submission '{clean_title} ' has been approved and is now published.\n\nMessage from the organisation:\n{message}\n\nBest Regards,\nAdmin Team"
            Notification.objects.create(
                user=submission.researcher,
                message=f"Your research submission '{clean_title}' has been approved and published.",
                link=f"{FRONTEND_URL}/researcher/allSubmissions/view/{submission.id}"
    )
        elif action == "reject":
            submission.status = "rejected"
            email_subject = "Your Research Submission Has Been Rejected"
            email_body = f"Dear Researcher,\n\nYour research submission '{clean_title} ' has been rejected.\n\nMessage from the organization:\n{message}\n\nBest Regards,\nAdmin Team"
            Notification.objects.create(
                user=submission.researcher,
                message=f"Your research submission '{clean_title}' has been rejected. Check your emails for more information."
    )
        else:
            return Response({"error": "Invalid action."}, status=400)

        submission.save()

        # Send notification email
        try:
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[submission.researcher.email],
                fail_silently=False,
            )
            email_status = "Email successfully sent."
        except Exception as e:
            email_status = f"Email failed to send: {str(e)}"

        return Response({
            "message": f"Research {action}ed successfully.",
            "email_status": email_status  # Send status to UI
        }, status=200)




class AnalysisSubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def get(self, request):
        """
        Retrieve published and private submissions for the logged-in researcher.
        Excludes soft-deleted submissions.
        """
        researcher = request.user
        sort_order = request.GET.get('sort', 'newest') 

        if sort_order == 'oldest':
            submissions = AnalysisSubmission.objects.filter(
                researcher=researcher, status="published", deleted_at__isnull=True
            ).order_by('submitted_at')
        else:
            submissions = AnalysisSubmission.objects.filter(
                researcher=researcher, status="published", deleted_at__isnull=True
            ).order_by('-submitted_at')

        return Response(submissions.values())
    
class TogglePrivacyView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def patch(self, request, submission_id):
        """
        Toggle the privacy status of a published submission.
        """
        try:
            researcher = request.user
            submission = get_object_or_404(
                AnalysisSubmission, id=submission_id, researcher=researcher, status="published"
            )

            submission.is_private = not submission.is_private
            submission.save()

            cache.delete("all_submissions") 

            return Response({"message": "Privacy status updated", "is_private": submission.is_private}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)



class DraftSubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def get(self, request):
        """
        Retrieve only draft submissions for the logged-in researcher.
        """
        researcher = request.user
        sort_order = request.GET.get("sort", "newest")

        if sort_order == "oldest":
            drafts = AnalysisSubmission.objects.filter(
                researcher=researcher, 
                status="draft", 
                deleted_at__isnull=True 
            ).order_by("submitted_at")
        else:
            drafts = AnalysisSubmission.objects.filter(
                researcher=researcher, 
                status="draft", 
                deleted_at__isnull=True 
            ).order_by("-submitted_at")

        return Response(drafts.values())


class ViewSubmissionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Retrieve all publicly available research (published submissions only).
        Excludes soft-deleted and private submissions.
        Uses caching for faster response times.
        """
        cache_key = "all_submissions"
        cache.delete(cache_key)  # Clears old cache before updating

        # Fetches all published research 
        all_published_submissions = list(
            AnalysisSubmission.objects.filter(
                status="published", deleted_at__isnull=True, is_private=False
            )
            .select_related("researcher")  
            .annotate(
                full_name=functions.Concat(
                    F("researcher__first_name"),
                    Value(" "),
                    F("researcher__sur_name"),
                    output_field=models.CharField(),
                ),
                bookmark_count=Count("bookmarked_by")
            )
            .values(
                "id",
                "title",
                "summary",
                "description",
                "submitted_at",
                "image",
                "full_name",
                "bookmark_count",
                "is_private"
            )
        )

        # Get recent submissions (latest 10)
        recent_submissions = sorted(all_published_submissions, key=lambda x: x["submitted_at"], reverse=True)[:10]

        # Get popular submissions (most bookmarked, latest first)
        popular_submissions = sorted(all_published_submissions, key=lambda x: (x["bookmark_count"], x["submitted_at"]), reverse=True)[:10]

        response_data = {
            "all_published_submissions": all_published_submissions,
            "recent_submissions": recent_submissions,
            "popular_submissions": popular_submissions,
        }

        # Cache for 60 seconds
        cache.set(cache_key, response_data, timeout=60)

        return Response(response_data)




class EditSubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def put(self, request, submission_id):
        """
        Allows researchers to edit their drafts or publish them.
        """
        try:
            researcher = request.user
            data = request.data
            submission = get_object_or_404(AnalysisSubmission, id=submission_id, researcher=researcher, deleted_at__isnull=True)

            # Updates fields
            submission.title = data.get("title", submission.title)
            submission.description = data.get("description", submission.description)
            submission.raw_results = data.get("raw_results", submission.raw_results)
            submission.summary = data.get("summary", submission.summary)
            submission.status = data.get("status", submission.status)

            # Validates before publishing
            if submission.status == "published":
                if not all([submission.title, submission.description, submission.raw_results, submission.summary]):
                    raise ValidationError("All fields must be filled before publishing.")

            submission.save()
            return Response({"message": "Draft updated successfully!", "id": submission.id, "status": submission.status}, status=200)

        except ValidationError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class DeleteSubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def delete(self, request, submission_id):
        """
        Soft deletes a draft or submission by setting 'deleted_at'.
        """
        try:
            researcher = request.user
            submission = get_object_or_404(AnalysisSubmission, id=submission_id, researcher=researcher)

            if submission.deleted_at:
                return Response({"error": "Already deleted"}, status=400)

            submission.deleted_at = now()
            submission.save()
            return Response({"message": "Moved to Recently Deleted"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)
        

class ToggleBookmarkView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'organization_admin', 'researcher'])
    def post(self, request, submission_id):
        """
        Allows authenticated users to bookmark/unbookmark an analysis submission.
        """
        user = request.user
        submission = get_object_or_404(AnalysisSubmission, id=submission_id, status="published")

        if submission.bookmarked_by.filter(id=user.id).exists():
            submission.bookmarked_by.remove(user)
            bookmarked = False
        else:
            submission.bookmarked_by.add(user)
            bookmarked = True

        # Count how many users have bookmarked it now
        bookmark_count = submission.bookmarked_by.count()

        # Return bookmark status + count
        return Response({
            "bookmarked": bookmarked,
            "bookmark_count": bookmark_count
        }, status=200)


class UserBookmarksView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'organization_admin', 'researcher'])
    def get(self, request):
        """
        Retrieve all bookmarked submissions of the logged-in user.
        """
        user = request.user
        bookmarks = user.bookmarked_submissions.filter(status="published").values()
        return Response(bookmarks)

class RestoreSubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, submission_id):
        """
        Restores a soft-deleted submission back to its original status.
        """
        researcher = request.user
        submission = get_object_or_404(AnalysisSubmission, id=submission_id, researcher=researcher)

        if not submission.is_deleted():
            return Response({"error": "Submission is not deleted"}, status=400)

        submission.deleted_at = None
        submission.save()
        return Response({"message": "Submission restored successfully", "status": submission.status}, status=200)
    
class PermanentlyDeleteSubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def delete(self, request, submission_id):
        """
        Permanently deletes a soft-deleted submission.
        """
        try:
            researcher = request.user
            submission = get_object_or_404(AnalysisSubmission, id=submission_id, researcher=researcher)

            if not submission.deleted_at:
                return Response({"error": "Submission must be in Recently Deleted before permanent deletion"}, status=400)

            submission.delete()
            return Response({"message": "Submission permanently deleted"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)



class GetRecentlyDeletedView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def get(self, request):
        """
        Retrieve all submissions in 'Recently Deleted' with sorting.
        """
        researcher = request.user
        sort_order = request.GET.get("sort", "newest")  

        if sort_order == "oldest":
            deleted_submissions = AnalysisSubmission.objects.filter(
                researcher=researcher, deleted_at__isnull=False
            ).order_by("deleted_at")  
        else:
            deleted_submissions = AnalysisSubmission.objects.filter(
                researcher=researcher, deleted_at__isnull=False
            ).order_by("-deleted_at")  

        return Response(deleted_submissions.values())


class DeleteDraftView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def delete(self, request, submission_id):
        """
        Soft deletes a draft by setting 'deleted_at'.
        """
        try:
            researcher = request.user
            draft = get_object_or_404(AnalysisSubmission, id=submission_id, researcher=researcher, status="draft")

            if draft.deleted_at:
                return Response({"error": "Draft is already deleted"}, status=400)

            draft.deleted_at = now()
            draft.save()

            return Response({"message": "Draft moved to Recently Deleted"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)
        

class GetDraftView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def get(self, request, submission_id):
        """
        Retrieve a single draft submission by ID for editing.
        """
        researcher = request.user
        draft = get_object_or_404(
            AnalysisSubmission, 
            id=submission_id, 
            researcher=researcher, 
            status__in=["draft", "rejected"],
            deleted_at__isnull=True
        )

        return Response({
            "id": draft.id,
            "title": draft.title,
            "description": draft.description,
            "raw_results": draft.raw_results,
            "summary": draft.summary,
            "status": draft.status,
            "submitted_at": draft.submitted_at,
            "image": request.build_absolute_uri(draft.image.url) if draft.image else None,
            "dataset_id": draft.dataset.dataset_id if draft.dataset else None,
        }, status=200)

class ViewSingleSubmissionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, submission_id):
        """
        Retrieve a single submission (excluding image). Uses caching for faster access.
        """
        cache_key = f"submission_{submission_id}"
        cached_submission = cache.get(cache_key)

        if cached_submission:
            return Response(cached_submission)

        submission = get_object_or_404(
            AnalysisSubmission.objects.only(
                "id", "title", "description", "raw_results", "summary", "submitted_at"
            ),
            id=submission_id, status="published", deleted_at__isnull=True
        )

        response_data = {
            "id": submission.id,
            "title": submission.title,
            "description": submission.description,
            "raw_results": submission.raw_results,
            "summary": submission.summary,
            "submitted_at": submission.submitted_at
        }

        cache.set(cache_key, response_data, timeout=60)
        return Response(response_data)


class ViewSingleBookmarkedSubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, submission_id):
        """
        Retrieve a single bookmarked submission for the logged-in user.
        Uses caching for faster responses.
        """
        user = request.user
        cache_key = f"bookmarked_submission_{user.id}_{submission_id}"
        cached_submission = cache.get(cache_key)

        if cached_submission:
            return Response(cached_submission)

        submission = get_object_or_404(
            AnalysisSubmission.objects.only(
                "id", "title", "description", "raw_results", "summary", "submitted_at"
            ),
            id=submission_id, status="published", deleted_at__isnull=True
        )

        if not submission.bookmarked_by.filter(id=user.id).exists():
            return Response({"error": "Submission is not bookmarked by the user"}, status=403)

        response_data = {
            "id": submission.id,
            "title": submission.title,
            "description": submission.description,
            "raw_results": submission.raw_results,
            "summary": submission.summary,
            "submitted_at": submission.submitted_at
        }

        cache.set(cache_key, response_data, timeout=60)
        return Response(response_data)

class SubmittedSubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher'])
    def get(self, request):
        """
        Retrieve status on submissions that were submitted for approval.
        """
        researcher = request.user
        submissions = AnalysisSubmission.objects.filter(
            researcher=researcher,
            status__in=["pending", "published", "rejected"],
            deleted_at__isnull=True
        ).order_by('-submitted_at')
        
        # Convert queryset to a list of dictionaries.
        data = list(submissions.values('id', 'title', 'status', 'submitted_at'))
        
        # Clean HTML tags from the title of each submission.
        for submission in data:
            submission['title'] = strip_tags(submission['title'])
        
        return Response(data)


class FollowedReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        followed_users = user.following.all()
        
        reports = PublishedResearch.objects.filter(
            research_submission__researcher__in=followed_users,
            research_submission__status='published',
            is_private=False
        ).select_related('research_submission__researcher')

        serializer = PublishedResearchSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class Random_repotsInDB(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = PublishedResearch.objects.all().order_by('?')[:5]
        serializer = PublishedResearchSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)