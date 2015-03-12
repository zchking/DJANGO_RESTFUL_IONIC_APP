from django.conf import settings
from django.conf.urls import patterns, include, url
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from . import views

urlpatterns = patterns('',
    url(r'^users/(?P<pk>[0-9]+)/$$', views.User.as_view()),  # current user's detail

    url(r'^me/$',       views.MyAccount.as_view()),  # current user's detail
    url(r'^register/$', views.RegistrationView.as_view(), name='register'),
    url(r'^password/$', views.SetPasswordView.as_view(), name='set_password'),

    #url(r'^logout$',    views.LogoutView.as_view(), name='logout'),
    #url(r'^activate$',  views.ActivationView.as_view(), name='activate'),
    #url(r'^password$', views.SetPasswordView.as_view(), name='set_password'),
    #url(r'^password/reset$', views.PasswordResetView.as_view(), name='password_reset'),
    #url(r'^password/reset/confirm$', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
)
