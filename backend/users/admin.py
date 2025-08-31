from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    User, JobSeekerProfile, CompanyProfile, Skill, 
    JobSeekerSkill, Education, Experience, SocialLink
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin with email as the primary identifier."""
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'user_type', 'phone', 'profile_image')}),
        (
            _('Permissions'),
            {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')},
        ),
        (_('Important dates'), {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'user_type', 'password1', 'password2'),
            },
        ),
    )
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)


@admin.register(JobSeekerProfile)
class JobSeekerProfileAdmin(admin.ModelAdmin):
    """Admin for JobSeekerProfile model."""
    
    list_display = ('full_name', 'user', 'title', 'location')
    search_fields = ('full_name', 'user__email', 'title', 'location')
    list_filter = ('location',)


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    """Admin for CompanyProfile model."""
    
    list_display = ('company_name', 'user', 'industry', 'location')
    search_fields = ('company_name', 'user__email', 'industry', 'location')
    list_filter = ('industry', 'location')


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    """Admin for Skill model."""
    
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(JobSeekerSkill)
class JobSeekerSkillAdmin(admin.ModelAdmin):
    """Admin for JobSeekerSkill model."""
    
    list_display = ('jobseeker', 'skill')
    search_fields = ('jobseeker__full_name', 'skill__name')
    list_filter = ('skill',)


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    """Admin for Education model."""
    
    list_display = ('jobseeker', 'institution', 'degree', 'start_date', 'end_date', 'is_current')
    search_fields = ('jobseeker__full_name', 'institution', 'degree', 'field_of_study')
    list_filter = ('is_current',)


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    """Admin for Experience model."""
    
    list_display = ('jobseeker', 'title', 'company', 'start_date', 'end_date', 'is_current')
    search_fields = ('jobseeker__full_name', 'title', 'company', 'location')
    list_filter = ('is_current',)


@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    """Admin for SocialLink model."""
    
    list_display = ('user', 'platform', 'url')
    search_fields = ('user__email',)
    list_filter = ('platform',)