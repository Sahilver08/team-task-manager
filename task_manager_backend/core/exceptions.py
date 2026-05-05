from rest_framework.exceptions import (
    ValidationError, AuthenticationFailed, NotAuthenticated, PermissionDenied
)
from rest_framework.views import exception_handler
from rest_framework import status as drf_status


class ConflictError(Exception):
    """Raised when optimistic locking detects a version mismatch (HTTP 409)."""
    def __init__(self, message="Resource was modified by someone else. Please refresh."):
        self.message = message
        super().__init__(message)


def _extract_message(detail):
    """Pull a plain string out of DRF's detail (could be str, list, or dict)."""
    if isinstance(detail, list):
        return str(detail[0])
    if isinstance(detail, dict):
        first_key = next(iter(detail))
        return f"{first_key}: {detail[first_key][0]}"
    return str(detail)


def custom_exception_handler(exc, context):
    """
    Wraps every DRF exception in our standard envelope:
      { status, code, message, errors? }
    Registered in settings.py → REST_FRAMEWORK['EXCEPTION_HANDLER']
    """

    # Handle our custom 409 conflict before DRF sees it
    if isinstance(exc, ConflictError):
        from rest_framework.response import Response
        return Response({
            "status":  "error",
            "code":    "CONFLICT",
            "message": exc.message,
        }, status=409)

    # Let DRF do its default processing first
    response = exception_handler(exc, context)
    if response is None:
        # Unhandled exception → Django will return a 500 page
        return None

    # Now reformat the response data into our envelope
    if isinstance(exc, ValidationError):
        response.data = {
            "status":  "error",
            "code":    "VALIDATION_ERROR",
            "message": "Please fix the errors below.",
            "errors":  response.data,          # field → [messages]
        }
    elif isinstance(exc, NotAuthenticated):
        response.data = {
            "status":  "error",
            "code":    "UNAUTHORIZED",
            "message": "Authentication credentials were not provided.",
        }
    elif isinstance(exc, AuthenticationFailed):
        response.data = {
            "status":  "error",
            "code":    "UNAUTHORIZED",
            "message": _extract_message(exc.detail),
        }
    elif isinstance(exc, PermissionDenied):
        response.data = {
            "status":  "error",
            "code":    "FORBIDDEN",
            "message": _extract_message(exc.detail),
        }
    elif response.status_code == 404:
        response.data = {
            "status":  "error",
            "code":    "NOT_FOUND",
            "message": "The requested resource was not found.",
        }
    else:
        response.data = {
            "status":  "error",
            "code":    "SERVER_ERROR",
            "message": "Something went wrong. Please try again later.",
        }

    return response
