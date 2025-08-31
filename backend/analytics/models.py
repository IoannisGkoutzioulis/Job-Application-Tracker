from django.db import models
from django.contrib.auth import get_user_model
from applications.models import Application

User = get_user_model()

class ApplicationMetrics(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='application_metrics')
    total_applications = models.IntegerField(default=0)
    applications_in_progress = models.IntegerField(default=0)
    applications_submitted = models.IntegerField(default=0)
    interviews_scheduled = models.IntegerField(default=0)
    offers_received = models.IntegerField(default=0)
    rejections = models.IntegerField(default=0)
    average_response_time = models.FloatField(default=0.0)  # in days
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Application Metrics"

class ApplicationTimeline(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='timeline_events')
    event_type = models.CharField(max_length=50)  # e.g., 'submitted', 'interview_scheduled', 'offer_received'
    event_date = models.DateTimeField()
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-event_date']

class CompanyAnalytics(models.Model):
    company_name = models.CharField(max_length=255)
    total_applications = models.IntegerField(default=0)
    success_rate = models.FloatField(default=0.0)  # percentage
    average_process_duration = models.FloatField(default=0.0)  # in days
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Company Analytics"

class InterviewQuestion(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('general', 'General'),
        ('technical', 'Technical'),
        ('behavioral', 'Behavioral'),
        ('company', 'Company Specific'),
        ('role', 'Role Specific'),
    ]
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='general')
    company = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question_text[:80]

class PracticeAnswer(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='practice_answers')
    question = models.ForeignKey(InterviewQuestion, on_delete=models.CASCADE, related_name='practice_answers')
    answer_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.question.question_text[:40]}..."
