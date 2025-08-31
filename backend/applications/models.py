from django.db import models
from users.models import JobSeekerProfile
from jobs.models import Job


class Application(models.Model):
    """Job application model."""
    
    STATUS_CHOICES = [
        ('New', 'New'),
        ('Under Review', 'Under Review'),
        ('Shortlisted', 'Shortlisted'),
        ('Interviewed', 'Interviewed'),
        ('Rejected', 'Rejected'),
        ('Offer', 'Offer'),
        ('Hired', 'Hired'),
        ('Withdrawn', 'Withdrawn'),
    ]
    
    jobseeker = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='applications')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    cover_letter = models.TextField(blank=True)
    resume = models.FileField(upload_to='application_resumes/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('jobseeker', 'job')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.jobseeker.full_name} - {self.job.title} at {self.job.company.company_name}"
    
    @property
    def applicant_name(self):
        return self.jobseeker.full_name
    
    @property
    def job_title(self):
        return self.job.title
    
    @property
    def job_id(self):
        return self.job.id
    
    @property
    def company_name(self):
        return self.job.company.company_name
    
    @property
    def location(self):
        return self.job.location
    
    @property
    def experience_level(self):
        return self.job.experience_level


class ApplicationNote(models.Model):
    """Notes for job applications from company/recruiters."""
    
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='notes')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='application_notes')  # Add created_by field
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.application} - {self.created_at.strftime('%Y-%m-%d')}"


class Interview(models.Model):
    """Interview model for scheduling interviews."""
    
    INTERVIEW_TYPE_CHOICES = [
        ('Phone', 'Phone'),
        ('Video', 'Video Call'),
        ('In-Person', 'In-Person'),
        ('Assessment', 'Assessment'),
        ('Other', 'Other'),
    ]
    
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    scheduled_at = models.DateTimeField()  # Changed from interview_date
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPE_CHOICES)
    location = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)  # Changed from details
    duration = models.PositiveIntegerField(help_text="Duration in minutes", default=60)  # Added field
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Added field
    
    class Meta:
        ordering = ['scheduled_at']  # Updated from interview_date
    
    def __str__(self):
        return f"{self.application} - {self.get_interview_type_display()} on {self.scheduled_at.strftime('%Y-%m-%d %H:%M')}"


class InterviewQuestion(models.Model):
    CATEGORY_CHOICES = [
        ('General', 'General'),
        ('Technical', 'Technical'),
        ('Behavioral', 'Behavioral'),
        ('Other', 'Other'),
    ]
    question_text = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='General')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category}: {self.question_text[:50]}"


class PracticeAnswer(models.Model):
    question = models.ForeignKey(InterviewQuestion, on_delete=models.CASCADE, related_name='answers')
    jobseeker = models.ForeignKey(JobSeekerProfile, on_delete=models.CASCADE, related_name='practice_answers')
    answer_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0)

    def __str__(self):
        return f"Answer by {self.jobseeker.full_name} to Q{self.question.id}"