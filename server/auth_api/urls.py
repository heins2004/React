from django.urls import path

from .views import buy_painting, login, paintings, register

urlpatterns = [
    path("register", register),
    path("login", login),
    path("paintings", paintings),
    path("paintings/<int:painting_id>/buy", buy_painting),
]
