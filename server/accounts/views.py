from rest_framework import generics
from rest_framework import mixins
from rest_framework import permissions
from accounts.models import User
from accounts.serializers import UserSerializer

# We simple use djoser's views for convenience.
# Extends the views as needed.
from djoser.views import (RegistrationView,
                          LoginView,
                          LogoutView,
                          SetPasswordView,
                          PasswordResetView,
                          UserView)


class User(generics.RetrieveAPIView):
    '''
    Read-only user info

    For customers to get other user's info.
    '''
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = User.objects.all()


class MyAccount(generics.RetrieveUpdateAPIView):
    '''
    My account info

    Refer to:
    https://github.com/sunscrapers/djoser/blob/master/djoser/views.py#UserView
    '''
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user
