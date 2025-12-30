from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.throttling import ScopedRateThrottle
from .models import OTPCode
from django.db import transaction
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.db.models import Q
from rest_framework.exceptions import AuthenticationFailed

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email

        return token

    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except AuthenticationFailed as e:
            username = attrs.get('username')
            password = attrs.get('password')
            
            if username and password:
                # Check if user exists and is inactive using the same logic as the backend
                user = User.objects.filter(Q(username=username) | Q(email=username)).first()
                
                if user and user.check_password(password):
                    if not user.is_active:
                        raise AuthenticationFailed('Account is not active. Please verify your email.')
            raise e

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class SignUpView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_attempts'

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        username = request.data.get('username')
        
        # Simple validation
        if not email or not password or not username:
            return Response({'error': 'Username, Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        existing_username = User.objects.filter(username=username).first()
        if existing_username:
             if not existing_username.is_active:
                  return Response({'error': 'Username taken by an unverified account. Please verify your email or use a different username.'}, status=status.HTTP_400_BAD_REQUEST)
             return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)

        existing_email = User.objects.filter(email=email).first()
        if existing_email:
             if not existing_email.is_active:
                  return Response({'error': 'Email registered but not verified. Please verify your email.'}, status=status.HTTP_400_BAD_REQUEST)
             return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Create user
                user = User.objects.create_user(username=username, email=email, password=password)
                user.is_active = False # Inactive until verified
                user.save()

                # Generate OTP
                code = OTPCode.generate_code()
                OTPCode.objects.create(user=user, code=code)

                # Prepare Email
                subject = 'Verify your account - Cerno'
                html_message = render_to_string('emails/otp_email.html', {'otp_code': code})
                plain_message = strip_tags(html_message)

                # Send Email
                send_mail(
                    subject,
                    plain_message,
                    settings.EMAIL_HOST_USER,
                    [email],
                    fail_silently=False,
                    html_message=html_message
                )
        except Exception as e:
            # Transaction rolls back automatically on exception
            print(f"Signup failed: {e}")
            return Response({'error': 'Failed to send verification email. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Verification email sent.'}, status=status.HTTP_201_CREATED)

class VerifyOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_attempts'

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            otp_record = OTPCode.objects.filter(user=user, code=code).latest('created_at')
        except OTPCode.DoesNotExist:
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        if not otp_record.is_valid():
             return Response({'error': 'Code expired'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify User
        user.is_active = True
        user.save()
        
        # Generate Tokens
        refresh = RefreshToken.for_user(user)
        
        # Add custom claims
        refresh['username'] = user.username
        refresh['email'] = user.email

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)

class ResendOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_attempts'

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        code = OTPCode.generate_code()
        OTPCode.objects.create(user=user, code=code)
        
        try:
            # Prepare Email
            subject = 'Verify your account - Cerno'
            html_message = render_to_string('emails/otp_email.html', {'otp_code': code})
            plain_message = strip_tags(html_message)

            send_mail(
                subject,
                plain_message,
                settings.EMAIL_HOST_USER, # From settings
                [email],
                fail_silently=False,
                html_message=html_message
            )
        except Exception as e:
            return Response({'error': 'Failed to send verification email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Verification email resent.'}, status=status.HTTP_200_OK)

class DeleteAccountView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        try:
            user.delete()
            return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            print(f"Delete failed: {e}")
            return Response({'error': 'Failed to delete account.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.http import HttpResponse
from django.template import Template, Context
from django.conf import settings
from django.template.loader import get_template

def debug_email_view(request):
    results = []
    
    # Test 1: String Template
    try:
        t = Template('Hello {{ name }}')
        c = Context({'name': 'World'})
        rendered = t.render(c)
        results.append(f"Test 1 (String Template): {rendered} (Expected: Hello World)")
    except Exception as e:
        results.append(f"Test 1 Failed: {e}")

    # Test 2: File Template Path
    try:
        tmpl = get_template('emails/otp_email.html')
        results.append(f"Test 2 (File Found): {tmpl.origin.name}")
    except Exception as e:
        results.append(f"Test 2 Failed (File Not Found): {e}")

    # Test 3: Actual File Render
    try:
        html_message = render_to_string('emails/otp_email.html', {'otp_code': '123456'})
        snippet = html_message[html_message.find('123456')-10 : html_message.find('123456')+20] if '123456' in html_message else "Code NOT found in output"
        results.append(f"Test 3 (File Render): {snippet}")
        # Debug: Dump the part where the code should be
        if '{{ otp_code }}' in html_message:
             results.append("CRITICAL: {{ otp_code }} literal found in output!")
    except Exception as e:
        results.append(f"Test 3 Failed: {e}")

    results.append(f"BASE_DIR: {settings.BASE_DIR}")
    results.append(f"TEMPLATE DIRS: {settings.TEMPLATES[0]['DIRS']}")

    return HttpResponse('<br>'.join(results))
