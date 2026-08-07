from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .throttles import AdminLoginThrottle


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Same as the default JWT login, but refuses to issue a token to
    anyone who isn't staff — there are no customer accounts, so any
    non-admin credentials (even valid ones) are rejected here."""

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_staff:
            raise self.fail('no_active_account')
        data['is_staff'] = self.user.is_staff
        data['username'] = self.user.username
        return data


class AdminLoginView(TokenObtainPairView):
    """POST /api/auth/login/  { "username": "...", "password": "..." }
    -> { "access": "...", "refresh": "...", "username": "...", "is_staff": true }

    Rate-limited (Phase 6.1) via AdminLoginThrottle — the only endpoint
    in the project with a throttle attached; see users/throttles.py.
    """
    serializer_class = AdminTokenObtainPairSerializer
    throttle_classes = [AdminLoginThrottle]


class MeView(APIView):
    """GET /api/auth/me/ — lets the admin dashboard confirm the current
    token is valid and who it belongs to, e.g. on page load/refresh."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'is_staff': request.user.is_staff,
        })
