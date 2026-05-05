from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


# ── Token serializer ─────────────────────────────────────────────────────────
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends SimpleJWT's default serializer to:
      1. Embed email + full_name directly in the JWT payload
         → frontend can decode the token and show the user's name
         without making a separate /me/ API call.
      2. Include user info in the login response body.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email']     = user.email       # custom claims in JWT payload
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Append user object to the response body alongside the tokens
        data['user'] = {
            'id':        self.user.id,
            'email':     self.user.email,
            'full_name': self.user.full_name,
        }
        return data


# ── Register serializer ───────────────────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model  = User
        fields = ['email', 'full_name', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True},  # never returned in response
        }

    def validate_password(self, value):
        # Runs Django's built-in password validators (length, common password, etc.)
        validate_password(value)
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        return User.objects.create_user(**validated_data)


# ── Profile serializer ────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    """Read-only. Used by the /me/ endpoint."""
    class Meta:
        model  = User
        fields = ['id', 'email', 'full_name', 'date_joined']


class UserBriefSerializer(serializers.ModelSerializer):
    """Minimal user representation — embedded inside Task/Comment responses."""
    class Meta:
        model  = User
        fields = ['id', 'full_name', 'email']
