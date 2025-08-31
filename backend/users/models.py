from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
import os
from uuid import uuid4


class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model with email as the unique identifier instead of username."""

    USER_TYPE_CHOICES = [
        ('admin', 'Admin'),
        ('jobseeker', 'Job Seeker'),
        ('company', 'Company'),
    ]

    username = None  # Remove username field
    email = models.EmailField(_('email address'), unique=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    
    # Common fields for both user types
    phone = models.CharField(max_length=20, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['user_type']

    objects = UserManager()

    def __str__(self):
        return self.email


def resume_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    filename = f"resume_{uuid4().hex}{ext}"
    return os.path.join('resumes', filename)


class JobSeekerProfile(models.Model):
    """Profile for Job Seeker user type."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='jobseeker_profile')
    full_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    resume = models.FileField(upload_to=resume_upload_path, blank=True, null=True)
    about = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.full_name} - {self.user.email}"
    
    @property
    def completion_percentage(self):
        """Calculate profile completion percentage."""
        fields = [self.full_name, self.title, self.location, self.resume, self.about]
        filled_fields = sum(1 for field in fields if field)
        return int((filled_fields / len(fields)) * 100)


class CompanyProfile(models.Model):
    """Profile for Company user type."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    company_name = models.CharField(max_length=255)
    company_logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=255, blank=True)
    company_size = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=255, blank=True)
    founded_year = models.CharField(max_length=4, blank=True)
    about = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.company_name} - {self.user.email}"


class Skill(models.Model):
    """Skills for Job Seekers."""
    
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name


class JobSeekerSkill(models.Model):
    """Many-to-many relationship between Job Seekers and Skills."""
    
    jobseeker = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('jobseeker', 'skill')
    
    def __str__(self):
        return f"{self.jobseeker.full_name} - {self.skill.name}"


class Education(models.Model):
    """Education entries for Job Seekers."""
    
    jobseeker = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='education')
    institution = models.CharField(max_length=255)
    degree = models.CharField(max_length=255)
    field_of_study = models.CharField(max_length=255, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-end_date', '-start_date']
    
    def __str__(self):
        return f"{self.jobseeker.full_name} - {self.degree} from {self.institution}"


class Experience(models.Model):
    """Work experience entries for Job Seekers."""
    
    jobseeker = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='experience')
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-end_date', '-start_date']
    
    def __str__(self):
        return f"{self.jobseeker.full_name} - {self.title} at {self.company}"


class SocialLink(models.Model):
    """Social media links for both user types."""
    
    LINK_TYPES = [
        ('linkedin', 'LinkedIn'),
        ('twitter', 'Twitter'),
        ('facebook', 'Facebook'),
        ('github', 'GitHub'),
        ('instagram', 'Instagram'),
        ('website', 'Website'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_links')
    platform = models.CharField(max_length=20, choices=LINK_TYPES)
    url = models.URLField()
    
    def __str__(self):
        return f"{self.user.email} - {self.get_platform_display()}"