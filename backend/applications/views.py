# applications/views.py
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from users.models import JobSeekerProfile, CompanyProfile
from django.utils import timezone

from .models import Application, ApplicationNote, Interview
from .serializers import (
    ApplicationSerializer, ApplicationCreateSerializer,
    ApplicationStatusUpdateSerializer, ApplicationNoteSerializer,
    InterviewSerializer
)
from jobs.models import Job
from config.utils import api_response, log_error, StandardResultsSetPagination, get_paginated_response, PaginationMixin
from analytics.models import ApplicationTimeline


class IsJobseeker(permissions.BasePermission):
    """Custom permission to only allow job seekers to apply for jobs."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'jobseeker'


class IsCompany(permissions.BasePermission):
    """Custom permission to only allow companies to manage applications."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'company'


class JobseekerApplicationsView(PaginationMixin, APIView):
    """API endpoint for job seekers to view their applications."""
    
    permission_classes = (IsJobseeker,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        """Get all applications for the authenticated job seeker."""
        try:
            jobseeker = request.user.jobseeker_profile
            queryset = Application.objects.filter(jobseeker=jobseeker)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ApplicationSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Applications retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = ApplicationSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Applications retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except JobSeekerProfile.DoesNotExist:
            return api_response(
                message="Job seeker profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving jobseeker applications")
            return api_response(
                message="An unexpected error occurred while retrieving applications",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CompanyApplicationsView(PaginationMixin, APIView):
    """API endpoint for companies to view applications for their jobs."""
    
    permission_classes = (IsCompany,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        """Get all applications for the authenticated company's job postings."""
        try:
            company = request.user.company_profile
            queryset = Application.objects.filter(job__company=company)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ApplicationSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Applications retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = ApplicationSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Applications retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving company applications")
            return api_response(
                message="An unexpected error occurred while retrieving applications",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class JobApplicationsView(PaginationMixin, APIView):
    """API endpoint for companies to view applications for a specific job."""
    
    permission_classes = (IsCompany,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request, job_id):
        """Get all applications for a specific job posting."""
        try:
            company = request.user.company_profile
            job = get_object_or_404(Job, id=job_id, company=company)
            queryset = Application.objects.filter(job=job)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ApplicationSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message=f"Applications for job '{job.title}' retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = ApplicationSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message=f"Applications for job '{job.title}' retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Job.DoesNotExist:
            return api_response(
                message="Job not found or you don't have permission to view its applications",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving job applications")
            return api_response(
                message="An unexpected error occurred while retrieving applications",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ApplicationDetailView(APIView):
    """API endpoint for viewing and updating a specific application."""
    
    permission_classes = (IsAuthenticated,)
    
    def get_object(self, pk, user):
        """Get the application object based on user type."""
        application = get_object_or_404(Application, pk=pk)
        
        if user.user_type == 'jobseeker':
            # For job seekers, only allow access to their own applications
            if application.jobseeker.user != user:
                return None
        elif user.user_type == 'company':
            # For companies, only allow access to applications for their jobs
            if application.job.company.user != user:
                return None
        
        return application
    
    def get(self, request, pk):
        """Get details of a specific application."""
        try:
            application = self.get_object(pk, request.user)
            if not application:
                return api_response(
                    message="Application not found or you don't have permission to view it",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            serializer = ApplicationSerializer(application)
            return api_response(
                data=serializer.data,
                message="Application details retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except Application.DoesNotExist:
            return api_response(
                message="Application not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving application details")
            return api_response(
                message="An unexpected error occurred while retrieving application details",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ApplyForJobView(APIView):
    """API endpoint for job seekers to apply for jobs."""
    
    permission_classes = (IsJobseeker,)
    
    def post(self, request):
        """Create a new job application."""
        try:
            jobseeker = request.user.jobseeker_profile
            serializer = ApplicationCreateSerializer(
                data=request.data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                application = serializer.save(jobseeker=jobseeker)
                # Create timeline event for application submission
                ApplicationTimeline.objects.create(
                    application=application,
                    event_type='submitted',
                    event_date=timezone.now(),
                    notes='Application submitted by job seeker.'
                )
                return api_response(
                    data=ApplicationSerializer(application).data,
                    message="Application submitted successfully",
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                errors=serializer.errors,
                message="Application submission failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except JobSeekerProfile.DoesNotExist:
            return api_response(
                message="Job seeker profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Job.DoesNotExist:
            return api_response(
                message="The job you're applying to no longer exists",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except IntegrityError:
            return api_response(
                message="You have already applied to this job",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error applying for job")
            return api_response(
                message="An unexpected error occurred while submitting your application",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdateApplicationStatusView(APIView):
    """API endpoint for companies to update application status."""
    
    permission_classes = (IsCompany,)
    
    def put(self, request, pk):
        """Update the status of a specific application."""
        try:
            company = request.user.company_profile
            application = get_object_or_404(Application, pk=pk, job__company=company)
            
            serializer = ApplicationStatusUpdateSerializer(
                application, data=request.data, partial=True
            )
            
            if serializer.is_valid():
                application = serializer.save()
                return api_response(
                    data=ApplicationSerializer(application).data,
                    message="Application status updated successfully",
                    status_code=status.HTTP_200_OK
                )
            return api_response(
                errors=serializer.errors,
                message="Application status update failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Application.DoesNotExist:
            return api_response(
                message="Application not found or you don't have permission to update it",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid status value",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error updating application status")
            return api_response(
                message="An unexpected error occurred while updating application status",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ApplicationNotesView(PaginationMixin, APIView):
    """API endpoint for managing application notes."""
    
    permission_classes = (IsCompany,)
    pagination_class = StandardResultsSetPagination
    
    def post(self, request, application_id):
        try:
            company = request.user.company_profile
            application = get_object_or_404(
                Application, pk=application_id, job__company=company
            )
            
            serializer = ApplicationNoteSerializer(data={
                'application': application.id,
                'text': request.data.get('text')
            })
            
            if serializer.is_valid():
                note = serializer.save(created_by=request.user)  # Add created_by
                return api_response(
                    data=ApplicationNoteSerializer(note).data,
                    message="Note added successfully",
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                errors=serializer.errors,
                message="Note creation failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Application.DoesNotExist:
            return api_response(
                message="Application not found or you don't have permission to view its notes",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving application notes")
            return api_response(
                message="An unexpected error occurred while retrieving application notes",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, application_id):
        """Add a new note to an application."""
        try:
            company = request.user.company_profile
            application = get_object_or_404(
                Application, pk=application_id, job__company=company
            )
            
            serializer = ApplicationNoteSerializer(data={
                'application': application.id,
                'text': request.data.get('text')
            })
            
            if serializer.is_valid():
                note = serializer.save()
                return api_response(
                    data=ApplicationNoteSerializer(note).data,
                    message="Note added successfully",
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                errors=serializer.errors,
                message="Note creation failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Application.DoesNotExist:
            return api_response(
                message="Application not found or you don't have permission to add notes",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error adding application note")
            return api_response(
                message="An unexpected error occurred while adding the note",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InterviewsView(PaginationMixin, APIView):
    """API endpoint for managing interviews."""
    
    permission_classes = (IsCompany,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request, application_id):
        """Get all interviews for a specific application."""
        try:
            company = request.user.company_profile
            application = get_object_or_404(
                Application, pk=application_id, job__company=company
            )
            
            queryset = Interview.objects.filter(application=application)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = InterviewSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Interviews retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = InterviewSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Interviews retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Application.DoesNotExist:
            return api_response(
                message="Application not found or you don't have permission to view its interviews",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving interviews")
            return api_response(
                message="An unexpected error occurred while retrieving interviews",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, application_id):
        """Schedule a new interview for an application."""
        try:
            company = request.user.company_profile
            application = get_object_or_404(
                Application, pk=application_id, job__company=company
            )
            
            data = request.data.copy()
            data['application'] = application.id
            
            serializer = InterviewSerializer(data=data)
            if serializer.is_valid():
                interview = serializer.save()
                return api_response(
                    data=InterviewSerializer(interview).data,
                    message="Interview scheduled successfully",
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                errors=serializer.errors,
                message="Interview scheduling failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Application.DoesNotExist:
            return api_response(
                message="Application not found or you don't have permission to schedule interviews",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid interview data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error scheduling interview")
            return api_response(
                message="An unexpected error occurred while scheduling the interview",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InterviewDetailView(APIView):
    """API endpoint for managing a specific interview."""
    
    permission_classes = (IsCompany,)
    
    def get_object(self, pk, user):
        """Get the interview object."""
        company = user.company_profile
        return get_object_or_404(Interview, pk=pk, application__job__company=company)
    
    def get(self, request, pk):
        """Get details of a specific interview."""
        try:
            company = request.user.company_profile
            interview = get_object_or_404(
                Interview, pk=pk, application__job__company=company
            )
            
            serializer = InterviewSerializer(interview)
            return api_response(
                data=serializer.data,
                message="Interview details retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Interview.DoesNotExist:
            return api_response(
                message="Interview not found or you don't have permission to view it",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving interview details")
            return api_response(
                message="An unexpected error occurred while retrieving interview details",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, pk):
        """Update a specific interview."""
        try:
            company = request.user.company_profile
            interview = get_object_or_404(
                Interview, pk=pk, application__job__company=company
            )
            
            serializer = InterviewSerializer(interview, data=request.data, partial=True)
            if serializer.is_valid():
                updated_interview = serializer.save()
                return api_response(
                    data=InterviewSerializer(updated_interview).data,
                    message="Interview updated successfully",
                    status_code=status.HTTP_200_OK
                )
            return api_response(
                errors=serializer.errors,
                message="Interview update failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Interview.DoesNotExist:
            return api_response(
                message="Interview not found or you don't have permission to update it",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid interview data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error updating interview")
            return api_response(
                message="An unexpected error occurred while updating the interview",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        """Delete a specific interview."""
        try:
            company = request.user.company_profile
            interview = get_object_or_404(
                Interview, pk=pk, application__job__company=company
            )
            
            interview.delete()
            return api_response(
                message="Interview deleted successfully",
                status_code=status.HTTP_204_NO_CONTENT
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Interview.DoesNotExist:
            return api_response(
                message="Interview not found or you don't have permission to delete it",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error deleting interview")
            return api_response(
                message="An unexpected error occurred while deleting the interview",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )