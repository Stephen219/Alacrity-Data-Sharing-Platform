from django.urls import path
from .views import AddContributors, GetContributors

urlpatterns = [
    path('add_contributor/', AddContributors.as_view(), name='add_contributor'),
    path('contributors/', GetContributors.as_view(), name='get_contributors'),
]
