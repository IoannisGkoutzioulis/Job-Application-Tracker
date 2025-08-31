from django.contrib import admin
from .models import Application, ApplicationNote, Interview, InterviewQuestion, PracticeAnswer


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    """Admin for Application model."""
    
    list_display = ('jobseeker', 'job', 'status', 'created_at')
    search_fields = ('jobseeker__full_name', 'job__title', 'job__company__company_name')
    list_filter = ('status', 'created_at')
    date_hierarchy = 'created_at'


@admin.register(ApplicationNote)
class ApplicationNoteAdmin(admin.ModelAdmin):
    """Admin for ApplicationNote model."""
    
    list_display = ('application', 'text_preview', 'created_at')
    search_fields = ('application__jobseeker__full_name', 'application__job__title', 'text')
    date_hierarchy = 'created_at'
    
    def text_preview(self, obj):
        """Preview of the note text."""
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Note'


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    """Admin for Interview model."""
    
    # Update these lines to use scheduled_at instead of interview_date
    list_display = ('application', 'interview_type', 'scheduled_at', 'location')
    search_fields = ('application__jobseeker__full_name', 'application__job__title', 'location')
    list_filter = ('interview_type', 'scheduled_at')
    date_hierarchy = 'scheduled_at'


admin.site.register(InterviewQuestion)
admin.site.register(PracticeAnswer)