from functools import wraps
from rest_framework.response import Response
from rest_framework import status
import traceback
import logging
from django.conf import settings


def exception_catcher(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        try:
            return view_func(request, *args, **kwargs)
        except Exception as e:
            logging.exception("Unhandled exception in API view %s", view_func.__name__)
            # In DEBUG show traceback to aid development. In production hide details.
            if getattr(settings, 'DEBUG', False):
                tb = traceback.format_exc()
                payload = {'error': str(e), 'traceback': tb}
            else:
                payload = {'error': 'Internal Server Error'}
            return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return _wrapped
