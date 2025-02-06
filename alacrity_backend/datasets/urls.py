from django.urls import path
from .views import create_dataset

urlpatterns = [
    path('create_dataset/',create_dataset, name='create_dataset'),
]
