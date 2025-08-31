from rest_framework import serializers
from django.utils import timezone
from django.core.validators import FileExtensionValidator
import re
from datetime import date, datetime, timedelta
from .models import Application, ApplicationNote, Interview
from users.models import JobSeekerProfile
from jobs.models import Job

class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating job applications."""
    
    cover_letter = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Application
        fields = ['job', 'cover_letter', 'resume']
        extra_kwargs = {
            'job': {'required': True},
            'resume': {'required': False}
        }
    
    def validate_job(self, value):
        """Validate job is active and deadline has not passed."""
        if value.status != 'active':
            raise serializers.ValidationError("Cannot apply to inactive job.")
        
        if value.application_deadline and value.application_deadline < timezone.now().date():
            raise serializers.ValidationError("Application deadline has passed.")
        
        return value
    
    def validate_cover_letter(self, value):
        """Validate cover letter."""
        if value and len(value) > 5000:
            raise serializers.ValidationError("Cover letter cannot exceed 5000 characters.")
        return value
    
    def validate_resume(self, value):
        """Validate resume file."""
        if value:
            # Check file size (limit to 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Resume file too large (max 10MB).")
            
            # Check file extension
            ext = value.name.split('.')[-1].lower()
            valid_extensions = ['pdf', 'doc', 'docx']
            if ext not in valid_extensions:
                raise serializers.ValidationError(f"Unsupported file extension. Use {', '.join(valid_extensions)}.")
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        request = self.context.get('request')
        job = attrs.get('job')
        
        # Check if user has already applied to this job
        if request and job:
            try:
                jobseeker = request.user.jobseeker_profile
                if Application.objects.filter(jobseeker=jobseeker, job=job).exists():
                    raise serializers.ValidationError({"job": "You have already applied to this job."})
            except JobSeekerProfile.DoesNotExist:
                pass
        
        return attrs


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer for job applications."""
    
    jobseeker_name = serializers.CharField(source='jobseeker.full_name', read_only=True)
    jobseeker_email = serializers.EmailField(source='jobseeker.user.email', read_only=True)
    jobseeker_title = serializers.CharField(source='jobseeker.title', read_only=True)
    jobseeker_location = serializers.CharField(source='jobseeker.location', read_only=True)
    jobseeker_about = serializers.CharField(source='jobseeker.about', read_only=True)
    jobseeker_resume = serializers.FileField(source='jobseeker.resume', read_only=True)
    jobseeker_skills = serializers.SerializerMethodField()
    jobseeker_education = serializers.SerializerMethodField()
    jobseeker_experience = serializers.SerializerMethodField()
    jobseeker_social_links = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.company_name', read_only=True)
    salary = serializers.CharField(source='job.salary', read_only=True)
    applied_date = serializers.DateTimeField(source='created_at', read_only=True)
    job_id = serializers.IntegerField(source='job.id', read_only=True)
    
    def get_jobseeker_skills(self, obj):
        return [js.skill.name for js in obj.jobseeker.skills.all()]

    def get_jobseeker_education(self, obj):
        return [
            {
                'institution': edu.institution,
                'degree': edu.degree,
                'field_of_study': edu.field_of_study,
                'start_date': edu.start_date,
                'end_date': edu.end_date,
                'is_current': edu.is_current,
                'description': edu.description,
            }
            for edu in obj.jobseeker.education.all()
        ]

    def get_jobseeker_experience(self, obj):
        return [
            {
                'title': exp.title,
                'company': exp.company,
                'location': exp.location,
                'start_date': exp.start_date,
                'end_date': exp.end_date,
                'is_current': exp.is_current,
                'description': exp.description,
            }
            for exp in obj.jobseeker.experience.all()
        ]

    def get_jobseeker_social_links(self, obj):
        return [
            {
                'platform': link.platform,
                'url': link.url,
            }
            for link in obj.jobseeker.user.social_links.all()
        ]

    class Meta:
        model = Application
        fields = [
            'id', 'jobseeker', 'jobseeker_name', 'jobseeker_email', 'jobseeker_title', 'jobseeker_location',
            'jobseeker_about', 'jobseeker_resume', 'jobseeker_skills', 'jobseeker_education', 'jobseeker_experience',
            'jobseeker_social_links', 'job', 'job_id', 'job_title', 'company_name', 'status', 'cover_letter', 'resume',
            'applied_date', 'updated_at', 'salary'
        ]
        read_only_fields = ['id', 'jobseeker', 'job', 'created_at', 'updated_at']


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating application status."""
    
    class Meta:
        model = Application
        fields = ['status']
    
    def validate_status(self, value):
        """Validate status value."""
        valid_statuses = [status[0] for status in Application.STATUS_CHOICES]  # Get valid statuses directly from model
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid status. Choose from: {', '.join(valid_statuses)}.")
        return value
    
    def validate(self, attrs):
        """Validate status transitions."""
        # Get current status
        instance = getattr(self, 'instance', None)
        if instance:
            current_status = instance.status
            new_status = attrs.get('status')
            
            # Prevent invalid status transitions
            if current_status == 'Rejected' and new_status not in ['New', 'Withdrawn']:
                raise serializers.ValidationError({
                    "status": "Cannot change from 'Rejected' status except to 'New' or 'Withdrawn'."
                })
                
            if current_status == 'Withdrawn' and new_status != 'New':
                raise serializers.ValidationError({
                    "status": "Can only change from 'Withdrawn' status to 'New'."
                })
        
        return attrs


class ApplicationNoteSerializer(serializers.ModelSerializer):
    """Serializer for application notes."""
    
    created_by = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ApplicationNote
        fields = ['id', 'application', 'text', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']
        extra_kwargs = {
            'application': {'required': True}
        }
    
    def validate_text(self, value):
        """Validate note text."""
        if not value:
            raise serializers.ValidationError("Note text is required.")
        if len(value) < 2:
            raise serializers.ValidationError("Note text must be at least 2 characters long.")
        if len(value) > 1000:
            raise serializers.ValidationError("Note text cannot exceed 1000 characters.")
        return value


class InterviewSerializer(serializers.ModelSerializer):
    """Serializer for interviews."""
    
    class Meta:
        model = Interview
        fields = [
            'id', 'application', 'interview_type', 'scheduled_at', 
            'duration', 'location', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_interview_type(self, value):
        """Validate interview type."""
        valid_types = [type[0] for type in Interview.INTERVIEW_TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid interview type. Choose from: {', '.join(valid_types)}.")
        return value
    
    def validate_scheduled_at(self, value):
        """Validate interview schedule date."""
        # Interview can't be scheduled in the past
        if value < timezone.now():
            raise serializers.ValidationError("Interview cannot be scheduled in the past.")
        
        # Interview should be scheduled at least 1 hour in the future
        if value < timezone.now() + timedelta(hours=1):
            raise serializers.ValidationError("Interview must be scheduled at least 1 hour in advance.")
        
        # Interview shouldn't be scheduled too far in the future
        if value > timezone.now() + timedelta(days=180):
            raise serializers.ValidationError("Interview cannot be scheduled more than 6 months in advance.")
        
        return value
    
    def validate_duration(self, value):
        """Validate interview duration."""
        if value < 15:
            raise serializers.ValidationError("Interview duration must be at least 15 minutes.")
        if value > 240:
            raise serializers.ValidationError("Interview duration cannot exceed 4 hours (240 minutes).")
        return value
    
    def validate_location(self, value):
        """Validate interview location."""
        if value and len(value) > 200:
            raise serializers.ValidationError("Location description cannot exceed 200 characters.")
        return value
    
    def validate_notes(self, value):
        """Validate interview notes."""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Notes cannot exceed 1000 characters.")
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        interview_type = attrs.get('interview_type')
        location = attrs.get('location')
        
        # For in-person interviews, location is required
        if interview_type == 'In-Person' and not location:
            raise serializers.ValidationError({
                "location": "Location is required for in-person interviews."
            })
        
        return attrs