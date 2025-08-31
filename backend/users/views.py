from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import logging

from .models import (
    User, JobSeekerProfile, CompanyProfile, 
    Skill, JobSeekerSkill, Education, Experience, SocialLink
)
from .serializers import (
    UserSerializer, UserWithProfileSerializer, RegisterSerializer,
    JobSeekerProfileSerializer, CompanyProfileSerializer,
    JobSeekerProfileUpdateSerializer, CompanyProfileUpdateSerializer,
    SkillSerializer, EducationSerializer, ExperienceSerializer,
    SocialLinkSerializer
)

from config.utils import api_response, log_error, StandardResultsSetPagination, get_paginated_response, PaginationMixin

logger = logging.getLogger(__name__)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer to include user data in the token response.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = UserWithProfileSerializer(self.user).data
        data['user'] = user_data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that also returns user data.
    """
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    """API endpoint for user registration."""
    
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        logger.info(f"Registration request received from: {request.META.get('HTTP_ORIGIN', 'Unknown')}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Request data: {request.data}")
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Registration validation errors: {serializer.errors}")
                return api_response(
                    errors=serializer.errors,
                    message="Registration failed due to validation errors",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Save the user
            user = serializer.save()
            logger.info(f"User created successfully: {user.email}")
            
            refresh = RefreshToken.for_user(user)
            user_serializer = UserWithProfileSerializer(user)
            
            return api_response(
                data={
                    'user': user_serializer.data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                },
                message="User registered successfully",
                status_code=status.HTTP_201_CREATED
            )
        except IntegrityError as e:
            if 'unique constraint' in str(e).lower() and 'email' in str(e).lower():
                return api_response(
                    message="A user with this email already exists",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            logger.error(f"Registration failed - IntegrityError: {str(e)}", exc_info=True)
            return api_response(
                message="Registration failed due to data integrity issues",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            logger.error(f"Registration failed - ValidationError: {str(e)}", exc_info=True)
            return api_response(
                errors={"validation_error": str(e)},
                message="Registration failed due to validation errors",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error during registration: {str(e)}", exc_info=True)
            return api_response(
                message="An unexpected error occurred during registration",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """API endpoint for user logout."""
    
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                # If no token is provided, just return success
                return api_response(
                    message="Logged out successfully",
                    status_code=status.HTTP_200_OK
                )
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            return api_response(
                message="Logged out successfully",
                status_code=status.HTTP_200_OK
            )
        except TokenError as e:
            # Invalid or expired token
            log_error(e, "Logout - Invalid token")
            return api_response(
                message="Logged out successfully",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            # Log the error but still return success
            log_error(e, "Error during logout")
            return api_response(
                message="Logged out successfully",
                status_code=status.HTTP_200_OK
            )


class ProfileView(APIView):
    """API endpoint for retrieving the current user's profile."""
    
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        try:
            user = request.user
            serializer = UserWithProfileSerializer(user)
            return api_response(
                data=serializer.data,
                message="Profile retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            log_error(e, "Error retrieving user profile")
            return api_response(
                message="An unexpected error occurred while retrieving your profile",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class JobSeekerProfileUpdateView(APIView):
    """API endpoint for updating job seeker profile."""
    
    permission_classes = (IsAuthenticated,)
    
    def put(self, request):
        user = request.user
        if user.user_type != 'jobseeker':
            return api_response(
                message="Only job seekers can update this profile type",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = user.jobseeker_profile
        except JobSeekerProfile.DoesNotExist:
            profile = JobSeekerProfile.objects.create(user=user, full_name=user.get_full_name())
        
        # Handle resume upload
        if 'resume' in request.FILES:
            profile.resume = request.FILES['resume']
            profile.save()
        elif 'resume' in request.data and (request.data['resume'] in ['', 'null', None]):
            if profile.resume:
                profile.resume.delete(save=False)
                profile.resume = None
                profile.save()
        
        # Handle profile image deletion
        if 'profile_image' in request.data and request.data['profile_image'] in ['', 'null', None]:
            if user.profile_image:
                user.profile_image.delete(save=False)
                user.profile_image = None
                user.save()
        
        # Update other fields
        data = request.data.copy()
        serializer = JobSeekerProfileUpdateSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Update User fields
            if 'phone' in request.data:
                user.phone = request.data['phone']
                user.save()
            print("FILES RECEIVED:", request.FILES)
            if 'profile_image' in request.FILES:
                user.profile_image = request.FILES['profile_image']
                user.save()
            updated_user = User.objects.get(id=user.id)
            return api_response(
                data=UserWithProfileSerializer(updated_user, context={'request': request}).data,
                message="Profile updated successfully",
                status_code=status.HTTP_200_OK
            )
        return api_response(
            errors=serializer.errors,
            message="Profile update failed",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class CompanyProfileUpdateView(APIView):
    """API endpoint for updating company profile."""
    
    permission_classes = (IsAuthenticated,)
    
    def put(self, request):
        user = request.user
        if user.user_type != 'company':
            return api_response(
                message="Only companies can update this profile type",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            try:
                profile = user.company_profile
            except CompanyProfile.DoesNotExist:
                profile = CompanyProfile.objects.create(user=user, company_name=user.get_full_name())
            
            # Handle company logo deletion
            if 'company_logo' in request.data and request.data['company_logo'] == '':
                if profile.company_logo:
                    profile.company_logo.delete(save=False)
                    profile.company_logo = None
                    profile.save()
            
            serializer = CompanyProfileUpdateSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return api_response(
                    data=UserWithProfileSerializer(user).data,
                    message="Profile updated successfully",
                    status_code=status.HTTP_200_OK
                )
            return api_response(
                errors=serializer.errors,
                message="Profile update failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid profile data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error updating company profile")
            return api_response(
                message="An unexpected error occurred while updating your profile",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SkillListCreateView(PaginationMixin, generics.ListCreateAPIView):
    """API endpoint for listing or creating skills."""
    
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = StandardResultsSetPagination
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Skills retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = self.get_serializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Skills retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            log_error(e, "Error retrieving skills")
            return api_response(
                message="An unexpected error occurred while retrieving skills",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                self.perform_create(serializer)
                return api_response(
                    data=serializer.data,
                    message="Skill created successfully",
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                errors=serializer.errors,
                message="Skill creation failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid skill data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error creating skill")
            return api_response(
                message="An unexpected error occurred while creating the skill",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        name = self.request.data.get('name')
        skill, created = Skill.objects.get_or_create(name=name.lower())
        return skill


class JobSeekerSkillView(APIView):
    """API endpoint for managing a job seeker's skills."""
    
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        user = request.user
        if user.user_type != 'jobseeker':
            return api_response(
                message="Only job seekers can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = user.jobseeker_profile
            skills = JobSeekerSkill.objects.filter(jobseeker=profile)
            skill_data = [{'id': s.skill.id, 'name': s.skill.name} for s in skills]
            return api_response(
                data=skill_data,
                message="Skills retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except JobSeekerProfile.DoesNotExist:
            return api_response(
                message="Profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving job seeker skills")
            return api_response(
                message="An unexpected error occurred while retrieving skills",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        user = request.user
        if user.user_type != 'jobseeker':
            return api_response(
                message="Only job seekers can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        skill_name = request.data.get('name')
        if not skill_name:
            return api_response(
                message="Skill name is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            profile = user.jobseeker_profile
            skill, created = Skill.objects.get_or_create(name=skill_name.lower())
            jobseeker_skill, created = JobSeekerSkill.objects.get_or_create(
                jobseeker=profile, skill=skill
            )
            return api_response(
                data={'id': skill.id, 'name': skill.name},
                message="Skill added successfully",
                status_code=status.HTTP_201_CREATED
            )
        except JobSeekerProfile.DoesNotExist:
            return api_response(
                message="Profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except IntegrityError:
            return api_response(
                message="This skill is already associated with your profile",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error adding job seeker skill")
            return api_response(
                message="An unexpected error occurred while adding the skill",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, skill_id=None):
        user = request.user
        if user.user_type != 'jobseeker':
            return api_response(
                message="Only job seekers can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        if not skill_id:
            return api_response(
                message="Skill ID is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            profile = user.jobseeker_profile
            skill = get_object_or_404(Skill, id=skill_id)
            result = JobSeekerSkill.objects.filter(jobseeker=profile, skill=skill).delete()
            if result[0] == 0:  # No records deleted
                return api_response(
                    message="This skill is not associated with your profile",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            return api_response(
                message="Skill removed successfully",
                status_code=status.HTTP_204_NO_CONTENT
            )
        except JobSeekerProfile.DoesNotExist:
            return api_response(
                message="Profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Skill.DoesNotExist:
            return api_response(
                message="Skill not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error removing job seeker skill")
            return api_response(
                message="An unexpected error occurred while removing the skill",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EducationListCreateView(PaginationMixin, APIView):
    """API endpoint for listing and creating education entries."""
    
    permission_classes = (IsAuthenticated,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        user = request.user
        if user.user_type != 'jobseeker':
            return api_response(
                message="Only job seekers can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = user.jobseeker_profile
            queryset = Education.objects.filter(jobseeker=profile)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = EducationSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Education entries retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = EducationSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Education entries retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except JobSeekerProfile.DoesNotExist:
            return api_response(
                message="Profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving education entries")
            return api_response(
                message="An unexpected error occurred while retrieving education entries",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        user = request.user
        if user.user_type != 'jobseeker':
            return api_response(
                message="Only job seekers can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = user.jobseeker_profile
            serializer = EducationSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(jobseeker=profile)
                return api_response(
                    data=serializer.data,
                    message="Education entry created successfully",
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                errors=serializer.errors,
                message="Education entry creation failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except JobSeekerProfile.DoesNotExist:
            return api_response(
                message="Profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid education data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error creating education entry")
            return api_response(
                message="An unexpected error occurred while creating the education entry",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EducationDetailView(APIView):
    """API endpoint for retrieving, updating, or deleting education entries."""
    
    permission_classes = (IsAuthenticated,)
    
    def get_object(self, user, pk):
        if user.user_type != 'jobseeker':
            return None
        
        try:
            profile = user.jobseeker_profile
            return get_object_or_404(Education, id=pk, jobseeker=profile)
        except JobSeekerProfile.DoesNotExist:
            return None
        except Education.DoesNotExist:
            return None
    
    def get(self, request, pk):
        try:
            education = self.get_object(request.user, pk)
            if not education:
                return api_response(
                    message="Education entry not found or access denied",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            serializer = EducationSerializer(education)
            return api_response(
                data=serializer.data,
                message="Education entry retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            log_error(e, "Error retrieving education entry")
            return api_response(
                message="An unexpected error occurred while retrieving the education entry",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, pk):
        try:
            education = self.get_object(request.user, pk)
            if not education:
                return api_response(
                    message="Education entry not found or access denied",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            serializer = EducationSerializer(education, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return api_response(
                    data=serializer.data,
                    message="Education entry updated successfully",
                    status_code=status.HTTP_200_OK
                )
            return api_response(
                errors=serializer.errors,
                message="Education entry update failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid education data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error updating education entry")
            return api_response(
                message="An unexpected error occurred while updating the education entry",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        try:
            education = self.get_object(request.user, pk)
            if not education:
                return api_response(
                    message="Education entry not found or access denied",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            education.delete()
            return api_response(
                message="Education entry deleted successfully",
                status_code=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            log_error(e, "Error deleting education entry")
            return api_response(
                message="An unexpected error occurred while deleting the education entry",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExperienceListCreateView(PaginationMixin, APIView):
    """API endpoint for listing and creating work experience entries."""
    
    permission_classes = (IsAuthenticated,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        user = request.user
        if user.user_type != 'jobseeker':
            return api_response(
                message="Only job seekers can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = user.jobseeker_profile
            queryset = Experience.objects.filter(jobseeker=profile)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ExperienceSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Experience entries retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = ExperienceSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Experience entries retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except JobSeekerProfile.DoesNotExist:
            return api_response(
                message="Profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving experience entries")
            return api_response(
                message="An unexpected error occurred while retrieving experience entries",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        user = request.user
        if user.user_type != 'jobseeker':
            return api_response(
                message="Only job seekers can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = user.jobseeker_profile
            serializer = ExperienceSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(jobseeker=profile)
                return api_response(
                    data=serializer.data,
                    message="Experience entry created successfully",
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                errors=serializer.errors,
                message="Experience entry creation failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except JobSeekerProfile.DoesNotExist:
            return api_response(
                message="Profile not found for this user",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid experience data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error creating experience entry")
            return api_response(
                message="An unexpected error occurred while creating the experience entry",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExperienceDetailView(APIView):
    """API endpoint for retrieving, updating, or deleting work experience entries."""
    
    permission_classes = (IsAuthenticated,)
    
    def get_object(self, user, pk):
        if user.user_type != 'jobseeker':
            return None
        
        try:
            profile = user.jobseeker_profile
            return get_object_or_404(Experience, id=pk, jobseeker=profile)
        except JobSeekerProfile.DoesNotExist:
            return None
        except Experience.DoesNotExist:
            return None
    
    def get(self, request, pk):
        try:
            experience = self.get_object(request.user, pk)
            if not experience:
                return api_response(
                    message="Experience entry not found or access denied",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            serializer = ExperienceSerializer(experience)
            return api_response(
                data=serializer.data,
                message="Experience entry retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            log_error(e, "Error retrieving experience entry")
            return api_response(
                message="An unexpected error occurred while retrieving the experience entry",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, pk):
        try:
            experience = self.get_object(request.user, pk)
            if not experience:
                return api_response(
                    message="Experience entry not found or access denied",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            serializer = ExperienceSerializer(experience, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return api_response(
                    data=serializer.data,
                    message="Experience entry updated successfully",
                    status_code=status.HTTP_200_OK
                )
            return api_response(
                errors=serializer.errors,
                message="Experience entry update failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid experience data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error updating experience entry")
            return api_response(
                message="An unexpected error occurred while updating the experience entry",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        try:
            experience = self.get_object(request.user, pk)
            if not experience:
                return api_response(
                    message="Experience entry not found or access denied",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            experience.delete()
            return api_response(
                message="Experience entry deleted successfully",
                status_code=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            log_error(e, "Error deleting experience entry")
            return api_response(
                message="An unexpected error occurred while deleting the experience entry",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SocialLinkListCreateView(PaginationMixin, APIView):
    """API endpoint for listing and creating social media links."""
    
    permission_classes = (IsAuthenticated,)
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        try:
            user = request.user
            queryset = SocialLink.objects.filter(user=user)
            
            # Paginate results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = SocialLinkSerializer(page, many=True)
                return get_paginated_response(
                    self.paginator, 
                    serializer.data,
                    message="Social links retrieved successfully",
                    status_code=status.HTTP_200_OK
                )
            
            # If pagination is disabled
            serializer = SocialLinkSerializer(queryset, many=True)
            return api_response(
                data=serializer.data,
                message="Social links retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            log_error(e, "Error retrieving social links")
            return api_response(
                message="An unexpected error occurred while retrieving social links",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        try:
            user = request.user
            serializer = SocialLinkSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=user)
                return api_response(
                    data=serializer.data,
                    message="Social link created successfully",
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                errors=serializer.errors,
                message="Social link creation failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid social link data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return api_response(
                message="This social link is already associated with your profile",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error creating social link")
            return api_response(
                message="An unexpected error occurred while creating the social link",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SocialLinkDetailView(APIView):
    """API endpoint for retrieving, updating, or deleting social media links."""
    
    permission_classes = (IsAuthenticated,)
    
    def get_object(self, user, pk):
        return get_object_or_404(SocialLink, id=pk, user=user)
    
    def get(self, request, pk):
        try:
            link = self.get_object(request.user, pk)
            serializer = SocialLinkSerializer(link)
            return api_response(
                data=serializer.data,
                message="Social link retrieved successfully",
                status_code=status.HTTP_200_OK
            )
        except SocialLink.DoesNotExist:
            return api_response(
                message="Social link not found or you don't have permission to view it",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error retrieving social link")
            return api_response(
                message="An unexpected error occurred while retrieving the social link",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, pk):
        try:
            link = self.get_object(request.user, pk)
            serializer = SocialLinkSerializer(link, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return api_response(
                    data=serializer.data,
                    message="Social link updated successfully",
                    status_code=status.HTTP_200_OK
                )
            return api_response(
                errors=serializer.errors,
                message="Social link update failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except SocialLink.DoesNotExist:
            return api_response(
                message="Social link not found or you don't have permission to update it",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return api_response(
                errors={"validation_error": str(e)},
                message="Invalid social link data",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            log_error(e, "Error updating social link")
            return api_response(
                message="An unexpected error occurred while updating the social link",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        try:
            link = self.get_object(request.user, pk)
            link.delete()
            return api_response(
                message="Social link deleted successfully",
                status_code=status.HTTP_204_NO_CONTENT
            )
        except SocialLink.DoesNotExist:
            return api_response(
                message="Social link not found or you don't have permission to delete it",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_error(e, "Error deleting social link")
            return api_response(
                message="An unexpected error occurred while deleting the social link",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RemoveProfileImageView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        if user.profile_image:
            user.profile_image.delete(save=False)  # Delete file from disk
            user.profile_image = None
            user.save()
            return api_response(
                message="Profile image removed.",
                status_code=status.HTTP_204_NO_CONTENT
            )
        return api_response(
            message="No profile image to remove.",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not user.check_password(old_password):
            return Response({'old_password': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != confirm_password:
            return Response({'new_password': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'new_password': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)


class CompanyProfileDetailView(APIView):
    """API endpoint for retrieving a company profile by ID (public)."""
    permission_classes = (AllowAny,)

    def get(self, request, pk):
        print(f"DEBUG: Requested company profile ID: {pk}")
        from users.models import CompanyProfile
        print("DEBUG: Existing company profile IDs:", list(CompanyProfile.objects.values_list('id', flat=True)))
        try:
            company_profile = CompanyProfile.objects.get(pk=pk)
            serializer = CompanyProfileSerializer(company_profile)
            return Response({'data': serializer.data}, status=200)
        except CompanyProfile.DoesNotExist:
            print("DEBUG: CompanyProfile.DoesNotExist for ID:", pk)
            return Response({'detail': 'Not found.'}, status=404)