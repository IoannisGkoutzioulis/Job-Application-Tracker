from django.urls import path
from .views import (
    JobseekerApplicationsView, CompanyApplicationsView, JobApplicationsView,
    ApplicationDetailView, ApplyForJobView, UpdateApplicationStatusView,
    ApplicationNotesView, InterviewsView, InterviewDetailView
)

urlpatterns = [
    # Job seeker application endpoints
    path('jobseeker/', JobseekerApplicationsView.as_view(), name='jobseeker_applications'),
    path('apply/', ApplyForJobView.as_view(), name='apply_for_job'),
    
    # Company application management endpoints
    path('company/', CompanyApplicationsView.as_view(), name='company_applications'),
    path('job/<int:job_id>/', JobApplicationsView.as_view(), name='job_applications'),
    
    # Application detail endpoints
    path('<int:pk>/', ApplicationDetailView.as_view(), name='application_detail'),
    path('<int:pk>/status/', UpdateApplicationStatusView.as_view(), name='update_application_status'),
    
    # Application notes endpoints
    path('<int:application_id>/notes/', ApplicationNotesView.as_view(), name='application_notes'),
    
    # Interview endpoints
    path('<int:application_id>/interviews/', InterviewsView.as_view(), name='application_interviews'),
    path('interviews/<int:pk>/', InterviewDetailView.as_view(), name='interview_detail'),
]