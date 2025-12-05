from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import exception_catcher
from .models import Seminar, Attendance, JoinedParticipant, Certificate, Evaluation
from .serializers import SeminarSerializer, AttendanceSerializer, JoinedParticipantSerializer, CertificateSerializer, EvaluationSerializer


@api_view(['GET'])
@exception_catcher
def health_check(request):
    """Health check endpoint"""
    return Response({'status': 'Backend is running', 'storage': 'SQLite local'})


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@exception_catcher
def seminars(request, seminar_id=None):
    """Get all seminars, create, update, or delete a seminar (stored in SQLite)"""
    # GET -> list all
    if request.method == 'GET':
        qs = Seminar.objects.all().order_by('date')
        serializer = SeminarSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create
    if request.method == 'POST':
        serializer = SeminarSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # PUT -> update (requires seminar_id)
    if request.method == 'PUT' and seminar_id:
        try:
            seminar = Seminar.objects.get(pk=seminar_id)
        except Seminar.DoesNotExist:
            return Response({'error': 'Seminar not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SeminarSerializer(seminar, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # DELETE -> remove (requires seminar_id)
    if request.method == 'DELETE' and seminar_id:
        try:
            seminar = Seminar.objects.get(pk=seminar_id)
            seminar.delete()
            return Response({'deleted': True}, status=status.HTTP_204_NO_CONTENT)
        except Seminar.DoesNotExist:
            return Response({'error': 'Seminar not found'}, status=status.HTTP_404_NOT_FOUND)

    # If DELETE/PUT were called without a seminar_id, return a clear error
    if request.method in ['DELETE', 'PUT'] and not seminar_id:
        return Response({'error': 'seminar_id is required for this operation'}, status=status.HTTP_400_BAD_REQUEST)

    # Fallback for any other unhandled case
    return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@exception_catcher
def attendance(request, seminar_id=None):
    """Get attendance records, create attendance record for a seminar"""
    # GET -> list attendance for a seminar
    if request.method == 'GET':
        if seminar_id:
            qs = Attendance.objects.filter(seminar_id=seminar_id).order_by('created_at')
        else:
            qs = Attendance.objects.all().order_by('created_at')
        serializer = AttendanceSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create attendance record
    if request.method == 'POST':
        # If an attendance row for this seminar+participant already exists, update it (time_in/time_out)
        seminar_id = request.data.get('seminar')
        participant_email = request.data.get('participant_email')
        if seminar_id and participant_email:
            try:
                existing = Attendance.objects.filter(seminar_id=seminar_id, participant_email=participant_email).first()
            except Exception:
                existing = None
            if existing:
                serializer = AttendanceSerializer(existing, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        # No existing row — create a new attendance record
        serializer = AttendanceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@exception_catcher
def joined_participants(request, seminar_id=None):
    """Get joined participants, create joined participant record"""
    # GET -> list joined participants for a seminar
    if request.method == 'GET':
        if seminar_id:
            qs = JoinedParticipant.objects.filter(seminar_id=seminar_id).order_by('joined_at')
        else:
            qs = JoinedParticipant.objects.all().order_by('joined_at')
        serializer = JoinedParticipantSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create joined participant record
    if request.method == 'POST':
        serializer = JoinedParticipantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@exception_catcher
def evaluations(request, seminar_id=None):
    """Get evaluations, create evaluation record"""
    # GET -> list evaluations for a seminar
    if request.method == 'GET':
        if seminar_id:
            qs = Evaluation.objects.filter(seminar_id=seminar_id).order_by('created_at')
        else:
            qs = Evaluation.objects.all().order_by('created_at')
        serializer = EvaluationSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create evaluation record
    if request.method == 'POST':
        serializer = EvaluationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@exception_catcher
def certificates(request, seminar_id=None):
    """Get certificates, create certificate record"""
    # GET -> list certificates for a seminar
    if request.method == 'GET':
        if seminar_id:
            qs = Certificate.objects.filter(seminar_id=seminar_id).order_by('issued_at')
        else:
            qs = Certificate.objects.all().order_by('issued_at')
        serializer = CertificateSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create certificate record
    if request.method == 'POST':
        serializer = CertificateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@exception_catcher
def google_form_submit(request):
    """Webhook endpoint for Google Forms submission via Apps Script"""
    from django.conf import settings
    
    # Validate the secret token from environment
    expected_token = settings.GOOGLE_FORM_SECRET
    provided_token = request.data.get('secret_token')
    
    if not expected_token or provided_token != expected_token:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Extract form data
    seminar_id = request.data.get('seminar_id')
    participant_email = request.data.get('email')
    participant_name = request.data.get('name')
    year_section = request.data.get('year_section')
    
    if not seminar_id or not participant_email:
        return Response({'error': 'Missing required fields: seminar_id, email'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        seminar = Seminar.objects.get(pk=seminar_id)
    except Seminar.DoesNotExist:
        return Response({'error': 'Seminar not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Record attendance (time IN)
    from django.utils import timezone
    now = timezone.now()
    
    attendance_data = {
        'seminar': seminar_id,
        'participant_email': participant_email,
        'time_in': now
    }
    
    attendance_serializer = AttendanceSerializer(data=attendance_data)
    if attendance_serializer.is_valid():
        attendance_serializer.save()
    else:
        # Try to update existing record
        try:
            attendance = Attendance.objects.get(seminar_id=seminar_id, participant_email=participant_email)
            attendance.time_in = now
            attendance.save()
        except Attendance.DoesNotExist:
            return Response({'error': 'Failed to record attendance', 'details': attendance_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    # Also save as joined participant with name and year/section info
    joined_data = {
        'seminar': seminar_id,
        'participant_email': participant_email,
        'participant_name': participant_name,
        'metadata': {'year_section': year_section}
    }
    
    joined_serializer = JoinedParticipantSerializer(data=joined_data)
    if joined_serializer.is_valid():
        joined_serializer.save()
    else:
        # If already exists, just update it
        try:
            joined = JoinedParticipant.objects.get(seminar_id=seminar_id, participant_email=participant_email)
            joined.participant_name = participant_name
            joined.metadata = {'year_section': year_section}
            joined.present = True
            joined.check_in = now
            joined.save()
        except JoinedParticipant.DoesNotExist:
            pass  # Joined participant creation failed but attendance was recorded, that's okay
    
    return Response({
        'status': 'success',
        'message': 'Attendance recorded',
        'email': participant_email,
        'name': participant_name,
        'seminar_id': seminar_id
    }, status=status.HTTP_201_CREATED)
