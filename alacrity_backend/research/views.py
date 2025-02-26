from django.views.decorators.csrf import csrf_protect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.decorators import role_required
from .models import AnalysisSubmission
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils.timezone import now

@csrf_protect
@role_required(['contributor'])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_submission(request):
    """
    Allows researchers to save drafts or submit final research.
    """
    try:
        data = request.data  
        researcher = request.user  

        submission_id = data.get("id")
        if submission_id:
            submission = AnalysisSubmission.objects.get(id=submission_id, researcher=researcher)
        else:
            submission = AnalysisSubmission(researcher=researcher)

        submission.title = data.get("title", submission.title)
        submission.description = data.get("description", submission.description)
        submission.raw_results = data.get("rawResults", submission.raw_results)
        submission.summary = data.get("summary", submission.summary)
        submission.status = data.get("status", submission.status)

        if "image" in request.FILES:
            submission.image = request.FILES["image"]
            print("Image Received:", submission.image) 

        # Validate before publishing
        if submission.status == "published":
            if not submission.title or not submission.description or not submission.raw_results or not submission.summary:
                raise ValidationError("All fields must be filled before publishing.")

        submission.save()
        return Response({
            "message": "Submission saved successfully!", 
            "id": submission.id, 
            "status": submission.status, 
            "image": request.build_absolute_uri(submission.image.url) if submission.image else None
        }, status=200)

    except AnalysisSubmission.DoesNotExist:
        return Response({"error": "Submission not found or unauthorized"}, status=403)
    except ValidationError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print("Error Saving Submission:", e)
        return Response({"error": str(e)}, status=400)

@csrf_protect
@role_required(['contributor'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])  
def get_analysis_submissions(request):
    """
    Retrieve only published submissions for the logged-in researcher.
    Excludes soft-deleted submissions.
    """
    researcher = request.user
    submissions = AnalysisSubmission.objects.filter(
        researcher=researcher,
        status="published",
        deleted_at__isnull=True  
    ).values()
    
    return Response(submissions)

@csrf_protect
@role_required(['contributor'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])  
def get_draft_submissions(request):
    """
    Retrieve only draft submissions for the logged-in researcher.
    """
    researcher = request.user
    drafts = AnalysisSubmission.objects.filter(researcher=researcher, status="draft").values()
    return Response(drafts)

@api_view(['GET'])
@permission_classes([AllowAny])
def view_submissions(request):
    """
    Retrieve all publicly available research (published submissions only).
    Excludes soft-deleted submissions.
    """
    recent_submissions = AnalysisSubmission.objects.filter(
        status="published",
        deleted_at__isnull=True
    ).order_by('-submitted_at')[:10]

    popular_submissions = AnalysisSubmission.objects.filter(
        status="published",
        deleted_at__isnull=True
    ).annotate(bookmark_count=Count('bookmarked_by')).order_by('-bookmark_count', '-submitted_at')[:10]

    def serialize_submission(submission):
        return {
            "id": submission.id,
            "title": submission.title,
            "description": submission.description,
            "raw_results": submission.raw_results,
            "summary": submission.summary,
            "submitted_at": submission.submitted_at,
            "image": request.build_absolute_uri(submission.image.url) if submission.image else None
        }

    return Response({
        "recent_submissions": [serialize_submission(sub) for sub in recent_submissions],
        "popular_submissions": [serialize_submission(sub) for sub in popular_submissions]
    })



@api_view(['PUT'])
@permission_classes([IsAuthenticated])  
def edit_analysis_submission(request, submission_id):
    """
    Allows researchers to edit their drafts or publish them.
    """
    try:
        researcher = request.user
        data = request.data

        submission = AnalysisSubmission.objects.filter(id=submission_id, researcher=researcher, deleted_at__isnull=True).first()

        if not submission:
            return Response({"error": "Draft not found or unauthorized"}, status=403)

        # Update fields
        submission.title = data.get("title", submission.title)
        submission.description = data.get("description", submission.description)
        submission.raw_results = data.get("rawResults", submission.raw_results)
        submission.summary = data.get("summary", submission.summary)
        submission.status = data.get("status", submission.status)

        # Validate before publishing
        if submission.status == "published":
            if not submission.title or not submission.description or not submission.raw_results or not submission.summary:
                raise ValidationError("All fields must be filled before publishing.")

        submission.save()
        return Response({"message": "Draft updated successfully!", "id": submission.id, "status": submission.status}, status=200)

    except AnalysisSubmission.DoesNotExist:
        return Response({"error": "Draft not found or unauthorized"}, status=403)
    except ValidationError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])  
def delete_analysis_submission(request, submission_id):
    """
    Soft deletes a draft or submission by setting 'deleted_at'.
    """
    try:
        researcher = request.user
        submission = AnalysisSubmission.objects.filter(id=submission_id, researcher=researcher).first()

        if not submission:
            return Response({"error": "Submission/Draft not found or unauthorized"}, status=403)

        if submission.deleted_at:
            return Response({"error": "Already deleted"}, status=400)

        submission.deleted_at = now()
        submission.save()
        return Response({"message": "Moved to Recently Deleted"}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=400)

    

@api_view(['POST'])
@role_required(['contributor', 'organization_admin'])
@permission_classes([IsAuthenticated])
def toggle_bookmark(request, submission_id):
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
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_bookmarks(request):
    """
    Retrieve all bookmarked submissions of the logged-in user.
    """
    user = request.user
    bookmarks = user.bookmarked_submissions.filter(status="published").values()
    return Response(bookmarks)

@api_view(['POST'])
@permission_classes([IsAuthenticated])  
def restore_submission(request, submission_id):
    """
    Restores a soft-deleted submission back to its original status.
    """
    try:
        researcher = request.user
        submission = AnalysisSubmission.objects.get(id=submission_id, researcher=researcher)

        if not submission.is_deleted():
            return Response({"error": "Submission is not deleted"}, status=400)

        submission.deleted_at = None
        submission.save()
        return Response({"message": "Submission restored successfully", "status": submission.status}, status=200)

    except AnalysisSubmission.DoesNotExist:
        return Response({"error": "Submission not found or unauthorized"}, status=403)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])  
def permanently_delete_submission(request, submission_id):
    """
    Permanently deletes a soft-deleted submission.
    """
    try:
        researcher = request.user
        submission = AnalysisSubmission.objects.get(id=submission_id, researcher=researcher)

        if not submission.is_deleted():
            return Response({"error": "Submission must be in Recently Deleted before permanent deletion"}, status=400)

        submission.delete()
        return Response({"message": "Submission permanently deleted"}, status=200)

    except AnalysisSubmission.DoesNotExist:
        return Response({"error": "Submission not found or unauthorized"}, status=403)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])  
def get_recently_deleted(request):
    """
    Retrieve all submissions in 'Recently Deleted'.
    """
    researcher = request.user
    deleted_submissions = AnalysisSubmission.objects.filter(researcher=researcher, deleted_at__isnull=False).values()
    return Response(deleted_submissions)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])  
def delete_draft_submission(request, submission_id):
    """
    Soft deletes a draft by setting 'deleted_at'.
    """
    try:
        researcher = request.user
        draft = AnalysisSubmission.objects.filter(id=submission_id, researcher=researcher, status="draft").first()

        if not draft:
            return Response({"error": "Draft not found or unauthorized"}, status=404)

        if draft.deleted_at:
            return Response({"error": "Draft already deleted"}, status=400)

        draft.deleted_at = now()
        draft.save()
        return Response({"message": "Draft moved to Recently Deleted"}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=400)



