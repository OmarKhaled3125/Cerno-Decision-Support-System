from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import SignUpView, VerifyOTPView, ResendOTPView, MyTokenObtainPairView, DeleteAccountView, debug_email_view

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('login/', MyTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('delete/', DeleteAccountView.as_view(), name='delete_account'),
    path('debug-email/', debug_email_view, name='debug_email'),
]
