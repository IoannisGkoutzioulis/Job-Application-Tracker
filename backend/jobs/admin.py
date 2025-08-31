from django.contrib import admin
from .models import Job, JobSkill


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """Admin for Job model."""
    
    list_display = ('title', 'company', 'location', 'employment_type', 'experience_level', 
                   'status', 'application_deadline', 'created_at')
    search_fields = ('title', 'company__company_name', 'location')
    list_filter = ('status', 'employment_type', 'experience_level', 'created_at')
    date_hierarchy = 'created_at'


@admin.register(JobSkill)
class JobSkillAdmin(admin.ModelAdmin):
    """Admin for JobSkill model."""
    
    list_display = ('job', 'skill')
    search_fields = ('job__title', 'skill__name')
    list_filter = ('skill',)