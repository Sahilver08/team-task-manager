from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, UserSerializer


class RegisterView(APIView):
    """POST /api/auth/register/ — Public"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)   # DRF auto-returns 400 on failure
        user = serializer.save()

        # Generate tokens immediately after registration so user is logged in
        refresh = RefreshToken.for_user(user)
        return Response({
            "status":  "success",
            "message": "Account created successfully.",
            "data": {
                "access":  str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id":        user.id,
                    "email":     user.email,
                    "full_name": user.full_name,
                },
            },
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/ — Public
    Delegates to SimpleJWT's TokenObtainPairView, which validates
    credentials and returns our custom token payload.
    We just wrap the response in our standard envelope.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            response.data = {
                "status":  "success",
                "message": "Login successful.",
                "data":    response.data,
            }
        return response


class LogoutView(APIView):
    """POST /api/auth/logout/ — Authenticated"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()   # adds to simplejwt_blacklist table
            return Response({
                "status":  "success",
                "message": "Logged out successfully.",
            })
        except TokenError:
            return Response({
                "status":  "error",
                "code":    "VALIDATION_ERROR",
                "message": "Invalid or expired refresh token.",
                "errors":  {"refresh": ["Token is invalid or expired."]},
            }, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """GET /api/auth/me/ — Authenticated"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "status":  "success",
            "message": "User profile retrieved.",
            "data":    UserSerializer(request.user).data,
        })
