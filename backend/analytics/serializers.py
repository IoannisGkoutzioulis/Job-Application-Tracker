from rest_framework import serializers
from .models import ApplicationMetrics, ApplicationTimeline, CompanyAnalytics, InterviewQuestion
from applications.models import PracticeAnswer

class ApplicationMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationMetrics
        fields = '__all__'

class ApplicationTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationTimeline
        fields = '__all__'

class CompanyAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyAnalytics
        fields = '__all__'

class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = '__all__'

class PracticeAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeAnswer
        fields = '__all__'
        read_only_fields = ['jobseeker', 'score'] 