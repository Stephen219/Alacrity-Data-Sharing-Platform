# urls.py
from django.urls import path
from .views import AddContributors

urlpatterns = [
    path('add_contributor/', AddContributors.as_view(), name='add_contributor'),
]
