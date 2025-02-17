from django.urls import path
from .views import create_dataset, descriptive_statistics, get_datasets, pre_analysis

urlpatterns = [
    path('create_dataset/',create_dataset, name='create_dataset'),
    # path('sign_up/',sign_up, name='sign_up'),
    path('testget/',get_datasets, name='testget'),

    path("", get_datasets, name="get_datasets"),
    path("analysis/pre-analysis/<str:dataset_id>/", pre_analysis, name="pre-analysis"),
    path("analysis/descriptive/<str:dataset_id>/", descriptive_statistics, name="descriptive-statistics"),
]
