from django.shortcuts import render
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.http import JsonResponse
import json
from asgiref.sync import sync_to_async
from server.asyncredis import redis
import logging
from .tools import get_general_room_id, extract_messages
from .models import Room
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.utils.translation import gettext as _


logger = logging.getLogger(__name__)

async def online_users(request):
    auth = await sync_to_async(is_auth)(request)
    if not auth:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
    users_online = list(await redis.smembers("online_users"))
    return JsonResponse({"users": users_online})


async def get_private_channel(request):
    auth = await sync_to_async(is_auth)(request)
    if not auth:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
    parsed = json.loads(request.body.decode("utf-8"))
    inviteds = parsed["invited"]

    try:
        user1 = await get_user_model().objects.aget(username=inviteds[0])
        user2 = await get_user_model().objects.aget(username=inviteds[1])
    except ObjectDoesNotExist:
        return JsonResponse({"error": "One or both users not found."}, status=404)    
    room = await sync_to_async(Room.objects.filter(invited=user1).filter(invited=user2).distinct().first)()
    # logger.info(room)
    
    if not room:
        room = await Room.objects.acreate(custom_name=f"{inviteds[0]}-{inviteds[1]}")
        await sync_to_async (room.invited.add)(user1, user2)
        room.asave()
    msg = await extract_messages(room)
    logger.info(f"msg : {msg}")
    return JsonResponse({"room_id": room.room_id, "users": [inviteds[0], inviteds[1]], "messages": msg})


def is_auth(request):
     return request.user.is_authenticated
    
async def get_general_room(request):
    auth = await sync_to_async(is_auth)(request)
    if not auth:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
    general_room_id = await get_general_room_id()
    return JsonResponse({"room_id": general_room_id})

async def create_channel(request):
    auth = await sync_to_async(is_auth)(request)
    if not auth:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
    parsed = json.loads(request.body.decode("utf-8"))

    request_type = parsed.get('type')
    if request_type == 'general':
        return await get_general_room(request)
    elif request_type == 'private':
        return await get_private_channel(request)

    return JsonResponse({"error": "invalid room type"}, status=400)


async def get_messages(request):
    auth = await sync_to_async(is_auth)(request)
    if not auth:
            return JsonResponse({'error': 'User not authenticated'}, status=401)


    if request.method != "POST":
        return JsonResponse({
            "status": "error", 
            "message": "invalid method for route"
        }, status=405)
    
    if not request.body:
        return JsonResponse({
            "status": "error", 
            "message": "invalid request"
        }, status=400)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({
            "status": "error", 
            "message": "invalid JSON format"
        }, status=400)
    
    if not data or "room_id" not in data:
        return JsonResponse({
            "status": "error", 
            "message": "invalid request"
        }, status=400)
    
    rid = data["room_id"]
    

    try:
        position = data.get("position", 0)  # Valeur par défaut si non fournie
        if position is not None:
            position = int(position)  # Conversion explicite
    except (ValueError, TypeError):
        logger.error("invalid value for position")
        return JsonResponse({
            "status": "error", 
            "message": "invalid position value"
        }, status=400)
    
    # Fonction helper pour récupérer la room de manière async
    @sync_to_async
    def get_room_by_id(room_id):
        return Room.objects.filter(room_id=room_id).first()
    
    # Récupération de la room
    try:
        room = await get_room_by_id(rid)
    except Exception as e:
        logger.error(f"Database error: {e}")
        return JsonResponse({
            "status": "error", 
            "message": "database error"
        }, status=500)
    
    if not room:
        return JsonResponse({
            "status": "error", 
            "message": "invalid room id"
        }, status=400)
    
    # Extraction des messages
    try:
        messages = await extract_messages(room)
    except Exception as e:
        logger.error(f"Error extracting messages: {e}")
        return JsonResponse({
            "status": "error", 
            "message": "error retrieving messages"
        }, status=500)
    
    return JsonResponse({
        "status": "ok",
        "type": "archives",
        "room_id": rid,
        "message": messages
    }, status=200)

def chat_home(request):
    if not request.user.is_authenticated:
        return redirect("accounts:login")
    return redirect("pong:pong")