from django.utils.timezone import now
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.db.models import Count

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import permission_classes

from users.decorators import role_required
from .models import AnalysisSubmission

from datasets.models import Dataset


class SaveSubmissionView(APIView):
    permission_classes = [IsAuthenticated]
    @role_required(['contributor'])
    def post(self, request):
        """
        Allows researchers to save drafts or submit final research.
        """
        try:
            data = request.data
            researcher = request.user
            submission_id = data.get("id")
            dataset_id = data.get("dataset_id")

            if submission_id:
                submission = get_object_or_404(AnalysisSubmission, id=submission_id, researcher=researcher)
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

            submission.save()
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



class AnalysisSubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor'])
    def get(self, request):
        """
        Retrieve only published submissions for the logged-in researcher.
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


class DraftSubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    @role_required(['contributor'])
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
        Excludes soft-deleted submissions.
        Uses caching for faster response times.
        """
        cache_key = "all_submissions"
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response(cached_data)

        # Fetches only necessary fields now n uses values() for faster query
        recent_submissions = list(
            AnalysisSubmission.objects.filter(
                status="published", deleted_at__isnull=True
            )
            .only("id", "title", "summary", "submitted_at", "image")
            .order_by('-submitted_at')[:10]
            .values()
        )

        popular_submissions = list(
            AnalysisSubmission.objects.filter(
                status="published", deleted_at__isnull=True
            )
            .annotate(bookmark_count=Count("bookmarked_by"))
            .only("id", "title", "summary", "submitted_at", "image")
            .order_by('-bookmark_count', '-submitted_at')[:10]
            .values()
        )

        response_data = {
            "recent_submissions": recent_submissions,
            "popular_submissions": popular_submissions
        }

        cache.set(cache_key, response_data, timeout=60) 
        return Response(response_data)



class EditSubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, submission_id):
        """
        Allows researchers to edit their drafts or publish them.
        """
        try:
            researcher = request.user
            data = request.data
            submission = get_object_or_404(AnalysisSubmission, id=submission_id, researcher=researcher, deleted_at__isnull=True)

            # Update fields
            submission.title = data.get("title", submission.title)
            submission.description = data.get("description", submission.description)
            submission.raw_results = data.get("raw_results", submission.raw_results)
            submission.summary = data.get("summary", submission.summary)
            submission.status = data.get("status", submission.status)

            # Validate before publishing
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

    @role_required(['contributor', 'organization_admin'])
    def post(self, request, submission_id):
        """
        Allows authenticated users to bookmark/unbookmark an analysis submission.
        """
        user = request.user
        submission = get_object_or_404(AnalysisSubmission, id=submission_id, status="published")

        if submission.bookmarked_by.filter(id=user.id).exists():
            submission.bookmarked_by.remove(user)
            return Response({"message": "Bookmark removed", "bookmarked": False}, status=200)
        else:
            submission.bookmarked_by.add(user)
            return Response({"message": "Bookmarked successfully", "bookmarked": True}, status=200)


class UserBookmarksView(APIView):
    permission_classes = [IsAuthenticated]

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

    @role_required(['contributor'])
    def get(self, request, submission_id):
        """
        Retrieve a single draft submission by ID for editing.
        """
        researcher = request.user
        draft = get_object_or_404(
            AnalysisSubmission, 
            id=submission_id, 
            researcher=researcher, 
            status="draft", 
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
            "image": request.build_absolute_uri(draft.image.url) if draft.image else None
        }, status=200)

from django.core.cache import cache

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

    
from django.core.cache import cache

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



