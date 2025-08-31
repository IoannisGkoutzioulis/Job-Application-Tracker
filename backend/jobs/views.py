from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from config.utils import api_response, log_error, StandardResultsSetPagination, get_paginated_response, PaginationMixin
from rest_framework import viewsets

from .models import Job, JobSkill
from .serializers import JobSerializer, JobDetailSerializer, JobCreateUpdateSerializer
from users.models import Skill, CompanyProfile


class IsCompany(permissions.BasePermission):
    """Custom permission to only allow company users to create/modify job postings."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'company'


class JobListView(PaginationMixin, APIView):
    """API endpoint for listing all jobs with optional filtering."""
    
    permission_classes = (AllowAny,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        """Get all jobs with optional filtering."""
        try:
            # Get query parameters for filtering
            location = request.query_params.get('location')
            employment_type = request.query_params.get('employment_type')
            experience_level = request.query_params.get('experience_level')
            
            # Base queryset - only active jobs
            queryset = Job.objects.filter(status='active')
            
            # Apply filters if provided
            if location:
                queryset = queryset.filter(location__icontains=location)
            if employment_type:
                queryset = queryset.filter(employment_type=employment_type)
            if experience_level:
                queryset = queryset.filter(experience_level=experience_level)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = JobSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Jobs retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = JobSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Jobs retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            log_error(e, "Error retrieving job listings")
            return api_response(
                message="An unexpected error occurred while retrieving jobs",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class JobSearchView(PaginationMixin, APIView):
    """API endpoint for searching jobs."""
    
    permission_classes = (AllowAny,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        """Search jobs by keyword, skills, etc."""
        try:
            # Get query parameters
            query = request.query_params.get('q', '')
            location = request.query_params.get('location')
            employment_type = request.query_params.get('employment_type')
            experience_level = request.query_params.get('experience_level')
            
            # Base queryset - only active jobs
            queryset = Job.objects.filter(status='active')
            
            # Apply search if provided
            if query:
                queryset = queryset.filter(
                    Q(title__icontains=query) |
                    Q(description__icontains=query) |
                    Q(requirements__icontains=query) |
                    Q(company__company_name__icontains=query)
                )
            
            # Apply additional filters if provided
            if location:
                queryset = queryset.filter(location__icontains=location)
            if employment_type:
                queryset = queryset.filter(employment_type=employment_type)
            if experience_level:
                queryset = queryset.filter(experience_level=experience_level)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = JobSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Job search results",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = JobSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Job search results",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            log_error(e, "Error searching jobs")
            return api_response(
                message="An unexpected error occurred while searching for jobs",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class JobDetailView(APIView):
    """API endpoint for retrieving a specific job."""
    
    permission_classes = (AllowAny,)
    
    def get(self, request, pk):
        """Get a specific job by ID."""
        try:
            job = get_object_or_404(Job, pk=pk)
            serializer = JobDetailSerializer(job)
            return api_response(
                data=serializer.data,
                message="Job retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except Job.DoesNotExist:
            return api_response(
                message="Job not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving job details")
            return api_response(
                message="An unexpected error occurred while retrieving job details",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CompanyJobsView(PaginationMixin, APIView):
    """API endpoint for company to view their own job listings."""
    
    permission_classes = (IsCompany,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        """Get all jobs posted by the authenticated company."""
        try:
            company_profile = request.user.company_profile
            queryset = Job.objects.filter(company=company_profile)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = JobSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Company jobs retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = JobSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Company jobs retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving company jobs")
            return api_response(
                message="An unexpected error occurred while retrieving jobs",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class JobCreateView(APIView):
    """API endpoint for company to create a new job posting."""
    
    permission_classes = (IsCompany,)
    
    def post(self, request):
        """Create a new job posting."""
        try:
            company_profile = request.user.company_profile
            serializer = JobCreateUpdateSerializer(data=request.data)
            if serializer.is_valid():
                job = serializer.save(company=company_profile)
                return api_response(
                    data=JobSerializer(job).data,
                    message="Job created successfully",
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                errors=serializer.errors,
                message="Job creation failed due to validation errors",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid job data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error creating job")
            return api_response(
                message="An unexpected error occurred while creating the job",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class JobUpdateView(APIView):
    """API endpoint for company to update their job posting."""
    
    permission_classes = (IsCompany,)
    
    def put(self, request, pk):
        """Update an existing job posting."""
        try:
            company_profile = request.user.company_profile
            job = get_object_or_404(Job, pk=pk, company=company_profile)
            
            serializer = JobCreateUpdateSerializer(job, data=request.data, partial=True)
            if serializer.is_valid():
                job = serializer.save()
                return api_response(
                    data=JobSerializer(job).data,
                    message="Job updated successfully",
                    status_code=status.HTTP_200_OK
                )
            print("DEBUG JOB UPDATE ERRORS:", serializer.errors)  # Debug print for validation errors
            return api_response(
                errors=serializer.errors,
                message="Job update failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except CompanyProfile.DoesNotExist:
            return api_response(
                message="Company profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Job.DoesNotExist:
            return api_response(
                message="Job not found or you don't have permission to update it",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid job data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error updating job")
            return api_response(
                message="An unexpected error occurred while updating the job",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )