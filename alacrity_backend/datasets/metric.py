
"""
Dataset Metrics Module
This module provides functionality to retrieve and analyze dataset metrics.
It includes classes and methods to fetch dataset access trends, request statistics,
dataset statistics, feedback details, top users, analysis submissions, published research,
purchase trends, and more.
It also includes pagination for dataset statistics and handles various time ranges
for data retrieval.




"""

from django.db.models import Count, Q, Avg, Sum, F
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from dataset_requests.models import DatasetRequest
from payments.models import DatasetPurchase
from research.models import AnalysisSubmission, PublishedResearch
from .models import Dataset, DatasetAccessMetrics, Feedback


class DatasetMetricsPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class DatasetAnalyticsCardView(APIView):
    """
    Returns dataset usage analytics for the dashboard card.
    This includes total views, downloads, bookmarks, and requests.
    """
    
    def get(self, request):
        """
        Args:
            request: The HTTP request object.
        Returns:
            Response: A JSON response containing the analytics data.
        """
        time_range = request.GET.get('time_range', 'Last 30 Days')
        
        end_date = timezone.now()
        if time_range == 'Last 7 Days':
            start_date = end_date - timedelta(days=7)
        elif time_range == 'Last 90 Days':
            start_date = end_date - timedelta(days=90)
        elif time_range == 'This Year':
            start_date = timezone.datetime(end_date.year, 1, 1, tzinfo=timezone.get_current_timezone())
        else: 
            start_date = end_date - timedelta(days=30)

        daily_trends = DatasetAccessMetrics.objects.filter(
            dataset__contributor_id__organization=request.user.organization,
            access_time__range=[start_date, end_date]
        ).extra(
            select={'day': "date(access_time)"}
        ).values('day').annotate(
            views=Count('id', filter=Q(action='view')),
            downloads=Count('id', filter=Q(action='download')),
            bookmarks=Count('id', filter=Q(action='bookmark'))
        ).order_by('day')

        data = {
            'daily_trends': list(daily_trends),
            'time_range': time_range,
        }
        return Response(data)


