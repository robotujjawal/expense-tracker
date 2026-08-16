from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import IntegrityError
from django.utils.translation import gettext as _
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

User = get_user_model()


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = (request.data.get('email') or request.data.get('username') or '').strip()
        password = request.data.get('password') or ''

        if not identifier or not password:
            return Response({'detail': _('Email/username and password are required')}, status=400)

        user = authenticate(request, username=identifier, password=password)
        if user is None:
            try:
                user_obj = User.objects.get(email__iexact=identifier)
            except User.DoesNotExist:
                user_obj = None

            if user_obj is not None:
                user = authenticate(request, username=user_obj.username, password=password)

        if user is None:
            return Response({'detail': _('Invalid credentials')}, status=400)

        login(request, user)
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
        })


class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        full_name = (request.data.get('full_name') or '').strip()
        email = (request.data.get('email') or '').strip()
        password = request.data.get('password') or ''

        if not email or not password:
            return Response({'detail': _('Email and password are required')}, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return Response({'detail': _('Email already registered')}, status=400)

        username = email
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=full_name,
            )
        except IntegrityError:
            return Response({'detail': _('Email already registered')}, status=400)

        login(request, user)
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
        })


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'detail': _('logged out')})


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
        })