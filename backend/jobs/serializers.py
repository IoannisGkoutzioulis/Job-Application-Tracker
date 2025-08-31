from rest_framework import serializers
from django.utils import timezone
from .models import Job, JobSkill
from users.models import Skill
from users.serializers import CompanyProfileSerializer
import re


class JobSkillSerializer(serializers.ModelSerializer):
    """Serializer for JobSkill with nested Skill data."""
    
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    
    class Meta:
        model = JobSkill
        fields = ['id', 'skill', 'skill_name']
        extra_kwargs = {'skill': {'write_only': True}}


class JobSerializer(serializers.ModelSerializer):
    """Serializer for Job with company data."""
    
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    company_logo = serializers.ImageField(source='company.company_logo', read_only=True)
    skills = serializers.SerializerMethodField()
    application_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'requirements', 'location', 'salary',
            'employment_type', 'experience_level', 'status', 'application_deadline',
            'created_at', 'updated_at', 'company_name', 'company_logo',
            'skills', 'application_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'application_count']
    
    def get_skills(self, obj):
        job_skills = JobSkill.objects.filter(job=obj)
        return [{'id': js.skill.id, 'name': js.skill.name} for js in job_skills]


class JobDetailSerializer(JobSerializer):
    """Extended Job serializer with additional company data."""
    
    company = CompanyProfileSerializer(read_only=True)
    
    class Meta:
        model = Job
        fields = JobSerializer.Meta.fields + ['company']
        read_only_fields = JobSerializer.Meta.read_only_fields


class JobCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating jobs."""
    
    skills = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        write_only=True
    )
    salary = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Job
        fields = [
            'title', 'description', 'requirements', 'location', 'salary',
            'employment_type', 'experience_level', 'status', 'application_deadline',
            'skills'
        ]
    
    def validate_title(self, value):
        """Validate the job title."""
        if len(value) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters long.")
        if len(value) > 100:
            raise serializers.ValidationError("Title cannot exceed 100 characters.")
        # Check for invalid characters using regex
        if not re.match(r'^[a-zA-Z0-9\s\-\.,!?&()/+]+$', value):
            raise serializers.ValidationError("Title contains invalid characters.")
        return value
    
    def validate_description(self, value):
        """Validate the job description."""
        if len(value) < 50:
            raise serializers.ValidationError("Description must be at least 50 characters long.")
        if len(value) > 5000:
            raise serializers.ValidationError("Description cannot exceed 5000 characters.")
        return value
    
    def validate_requirements(self, value):
        """Validate the job requirements."""
        if len(value) < 20:
            raise serializers.ValidationError("Requirements must be at least 20 characters long.")
        if len(value) > 2000:
            raise serializers.ValidationError("Requirements cannot exceed 2000 characters.")
        return value
    
    def validate_location(self, value):
        """Validate the job location."""
        if len(value) < 2:
            raise serializers.ValidationError("Location must be at least 2 characters long.")
        if len(value) > 100:
            raise serializers.ValidationError("Location cannot exceed 100 characters.")
        return value
    
    def validate_salary(self, value):
        print("DEBUG: validate_salary called with value:", repr(value))
        """Validate the job salary."""
        # Treat empty string or None as no salary specified
        if value is None or (isinstance(value, str) and value.strip() == ""):
            return ""

        # Normalize string
        if isinstance(value, str):
            value = value.strip()

        # Allow "Competitive" or "Negotiable"
        if isinstance(value, str) and value.lower() in ["competitive", "negotiable"]:
            return value

        # Check numeric salary range format (allow $, spaces, dots, and commas)
        if isinstance(value, str) and "-" in value:
            try:
                min_salary, max_salary = map(str.strip, value.split("-"))
                # Remove $, spaces, and normalize decimal/thousand separators
                min_salary_clean = min_salary.replace("$", "").replace(" ", "").replace(".", "").replace(",", "")
                max_salary_clean = max_salary.replace("$", "").replace(" ", "").replace(".", "").replace(",", "")
                min_salary_float = float(min_salary_clean)
                max_salary_float = float(max_salary_clean)
                if min_salary_float < 0 or max_salary_float < 0:
                    raise serializers.ValidationError("Salary values cannot be negative.")
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    "Salary range must be in format 'min-max' (e.g., '50.000-70.000', '120,000-170,000', '13.000 - 16.000')."
                )
            return value

        # Check if it's a plain number (allow $, spaces, dots, and commas)
        elif (
            isinstance(value, (int, float))
            or (isinstance(value, str) and value.replace("$", "").replace(" ", "").replace(".", "").replace(",", "").isdigit())
        ):
            try:
                salary_clean = value.replace("$", "").replace(" ", "").replace(".", "").replace(",", "")
                salary_float = float(salary_clean)
                if salary_float < 0:
                    raise serializers.ValidationError("Salary cannot be negative.")
            except (ValueError, TypeError):
                raise serializers.ValidationError("Invalid salary format.")
            return value

        raise serializers.ValidationError(
            "Salary must be empty, a number, range (e.g., '50.000-70.000', '120,000-170,000', '13.000 - 16.000'), or 'Competitive' or 'Negotiable'."
        )
    
    def validate_application_deadline(self, value):
        """Validate the application deadline."""
        # Ensure deadline is not in the past
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Application deadline cannot be in the past.")
        return value
    
    def validate_skills(self, value):
        """Validate the skills list."""
        if value and len(value) > 20:
            raise serializers.ValidationError("Cannot specify more than 20 skills for a job.")
        
        # Ensure each skill has a valid length
        for skill in value:
            if len(skill.strip()) < 2:
                raise serializers.ValidationError("Each skill must be at least 2 characters long.")
            if len(skill.strip()) > 50:
                raise serializers.ValidationError("Each skill cannot exceed 50 characters.")
        
        return value
    
    def validate(self, attrs):
        """Validate the entire data set."""
        # If status is 'active', ensure there's a deadline
        if attrs.get('status') == 'active' and not attrs.get('application_deadline'):
            raise serializers.ValidationError({
                "application_deadline": "Active jobs must have an application deadline."
            })
        
        # Title should not be identical to description (indicating potential spam)
        if 'title' in attrs and 'description' in attrs:
            if attrs['title'] == attrs['description']:
                raise serializers.ValidationError({
                    "description": "Description cannot be identical to the title."
                })
        
        return attrs
    
    def create(self, validated_data):
        skills_data = validated_data.pop('skills', [])
        job = Job.objects.create(**validated_data)
        
        # Add skills to the job
        for skill_name in skills_data:
            skill, _ = Skill.objects.get_or_create(name=skill_name.lower().strip())
            JobSkill.objects.create(job=job, skill=skill)
        
        return job
    
    def update(self, instance, validated_data):
        skills_data = validated_data.pop('skills', None)
        
        # Update the job instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update skills if provided
        if skills_data is not None:
            # Remove existing skills
            JobSkill.objects.filter(job=instance).delete()
            
            # Add new skills
            for skill_name in skills_data:
                skill, _ = Skill.objects.get_or_create(name=skill_name.lower().strip())
                JobSkill.objects.create(job=instance, skill=skill)
        
        return instance