from django.urls import path
from . import views


app_name = "livechat"

urlpatterns = [
    path("", views.chat_home, name="chat_home"),
    path("online-users/", views.online_users, name="online-users"),
    path("create_channel/", views.create_channel, name="create_channel"),
    path("getmessages", views.get_messages, name="get_messages")
]