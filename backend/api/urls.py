from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('seminars/', views.seminars, name='seminars'),
    path('seminars/<int:seminar_id>/', views.seminars, name='seminar-detail'),
    path('attendance/', views.attendance, name='attendance'),
    path('attendance/<int:seminar_id>/', views.attendance, name='attendance-detail'),
    path('joined-participants/', views.joined_participants, name='joined-participants'),
    path('joined-participants/<int:seminar_id>/', views.joined_participants, name='joined-participants-detail'),
    path('evaluations/', views.evaluations, name='evaluations'),
    path('evaluations/<int:seminar_id>/', views.evaluations, name='evaluations-detail'),
    path('certificates/', views.certificates, name='certificates'),
    path('certificates/<int:seminar_id>/', views.certificates, name='certificates-detail'),
    path('google-form-submit/', views.google_form_submit, name='google-form-submit'),
]
