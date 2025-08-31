from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    CustomTokenObtainPairView, RegisterView, LogoutView, ProfileView,
    JobSeekerProfileUpdateView, CompanyProfileUpdateView,
    SkillListCreateView, JobSeekerSkillView,
    EducationListCreateView, EducationDetailView,
    ExperienceListCreateView, ExperienceDetailView,
    SocialLinkListCreateView, SocialLinkDetailView,
    RemoveProfileImageView, ChangePasswordView,
    CompanyProfileDetailView
)

urlpatterns = [
    # Authentication endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Profile endpoints
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/jobseeker/update/', JobSeekerProfileUpdateView.as_view(), name='jobseeker_profile_update'),
    path('profile/company/update/', CompanyProfileUpdateView.as_view(), name='company_profile_update'),
    path('profile/company/<int:pk>/', CompanyProfileDetailView.as_view(), name='company_profile_detail'),
    
    # Skills endpoints
    path('skills/', SkillListCreateView.as_view(), name='skills'),
    path('profile/skills/', JobSeekerSkillView.as_view(), name='jobseeker_skills'),
    path('profile/skills/<int:skill_id>/', JobSeekerSkillView.as_view(), name='jobseeker_skills_detail'),
    
    # Education endpoints
    path('profile/education/', EducationListCreateView.as_view(), name='education'),
    path('profile/education/<int:pk>/', EducationDetailView.as_view(), name='education_detail'),
    
    # Experience endpoints
    path('profile/experience/', ExperienceListCreateView.as_view(), name='experience'),
    path('profile/experience/<int:pk>/', ExperienceDetailView.as_view(), name='experience_detail'),
    
    # Social links endpoints
    path('profile/social-links/', SocialLinkListCreateView.as_view(), name='social_links'),
    path('profile/social-links/<int:pk>/', SocialLinkDetailView.as_view(), name='social_links_detail'),
    path('profile/image/remove/', RemoveProfileImageView.as_view(), name='remove_profile_image'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)