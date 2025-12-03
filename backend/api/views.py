from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Seminar
from .serializers import SeminarSerializer


@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({'status': 'Backend is running', 'storage': 'local'})


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def seminars(request, seminar_id=None):
    """Get all seminars, create, update, or delete a seminar (stored locally)"""
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


@api_view(['GET', 'POST'])
def participants(request):
    """Participants endpoint placeholder — not implemented with local storage yet."""
    return Response({'error': 'Participants endpoint not implemented for local storage'}, status=status.HTTP_501_NOT_IMPLEMENTED)


@api_view(['POST'])
def scan_attendance(request):
    """Attendance endpoint placeholder — not implemented for local storage yet."""
    return Response({'error': 'Attendance endpoint not implemented for local storage'}, status=status.HTTP_501_NOT_IMPLEMENTED)
