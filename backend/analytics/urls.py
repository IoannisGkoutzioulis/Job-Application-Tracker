from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsViewSet, InterviewQuestionViewSet, PracticeAnswerViewSet

router = DefaultRouter()
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'interview-questions', InterviewQuestionViewSet, basename='interview-questions')
router.register(r'practice-answers', PracticeAnswerViewSet, basename='practice-answers')

urlpatterns = [
    path('', include(router.urls)),
] 