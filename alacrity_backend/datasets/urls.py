from django.urls import path
from .views import create_dataset, descriptive_statistics, filter_and_clean_dataset, get_datasets, get_filter_options, pre_analysis

urlpatterns = [
    path('create_dataset/',create_dataset, name='create_dataset'),
    # path('sign_up/',sign_up, name='sign_up'),
    path('testget/',get_datasets, name='testget'),

    path("", get_datasets, name="get_datasets"),
    path("analysis/pre-analysis/<str:dataset_id>/", pre_analysis, name="pre-analysis"),
    path("analysis/descriptive/<str:dataset_id>/", descriptive_statistics, name="descriptive-statistics"),
    path('analysis/filter-options/<str:dataset_id>/', get_filter_options, name='get_filter_options'),
    path('analysis/filter/<str:dataset_id>/', filter_and_clean_dataset, name='filter_clean_aggregate_dataset'),
]

