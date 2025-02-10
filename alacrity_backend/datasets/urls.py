from django.urls import path
from .views import create_dataset, sign_up

urlpatterns = [
    path('create_dataset/',create_dataset, name='create_dataset'),
    path('sign_up/',sign_up, name='sign_up'),
]
