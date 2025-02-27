from django.urls import path
from .views import AddContributors, ActivateContributorAccount

urlpatterns = [
    path('add_contributor/', AddContributors.as_view(), name='add_contributor'),
    path('activate_contributor/', ActivateContributorAccount.as_view(), name='activate_contributor'),
]
