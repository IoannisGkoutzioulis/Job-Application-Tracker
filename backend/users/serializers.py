from rest_framework import serializers
from django.utils import timezone
from django.core.validators import URLValidator, RegexValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import re
from datetime import date
from .models import (
    User, JobSeekerProfile, CompanyProfile, 
    Skill, JobSeekerSkill, Education, Experience, SocialLink
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the custom User model."""
    
    profile_image = serializers.ImageField(use_url=True, required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'user_type', 'first_name', 'last_name', 'phone', 'profile_image', 'date_joined']
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'first_name': {'required': True},
            'phone': {'required': False}
        }
    
    def validate_email(self, value):
        """Validate email format."""
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
            raise serializers.ValidationError("Enter a valid email address.")
        return value.lower()  # Normalize email to lowercase
    
    def validate_phone(self, value):
        """Validate phone number format."""
        if value and not re.match(r'^\+?[0-9]{10,15}$', re.sub(r'[\s\-()]', '', value)):
            raise serializers.ValidationError("Enter a valid phone number (10-15 digits).")
        return value
    
    def validate_profile_image(self, value):
        """Validate profile image."""
        if value:
            # Check file size (limit to 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Image file too large (max 5MB).")
            
            # Check file extension
            ext = value.name.split('.')[-1].lower()
            valid_extensions = ['jpg', 'jpeg', 'png', 'gif']
            if ext not in valid_extensions:
                raise serializers.ValidationError(f"Unsupported file extension. Use {', '.join(valid_extensions)}.")
        return value



class SocialLinkSerializer(serializers.ModelSerializer):
    """Serializer for social media links."""
    
    class Meta:
        model = SocialLink
        fields = ['id', 'platform', 'url']
    
    def validate_platform(self, value):
        """Validate the social media platform."""
        valid_platforms = ['linkedin', 'twitter', 'facebook', 'github', 'instagram', 'website', 'other']
        if value.lower() not in valid_platforms:
            raise serializers.ValidationError(f"Invalid platform. Choose from: {', '.join(valid_platforms)}.")
        return value.lower()
    
    def validate_url(self, value):
        """Validate the URL format."""
        url_validator = URLValidator()
        try:
            url_validator(value)
        except:
            raise serializers.ValidationError("Enter a valid URL (e.g., https://example.com).")
        
        # Ensure URL uses HTTPS
        if not value.startswith(('http://', 'https://')):
            value = 'https://' + value
        
        return value


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for skills."""
    
    class Meta:
        model = Skill
        fields = ['id', 'name']
    
    def validate_name(self, value):
        """Validate skill name."""
        if len(value) < 2:
            raise serializers.ValidationError("Skill name must be at least 2 characters long.")
        if len(value) > 50:
            raise serializers.ValidationError("Skill name cannot exceed 50 characters.")
        
        # Basic sanitization
        value = value.strip().lower()
        
        # Check for invalid characters
        if not re.match(r'^[a-zA-Z0-9\s\-\+\#\.]+$', value):
            raise serializers.ValidationError("Skill name contains invalid characters.")
        
        return value


class JobSeekerSkillSerializer(serializers.ModelSerializer):
    """Serializer for JobSeekerSkill with nested Skill data."""
    
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    
    class Meta:
        model = JobSeekerSkill
        fields = ['id', 'skill', 'skill_name']
        extra_kwargs = {'skill': {'write_only': True}}


class EducationSerializer(serializers.ModelSerializer):
    """Serializer for education history."""
    
    class Meta:
        model = Education
        fields = ['id', 'institution', 'degree', 'field_of_study', 
                 'start_date', 'end_date', 'is_current', 'description']
    
    def validate_institution(self, value):
        """Validate institution name."""
        if len(value) < 2:
            raise serializers.ValidationError("Institution name must be at least 2 characters long.")
        if len(value) > 100:
            raise serializers.ValidationError("Institution name cannot exceed 100 characters.")
        return value
    
    def validate_degree(self, value):
        """Validate degree."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Degree cannot exceed 100 characters.")
        return value
    
    def validate_field_of_study(self, value):
        """Validate field of study."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Field of study cannot exceed 100 characters.")
        return value
    
    def validate_description(self, value):
        """Validate description."""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Description cannot exceed 1000 characters.")
        return value
    
    def validate(self, attrs):
        """Validate date logic."""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        is_current = attrs.get('is_current', False)
        
        # Check start date isn't in the future
        if start_date and start_date > date.today():
            raise serializers.ValidationError({"start_date": "Start date cannot be in the future."})
        
        # If it's not current, end date is required
        if not is_current and not end_date:
            raise serializers.ValidationError({"end_date": "End date is required if not currently studying here."})
        
        # If it's current, end date should be None
        if is_current and end_date:
            attrs['end_date'] = None
        
        # Check end date logic
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        
        return attrs


