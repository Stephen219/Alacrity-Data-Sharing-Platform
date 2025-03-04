from django.urls import path
from .views import (
    DeleteDraftView,
    SaveSubmissionView,
    AnalysisSubmissionsView,
    DraftSubmissionsView,
    EditSubmissionView,
    DeleteSubmissionView,
    RestoreSubmissionView,
    GetRecentlyDeletedView,
    PermanentlyDeleteSubmissionView,
    ViewSubmissionsView,
    ToggleBookmarkView,
    UserBookmarksView,
)

urlpatterns = [
    path("submissions/save/", SaveSubmissionView.as_view(), name="save_submission"),
    path("submissions/", AnalysisSubmissionsView.as_view(), name="get_analysis_submissions"),  
    path("drafts/", DraftSubmissionsView.as_view(), name="get_draft_submissions"),  
    path("submissions/edit/<int:submission_id>/", EditSubmissionView.as_view(), name="edit_analysis_submission"),
    path("submissions/delete/<int:submission_id>/", DeleteSubmissionView.as_view(), name="delete_analysis_submission"),
    path("submissions/restore/<int:submission_id>/", RestoreSubmissionView.as_view(), name="restore_submission"),
    path("submissions/permanent-delete/<int:submission_id>/", PermanentlyDeleteSubmissionView.as_view(), name="permanently_delete_submission"),
    path("submissions/recently-deleted/", GetRecentlyDeletedView.as_view(), name="get_recently_deleted"),
    path("submissions/view/", ViewSubmissionsView.as_view(), name="view_submissions"),
    path("bookmark/<int:submission_id>/", ToggleBookmarkView.as_view(), name="toggle-bookmark"),
    path("bookmarks/", UserBookmarksView.as_view(), name="get-user-bookmarks"),
    path("drafts/delete/<int:submission_id>/", DeleteDraftView.as_view(), name="soft_delete_draft"),
]
