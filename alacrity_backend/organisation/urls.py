from django.urls import path
from .views import AddContributor

urlpatterns = [

    path('add_contributor/', AddContributor.as_view(), name='add_contributor'),

]