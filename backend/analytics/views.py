from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta
from .models import ApplicationMetrics, ApplicationTimeline, CompanyAnalytics
from applications.models import InterviewQuestion, PracticeAnswer
from .serializers import (
    ApplicationMetricsSerializer,
    ApplicationTimelineSerializer,
    CompanyAnalyticsSerializer,
    InterviewQuestionSerializer,
    PracticeAnswerSerializer
)
from applications.models import Application
from config.utils import StandardResultsSetPagination

# Create your views here.

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['GET'])
    def dashboard_metrics(self, request):
        user = request.user
        from applications.models import Application

        # Get the jobseeker profile for this user
        jobseeker_profile = getattr(user, 'jobseeker_profile', None)
        print("DEBUG: user =", user)
        print("DEBUG: jobseeker_profile =", jobseeker_profile)

        applications = Application.objects.filter(jobseeker=jobseeker_profile) if jobseeker_profile else Application.objects.none()
        print("DEBUG: applications =", list(applications.values('id', 'status')))

        total_applications = applications.count()
        applications_in_progress = applications.filter(status__in=['New', 'Under Review', 'Shortlisted']).count()
        interviews_scheduled = applications.filter(status='Interviewed').count()
        offers_received = applications.filter(status='Offer').count()
        rejections = applications.filter(status='Rejected').count()

        metrics, created = ApplicationMetrics.objects.get_or_create(user=user)
        metrics.total_applications = total_applications
        metrics.applications_in_progress = applications_in_progress
        metrics.interviews_scheduled = interviews_scheduled
        metrics.offers_received = offers_received
        metrics.rejections = rejections
        metrics.save()

        serializer = ApplicationMetricsSerializer(metrics)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'])
    def application_timeline(self, request):
        user = request.user
        timeline = ApplicationTimeline.objects.filter(
            application__user=user
        ).order_by('-event_date')
        serializer = ApplicationTimelineSerializer(timeline, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'])
    def company_stats(self, request):
        companies = CompanyAnalytics.objects.all()
        serializer = CompanyAnalyticsSerializer(companies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['GET'])
    def trend_analysis(self, request):
        user = request.user
        from applications.models import Application
        jobseeker_profile = getattr(user, 'jobseeker_profile', None)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)

        timeline_data = ApplicationTimeline.objects.filter(
            application__jobseeker=jobseeker_profile,
            event_date__range=(start_date, end_date)
        ).values('event_date', 'event_type').annotate(
            count=Count('id')
        ).order_by('event_date')

        return Response(timeline_data)

    @action(detail=False, methods=['GET'])
    def success_rate(self, request):
        user = request.user
        total = ApplicationMetrics.objects.get(user=user)
        
        if total.total_applications > 0:
            success_rate = (total.offers_received / total.total_applications) * 100
        else:
            success_rate = 0
            
        return Response({
            'success_rate': success_rate,
            'total_applications': total.total_applications,
            'offers_received': total.offers_received
        })

class InterviewQuestionViewSet(viewsets.ModelViewSet):
    queryset = InterviewQuestion.objects.all().order_by('-created_at')
    serializer_class = InterviewQuestionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

def score_answer(answer_text):
    score = 0
    # Check length
    if len(answer_text) >= 100:
        score += 30
    # Check for keywords
    keywords = ['problem-solving', 'teamwork', 'communication', 'leadership', 'adaptability']
    for keyword in keywords:
        if keyword.lower() in answer_text.lower():
            score += 10
    return score

class PracticeAnswerViewSet(viewsets.ModelViewSet):
    serializer_class = PracticeAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        jobseeker_profile = getattr(self.request.user, 'jobseeker_profile', None)
        if jobseeker_profile is not None:
            queryset = PracticeAnswer.objects.filter(jobseeker=jobseeker_profile)
            question_id = self.request.query_params.get('question')
            if question_id:
                queryset = queryset.filter(question_id=question_id)
                # Order by created_at in descending order and limit to 2
                queryset = queryset.order_by('-created_at')[:2]
            return queryset
        return PracticeAnswer.objects.none()

    def perform_create(self, serializer):
        jobseeker_profile = getattr(self.request.user, 'jobseeker_profile', None)
        instance = serializer.save(jobseeker=jobseeker_profile)
        # Score the answer
        score = score_answer(instance.answer_text)
        instance.score = score
        instance.save()
