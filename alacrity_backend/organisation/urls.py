from django.urls import path
from .views import (AddContributors, ActivateContributorAccount,
                    FollowOrganizationView, OrganizationDatasetsView,
                    OrganizationProfileView, UnfollowOrganizationView,
                     RegisterOrganizationView)

urlpatterns = [
    path('add_contributor/', AddContributors.as_view(), name='add_contributor'),
    path('activate_contributor/', ActivateContributorAccount.as_view(), name='activate_contributor'),
    path('register-org/', RegisterOrganizationView.as_view(), name='register_organization'),





    path('<str:org_id>/', OrganizationProfileView.as_view(), name='organization-profile'),
    path('<str:org_id>/datasets/', OrganizationDatasetsView.as_view(), name='organization-datasets'),
    path('follow/<str:org_id>/', FollowOrganizationView.as_view(), name='follow-organization'),
    path('unfollow/<str:org_id>/', UnfollowOrganizationView.as_view(), name='unfollow-organization'),
]
