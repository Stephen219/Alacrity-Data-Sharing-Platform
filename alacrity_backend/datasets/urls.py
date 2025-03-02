from django.urls import path
from .views import ( descriptive_statistics, 
filter_and_clean_dataset, 
get_datasets, get_filter_options, CreateDatasetView, 

 pre_analysis)

from .new import analyze_dataset , dataset_detail, all_datasets_view, clear_dataset_cache, dataset_view

urlpatterns = [

    path('create_dataset/', CreateDatasetView.as_view(), name='create_dataset'),
    path('clear_cache/<str:dataset_id>/', clear_dataset_cache, name='clear_dataset_cache'),
    path('testget/',get_datasets, name='testget'),
    # path('correlation/<str:dataset_id>/',correlation_analysis, name='correlation_analysis'),
    path('details/<str:dataset_id>/', dataset_detail, name='dataset_detail'),
    path('datasets/<str:dataset_id>/', dataset_detail, name='dataset_detail'),
    path('datasets/analyze/<str:dataset_id>/', analyze_dataset, name='analyze_dataset'),
    path('datasets/', all_datasets_view, name='all_datasets'),
    path('all/', all_datasets_view, name='dataset-list'),
    path('perform/<str:dataset_id>/', analyze_dataset, name='analyze_dataset'),
    path("", get_datasets, name="get_datasets"),
    path("analysis/pre-analysis/<str:dataset_id>/", pre_analysis, name="pre-analysis"),
    path("analysis/descriptive/<str:dataset_id>/", descriptive_statistics, name="descriptive-statistics"),
    path('analysis/filter-options/<str:dataset_id>/', get_filter_options, name='get_filter_options'),
    path('analysis/filter/<str:dataset_id>/', filter_and_clean_dataset, name='filter_clean_aggregate_dataset'),
    path('<str:dataset_id>/', dataset_view, name='dataset_detail'),
]

