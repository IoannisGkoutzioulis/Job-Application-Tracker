from django.urls import path
from .views import (
    JobListView, JobSearchView, JobDetailView,
    CompanyJobsView, JobCreateView, JobUpdateView
)
from rest_framework.routers import DefaultRouter

urlpatterns = [
    # Public job endpoints
    path('', JobListView.as_view(), name='job_list'),
    path('search/', JobSearchView.as_view(), name='job_search'),
    path('<int:pk>/', JobDetailView.as_view(), name='job_detail'),
    
    # Company job management endpoints
    path('company/', CompanyJobsView.as_view(), name='company_jobs'),
    path('create/', JobCreateView.as_view(), name='job_create'),
    path('<int:pk>/update/', JobUpdateView.as_view(), name='job_update'),
]

router = DefaultRouter()
# No company-news registration