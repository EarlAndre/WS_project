from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from supabase_client import supabase

@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    supabase_status = "connected" if supabase else "not configured"
    return Response({'status': 'Backend is running', 'supabase': supabase_status})

@api_view(['GET', 'POST'])
def seminars(request):
    """Get all seminars or create a new seminar"""
    if not supabase:
        return Response({'error': 'Supabase not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    if request.method == 'GET':
        try:
            response = supabase.table('seminars').select('*').execute()
            return Response(response.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'POST':
        try:
            data = request.data
            response = supabase.table('seminars').insert(data).execute()
            return Response(response.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def participants(request):
    """Get all participants or create a new participant"""
    if not supabase:
        return Response({'error': 'Supabase not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    if request.method == 'GET':
        try:
            response = supabase.table('participants').select('*').execute()
            return Response(response.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'POST':
        try:
            data = request.data
            response = supabase.table('participants').insert(data).execute()
            return Response(response.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def scan_attendance(request):
    """Record attendance via QR code scan"""
    if not supabase:
        return Response({'error': 'Supabase not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    try:
        data = request.data
        participant_id = data.get('participant_id')
        seminar_id = data.get('seminar_id')
        
        response = supabase.table('attendance').insert({
            'participant_id': participant_id,
            'seminar_id': seminar_id
        }).execute()
        
        return Response(response.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
