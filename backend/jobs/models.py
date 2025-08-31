from django.db import models
from users.models import CompanyProfile, Skill


class Job(models.Model):
    """Job posting model."""
    
    EMPLOYMENT_TYPE_CHOICES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('freelance', 'Freelance'),
    ]
    
    EXPERIENCE_LEVEL_CHOICES = [
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('executive', 'Executive Level'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('draft', 'Draft'),
    ]
    
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField()
    location = models.CharField(max_length=255)
    salary = models.CharField(max_length=100, blank=True, null=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full-time')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES, default='entry')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    application_deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} at {self.company.company_name}"
    
    @property
    def application_count(self):
        """Get the number of applications for this job."""
        return self.applications.count()


class JobSkill(models.Model):
    """Skills required for a job posting."""
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('job', 'skill')
    
    def __str__(self):
        return f"{self.job.title} - {self.skill.name}"