class DatasetMetricsView(APIView):
    """
    Returns comprehensive dataset metrics.
    This includes access trends, request stats, dataset stats, feedback details,
    top users, analysis submissions, published research, and purchase trends.
    """
    
    pagination_class = DatasetMetricsPagination
    
    def get_paginator(self):
        """Return an instance of the pagination class."""
        return self.pagination_class()
    
    def get_time_range_dates(self, time_range):
        """Calculate start and end dates based on time range."""
        end_date = timezone.now()
        if time_range == 'Last 7 Days':
            start_date = end_date - timedelta(days=7)
        elif time_range == 'Last 90 Days':
            start_date = end_date - timedelta(days=90)
        elif time_range == 'This Year':
            start_date = datetime(end_date.year, 1, 1, tzinfo=timezone.get_current_timezone())
        else:
            start_date = end_date - timedelta(days=30)
        return start_date, end_date
    
    def get(self, request):
        """
        Args:
            request: The HTTP request object.
        Returns:
            Response: A JSON response containing the dataset metrics.
        Raises:
            ValueError: If the dataset ID is invalid or not found.
            Exception: For any other errors during data retrieval.
        Notes:
            - The dataset ID is obtained from the request parameters.
            - The time range can be specified in the request parameters.
            - The function uses Django ORM for querying the database.
            - The results are paginated using Django's pagination framework.
        """
        try:
            dataset_id = request.GET.get('dataset_id', None)
            time_range = request.GET.get('time_range', 'Last 30 Days')
            category = request.GET.get('category', None)
            payment_month = request.GET.get('payment_month', None)
            payment_category = request.GET.get('payment_category', None)

            # Determine time range
            start_date, end_date = self.get_time_range_dates(time_range)

            # Base filters
            base_filter = {'access_time__range': [start_date, end_date]}
            request_filter = {'created_at__range': [start_date, end_date]}
            if dataset_id:
                base_filter['dataset__dataset_id'] = dataset_id
                request_filter['dataset_id__dataset_id'] = dataset_id
            if category:
                base_filter['dataset__category'] = category
                request_filter['dataset_id__category'] = category

            daily_trends = DatasetAccessMetrics.objects.filter(
                dataset_id__contributor_id__organization=request.user.organization,
                **base_filter).annotate(
                
                day=TruncDate('access_time')
            ).values('day').annotate(
                views=Count('id', filter=Q(action='view')),
                downloads=Count('id', filter=Q(action='download')),
                bookmarks=Count('id', filter=Q(action='bookmark'))
            ).order_by('day')

            # 2. Request Stats
            request_stats = DatasetRequest.objects.filter(
                **request_filter,
                dataset_id__contributor_id__organization=request.user.organization
            ).values('request_status').annotate(
                count=Count('request_status')
            )
            
            avg_approval_time = DatasetRequest.objects.filter(
                dataset_id__contributor_id__organization=request.user.organization,
                request_status='approved', 
                **request_filter
            ).aggregate(avg_time=Avg(F('updated_at') - F('created_at')))['avg_time']
            
            avg_approval_days = avg_approval_time.total_seconds() / 86400 if avg_approval_time else 0

            # 3. Dataset Stats with Pagination
            dataset_stats_queryset = Dataset.objects.filter(
                contributor_id__organization=request.user.organization,
                access_metrics__access_time__range=[start_date, end_date]
            ).annotate(
                views=Count('access_metrics', filter=Q(access_metrics__action='view')),
                downloads=Count('access_metrics', filter=Q(access_metrics__action='download')),
                bookmarks=Count('access_metrics', filter=Q(access_metrics__action='bookmark')),
                request_count=Count('requests'),
                avg_rating=Avg('feedbacks__rating'),
                feedback_count=Count('feedbacks'),
                chat_count=Count('chats'),
                message_count=Count('chats__messages'),
                purchase_count=Count('datasetpurchase'),
                size_mb=Sum('size') / (1024 * 1024)
            ).values(
                'dataset_id', 'title', 'category', 'views', 'downloads', 'bookmarks', 'request_count',
                'avg_rating', 'feedback_count', 'chat_count', 'message_count', 'purchase_count', 'size_mb',
                'created_at', 'contributor_id__first_name', 'contributor_id__sur_name', 
                'contributor_id__organization__name', 'tags'
            )

            # Apply pagination
            paginator = self.get_paginator()
            paginated_stats = paginator.paginate_queryset(dataset_stats_queryset, request)
            dataset_stats = list(paginated_stats)

            # 4. Feedback Details
            feedback_details = Feedback.objects.filter(
                dataset_id__contributor_id__organization=request.user.organization,
                created_at__range=[start_date, end_date],
                dataset__dataset_id=dataset_id if dataset_id else Q()
            ).values(
                'dataset__title', 'user__first_name', 'user__sur_name', 
                'rating', 'comment', 'created_at'
            )

            # 5. Top Users
            top_users = DatasetAccessMetrics.objects.filter(
                **base_filter, 
                dataset_id__contributor_id__organization=request.user.organization
            ).values(
                'user__first_name', 'user__sur_name'
            ).annotate(
                access_count=Count('id')
            ).order_by('-access_count')[:10]

            # 6. Analysis Submissions
            submission_stats = AnalysisSubmission.objects.filter(
                dataset__contributor_id__organization=request.user.organization,
                submitted_at__range=[start_date, end_date],
                dataset__dataset_id=dataset_id if dataset_id else Q()
            ).values('status').annotate(count=Count('status'))

            # 7. Published Research
            published_stats = PublishedResearch.objects.filter(
                research_submission_id__dataset_id__contributor_id__organization=request.user.organization,
                research_submission__submitted_at__range=[start_date, end_date],
                research_submission__dataset__dataset_id=dataset_id if dataset_id else Q()
            ).aggregate(
                total_published=Count('id'),
                avg_likes=Avg('likes_count'),
                avg_bookmarks=Avg('bookmarks_count')
            )

            # 8. Purchase Trends
            purchase_trends = DatasetPurchase.objects.filter(
                dataset__contributor_id__organization=request.user.organization,
                purchased_at__range=[start_date, end_date],
                dataset__dataset_id=dataset_id if dataset_id else Q()
            ).annotate(
                day=TruncDate('purchased_at')
            ).values('day').annotate(count=Count('id')).order_by('day')

            # 9. Most Popular Datasets
            most_popular_datasets = Dataset.objects.filter(
                contributor_id__organization=request.user.organization,
                access_metrics__access_time__range=[start_date, end_date]
            ).annotate(
                total_views=Count('access_metrics', filter=Q(access_metrics__action='view'))
            ).values('title', 'total_views').order_by('-total_views')[:5]

            # 10. Available Categories
            available_categories = Dataset.objects.filter(
                contributor_id__organization=request.user.organization
            ).values('category').distinct()

            # 11. Payment Trends by Month and Category
            payment_filter = {}
            if payment_month:
                year, month = map(int, payment_month.split('-'))
                payment_filter['purchased_at__year'] = year
                payment_filter['purchased_at__month'] = month
            if payment_category:
                payment_filter['dataset__category'] = payment_category

            payment_trends = DatasetPurchase.objects.filter(
                dataset_id__contributor_id__organization=request.user.organization,
                **payment_filter
            ).annotate(
                month=TruncMonth('purchased_at')
            ).values('month', 'dataset__category').annotate(
                total_purchases=Count('id'),
                total_revenue=Sum('dataset__price')
            ).order_by('month')

            # 12. Tag Analysis
            all_tags = [tag for ds in dataset_stats_queryset for tag in (ds['tags'] or [])]
            tag_counts = {}
            for tag in all_tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
            tag_analysis = [{'tag': tag, 'count': count} for tag, count in tag_counts.items()]
            tag_analysis.sort(key=lambda x: x['count'], reverse=True)

            data = {
                'daily_trends': list(daily_trends) or [],
                'request_stats': {item['request_status']: item['count'] for item in request_stats} or {},
                'avg_approval_days': round(avg_approval_days, 2) if avg_approval_days else 0,
                'dataset_stats': dataset_stats or [],
                'pagination': {
                    'count': paginator.page.paginator.count if paginated_stats else 0,
                    'next': paginator.get_next_link(),
                    'previous': paginator.get_previous_link(),
                },
                'feedback_details': list(feedback_details) or [],
                'top_users': list(top_users) or [],
                'submission_stats': {item['status']: item['count'] for item in submission_stats} or {},
                'published_stats': published_stats or {'total_published': 0, 'avg_likes': 0, 'avg_bookmarks': 0},
                'purchase_trends': list(purchase_trends) or [],
                'most_popular_datasets': list(most_popular_datasets) or [],
                'available_categories': [item['category'] for item in available_categories] or [],
                'payment_trends': list(payment_trends) or [],
                'tag_analysis': tag_analysis[:10] or [],
                'total_datasets': Dataset.objects.filter(
                    contributor_id__organization=request.user.organization
                ).count() or 0,
                'time_range': time_range,
                'category': category,
                'dataset_id': dataset_id,
            }
            
            return paginator.get_paginated_response(data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)