from django.urls import path
from .views import (
    get_recently_deleted,
    get_user_bookmarks,
    permanently_delete_submission,
    restore_submission,
    save_submission,
    get_analysis_submissions,  
    get_draft_submissions,  
    edit_analysis_submission,
    delete_analysis_submission,
    toggle_bookmark,
    view_submissions,
    delete_draft_submission
)

urlpatterns = [
    path("submissions/save/", save_submission, name="save_submission"),
    path("submissions/", get_analysis_submissions, name="get_analysis_submissions"),  
    path("drafts/", get_draft_submissions, name="get_draft_submissions"),  
    path("submissions/edit/<int:submission_id>/", edit_analysis_submission, name="edit_analysis_submission"),
    path("submissions/delete/<int:submission_id>/", delete_analysis_submission, name="delete_analysis_submission"),
    path("submissions/restore/<int:submission_id>/", restore_submission, name="restore_submission"),
    path("submissions/permanent-delete/<int:submission_id>/", permanently_delete_submission, name="permanently_delete_submission"),
    path("submissions/recently-deleted/", get_recently_deleted, name="get_recently_deleted"),
    path("submissions/view/", view_submissions, name="view_submissions"),
    path('bookmark/<int:submission_id>/', toggle_bookmark, name='toggle-bookmark'),
    path('bookmarks/', get_user_bookmarks, name='get-user-bookmarks'),
    path("drafts/delete/<int:submission_id>/", delete_draft_submission, name="delete_draft"),
]

