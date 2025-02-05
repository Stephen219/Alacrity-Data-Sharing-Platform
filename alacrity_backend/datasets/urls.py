from django.urls import path
from . import views

urlpatterns = [
    path('create_dataset/', views.create_dataset, name='create_dataset'),
]
