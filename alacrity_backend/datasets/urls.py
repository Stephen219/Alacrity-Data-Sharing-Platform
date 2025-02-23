from django.urls import path
from .views import ( descriptive_statistics, 
filter_and_clean_dataset, 
get_datasets, get_filter_options, correlation_analysis, CreateDatasetView, all_datasets_view,
 pre_analysis)


urlpatterns = [

    path('create_dataset/', CreateDatasetView.as_view(), name='create_dataset'),
    # path('sign_up/',sign_up, name='sign_up'),
    path('testget/',get_datasets, name='testget'),
    path('correlation/<str:dataset_id>/',correlation_analysis, name='correlation_analysis'),

    path('all/', all_datasets_view, name='dataset-list'),


    path("", get_datasets, name="get_datasets"),
    path("analysis/pre-analysis/<str:dataset_id>/", pre_analysis, name="pre-analysis"),
    path("analysis/descriptive/<str:dataset_id>/", descriptive_statistics, name="descriptive-statistics"),
    path('analysis/filter-options/<str:dataset_id>/', get_filter_options, name='get_filter_options'),
    path('analysis/filter/<str:dataset_id>/', filter_and_clean_dataset, name='filter_clean_aggregate_dataset'),
]