class ExperienceSerializer(serializers.ModelSerializer):
    """Serializer for work experience."""
    
    class Meta:
        model = Experience
        fields = ['id', 'title', 'company', 'location', 
                 'start_date', 'end_date', 'is_current', 'description']
    
    def validate_title(self, value):
        """Validate job title."""
        if len(value) < 2:
            raise serializers.ValidationError("Job title must be at least 2 characters long.")
        if len(value) > 100:
            raise serializers.ValidationError("Job title cannot exceed 100 characters.")
        return value
    
    def validate_company(self, value):
        """Validate company name."""
        if len(value) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters long.")
        if len(value) > 100:
            raise serializers.ValidationError("Company name cannot exceed 100 characters.")
        return value
    
    def validate_location(self, value):
        """Validate location."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Location cannot exceed 100 characters.")
        return value
    
    def validate_description(self, value):
        """Validate description."""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Description cannot exceed 1000 characters.")
        return value
    
    def validate(self, attrs):
        """Validate date logic."""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        is_current = attrs.get('is_current', False)
        
        # Check start date isn't in the future
        if start_date and start_date > date.today():
            raise serializers.ValidationError({"start_date": "Start date cannot be in the future."})
        
        # If it's not current, end date is required
        if not is_current and not end_date:
            raise serializers.ValidationError({"end_date": "End date is required if not currently working here."})
        
        # If it's current, end date should be None
        if is_current and end_date:
            attrs['end_date'] = None
        
        # Check end date logic
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        
        return attrs


class JobSeekerProfileSerializer(serializers.ModelSerializer):
    """Serializer for JobSeekerProfile with nested related data."""
    
    skills = serializers.SerializerMethodField()
    education = EducationSerializer(many=True, read_only=True)
    experience = ExperienceSerializer(many=True, read_only=True)
    social_links = serializers.SerializerMethodField()
    completion_percentage = serializers.IntegerField(read_only=True)
    resume = serializers.FileField(use_url=True, required=False)
    
    class Meta:
        model = JobSeekerProfile
        fields = ['id', 'full_name', 'title', 'location', 'resume', 'about',
                 'skills', 'education', 'experience', 'social_links', 'completion_percentage']
    
    def get_skills(self, obj):
        jobseeker_skills = JobSeekerSkill.objects.filter(jobseeker=obj)
        return [{'id': js.skill.id, 'name': js.skill.name} for js in jobseeker_skills]
    
    def get_social_links(self, obj):
        links = SocialLink.objects.filter(user=obj.user)
        return SocialLinkSerializer(links, many=True).data


class CompanyProfileSerializer(serializers.ModelSerializer):
    """Serializer for CompanyProfile with nested related data."""
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    social_links = serializers.SerializerMethodField()

    class Meta:
        model = CompanyProfile
        fields = [
            'id', 'company_name', 'company_logo', 'website',
            'industry', 'company_size', 'location',
            'founded_year', 'about', 'email', 'phone', 'social_links'
        ]

    def get_social_links(self, obj):
        links = SocialLink.objects.filter(user=obj.user)
        return SocialLinkSerializer(links, many=True).data


class UserWithProfileSerializer(serializers.ModelSerializer):
    """Extended User serializer that includes profile data."""
    
    profile = serializers.SerializerMethodField()
    profile_image = serializers.ImageField(use_url=True, required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'user_type', 'first_name', 'last_name', 
                 'phone', 'profile_image', 'date_joined', 'profile']
        read_only_fields = ['id', 'date_joined']
    
    def get_profile(self, obj):
        if obj.user_type == 'jobseeker':
            try:
                profile = obj.jobseeker_profile
                return JobSeekerProfileSerializer(profile).data
            except JobSeekerProfile.DoesNotExist:
                return None
        elif obj.user_type == 'company':
            try:
                profile = obj.company_profile
                return CompanyProfileSerializer(profile).data
            except CompanyProfile.DoesNotExist:
                return None
        return None

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}
    )
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_name = serializers.CharField(write_only=True, required=False)
    industry = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password', 'user_type', 
                 'first_name', 'last_name', 'phone', 'full_name', 
                 'company_name', 'industry']
    
    def validate_email(self, value):
        """Validate email format and uniqueness."""
        # Check format
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
            raise serializers.ValidationError("Enter a valid email address.")
        
        # Check if email exists
        normalized_email = value.lower()
        if User.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return normalized_email
    
    def validate_password(self, value):
        """Validate password strength."""
        # Check length
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Check complexity
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Password must contain at least one number.")
        
        # Check for common passwords (simplified example)
        common_passwords = ['password', '12345678', 'qwerty123', 'admin123']
        if value.lower() in common_passwords:
            raise serializers.ValidationError("This password is too common.")
        
        return value
    
    def validate_phone(self, value):
        """Validate phone number format."""
        if value and not re.match(r'^\+?[0-9]{10,15}$', re.sub(r'[\s\-()]', '', value)):
            raise serializers.ValidationError("Enter a valid phone number (10-15 digits).")
        return value
    
    def validate_full_name(self, value):
        """Validate full name."""
        if value and len(value) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters long.")
        if value and len(value) > 100:
            raise serializers.ValidationError("Full name cannot exceed 100 characters.")
        return value
    
    def validate_company_name(self, value):
        """Validate company name."""
        if value and len(value) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters long.")
        if value and len(value) > 100:
            raise serializers.ValidationError("Company name cannot exceed 100 characters.")
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Validate user_type
        user_type = attrs.get('user_type')
        if user_type not in ['jobseeker', 'company']:
            raise serializers.ValidationError({"user_type": "User type must be either 'jobseeker' or 'company'."})
        
        # Company users should provide company name
        if user_type == 'company' and not attrs.get('company_name'):
            raise serializers.ValidationError({"company_name": "Company name is required for company accounts."})
        
        # Handle full_name to first_name/last_name conversion for jobseekers only
        if user_type == 'jobseeker':
            full_name = attrs.get('full_name')
            if not full_name:
                raise serializers.ValidationError({"full_name": "Full name is required for jobseeker accounts."})
            name_parts = full_name.split(' ', 1)
            attrs['first_name'] = name_parts[0]
            attrs['last_name'] = name_parts[1] if len(name_parts) > 1 else ''
            attrs.pop('full_name')
            if not attrs.get('first_name'):
                raise serializers.ValidationError({"first_name": "First name is required."})
        elif user_type == 'company':
            # For companies, you can set first_name/last_name to company_name and remove full_name if present or blank
            attrs['first_name'] = attrs.get('company_name')
            attrs['last_name'] = ''
            if 'full_name' in attrs:
                attrs.pop('full_name')
        
        return attrs
    
    def create(self, validated_data):
        # Extract profile-specific fields
        company_name = validated_data.pop('company_name', None)
        industry = validated_data.pop('industry', None)
        title = validated_data.pop('title', '')
        location = validated_data.pop('location', '')
        about = validated_data.pop('about', '')
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data['user_type'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', '')
        )
        
        # Create a basic profile
        if user.user_type == 'jobseeker':
            JobSeekerProfile.objects.create(
                user=user,
                full_name=f"{user.first_name} {user.last_name}".strip(),
                title=title,
                location=location,
                about=about
            )
        elif user.user_type == 'company':
            CompanyProfile.objects.create(
                user=user,
                company_name=company_name or f"{user.first_name} {user.last_name}".strip(),
                industry=industry or ''
            )
        
        return user


class JobSeekerProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating job seeker profile."""
    
    class Meta:
        model = JobSeekerProfile
        fields = ['full_name', 'title', 'location', 'about']
    
    def validate_full_name(self, value):
        """Validate full name."""
        if not value:
            raise serializers.ValidationError("Full name is required.")
        if len(value) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters long.")
        if len(value) > 100:
            raise serializers.ValidationError("Full name cannot exceed 100 characters.")
        return value
    
    def validate_title(self, value):
        """Validate professional title."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Professional title cannot exceed 100 characters.")
        return value
    
    def validate_location(self, value):
        """Validate location."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Location cannot exceed 100 characters.")
        return value
    
    def validate_about(self, value):
        """Validate about section."""
        if value and len(value) > 2000:
            raise serializers.ValidationError("About section cannot exceed 2000 characters.")
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


class CompanyProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating company profile."""
    
    class Meta:
        model = CompanyProfile
        fields = ['company_name', 'company_logo', 'website', 'industry', 
                 'company_size', 'location', 'founded_year', 'about']
    
    def validate_company_name(self, value):
        """Validate company name."""
        if not value:
            raise serializers.ValidationError("Company name is required.")
        if len(value) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters long.")
        if len(value) > 100:
            raise serializers.ValidationError("Company name cannot exceed 100 characters.")
        return value
    
    def validate_company_logo(self, value):
        """Validate company logo."""
        if value:
            # Check file size (limit to 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Logo file too large (max 5MB).")
            
            # Check file extension
            ext = value.name.split('.')[-1].lower()
            valid_extensions = ['jpg', 'jpeg', 'png', 'gif']
            if ext not in valid_extensions:
                raise serializers.ValidationError(f"Unsupported file extension. Use {', '.join(valid_extensions)}.")
        return value
    
    def validate_website(self, value):
        """Validate website URL."""
        if value:
            url_validator = URLValidator()
            try:
                url_validator(value)
            except:
                raise serializers.ValidationError("Enter a valid URL (e.g., https://example.com).")
            
            # Ensure URL uses HTTPS
            if not value.startswith(('http://', 'https://')):
                value = 'https://' + value
        return value
    
    def validate_industry(self, value):
        """Validate industry."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Industry cannot exceed 100 characters.")
        return value
    
    def validate_company_size(self, value):
        """Validate company size."""
        valid_sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']
        if value and value not in valid_sizes:
            raise serializers.ValidationError(f"Invalid company size. Choose from: {', '.join(valid_sizes)}.")
        return value
    
    def validate_location(self, value):
        """Validate location."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Location cannot exceed 100 characters.")
        return value
    
    def validate_founded_year(self, value):
        """Validate founded year."""
        current_year = timezone.now().year
        if value:
            try:
                value_int = int(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Founded year must be a number.")
            if value_int < 1800 or value_int > current_year:
                raise serializers.ValidationError(f"Founded year must be between 1800 and {current_year}.")
            return value_int
        return value
    
    def validate_about(self, value):
        """Validate about section."""
        if value and len(value) > 2000:
            raise serializers.ValidationError("About section cannot exceed 2000 characters.")
        return value
    
    def update(self, instance, validated_data):
        # Handle company_logo deletion if set to '' or None
        company_logo = validated_data.get('company_logo', None)
        if company_logo == '' or company_logo is None:
            if instance.company_logo:
                instance.company_logo.delete(save=False)
            instance.company_logo = None
            validated_data.pop('company_logo', None)
        return super().update(instance, validated_data)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'user_type': self.user.user_type,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        return data