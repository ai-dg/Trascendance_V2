import json
import re
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout, get_user_model
import logging, redis, requests, secrets, urllib.parse
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.urls import reverse
from server.settings import LANGUAGES, OAUTH42_AUTHORIZE_URL, OAUTH42_TOKEN_URL, OAUTH42_UID, OAUTH42_SECRET, OAUTH42_USER_INFO_URL, LENGTH_OF_STATE, PORT_NGINX_HTTPS
from django.utils.translation import gettext as _
r = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
logger = logging.getLogger(__name__)

def login_user(request):
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "").strip()
        
        if not username or not password or (len(username) > 40) or not re.match(r'^[a-zA-Z0-9_]+$', username):
            messages.info(request, "Invalid username or password !")
            return render(request, "accounts/login.html")
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            
            # Vérifier si l'utilisateur est déjà en ligne
            connected = r.sismember('online_users', user.username)
            if connected:
                messages.info(request, "User already authenticated ! Please close previous connection")
                return render(request, "accounts/login.html")
            
            # Nettoyer toutes les anciennes sessions au cas où
            r.delete(f"user:{user.username}:pong_lock")
            r.delete(f"user:{user.username}:reco_lock")
            
            # Marquer comme en ligne
            r.sadd('online_users', user.username)
            return redirect("pong:pong_index")
        else:
            messages.info(request, "invalid username or password !")
            return render(request, "accounts/login.html")
    return render(request, "accounts/login.html")

def oauth_login_user(request):
    state_len = 42
    if LENGTH_OF_STATE.isnumeric():
        tmp_len = int(LENGTH_OF_STATE)
        if tmp_len > 0 and tmp_len <= 42:
            state_len = tmp_len
    state = secrets.token_urlsafe(state_len)
    request.session["oauth_state"] = state
    parsed_url = urllib.parse.urlparse(request.build_absolute_uri())
    if parsed_url.port is None:
        redirect_uri = f"{parsed_url.scheme}s://{parsed_url.hostname}:{PORT_NGINX_HTTPS}{reverse('accounts:oauth_callback')}"
    else:
        redirect_uri = f"{parsed_url.scheme}s://{parsed_url.netloc}{reverse('accounts:oauth_callback')}"

    params = urllib.parse.urlencode({
        "client_id" : OAUTH42_UID,
        "redirect_uri" : redirect_uri,
        "scope" : "public",
        "state" : state,
        "response_type" : "code"
    })
    return redirect(f"{OAUTH42_AUTHORIZE_URL}?{params}")

def oauth_callback(request):
    returned_code = request.GET.get("code")
    returned_state = request.GET.get("state")
    stored_state = request.session.get("oauth_state")
    
    del request.session["oauth_state"]

    if not stored_state or returned_state != stored_state:
        return HttpResponseBadRequest("Invalid state parameter.")

    parsed_url = urllib.parse.urlparse(request.build_absolute_uri())
    if parsed_url.port is None:
        redirect_uri = f"{parsed_url.scheme}s://{parsed_url.hostname}:{PORT_NGINX_HTTPS}{reverse('accounts:oauth_callback')}"
    else:
        redirect_uri = f"{parsed_url.scheme}s://{parsed_url.netloc}{reverse('accounts:oauth_callback')}"
    token_response = requests.post(OAUTH42_TOKEN_URL, data= {
        "grant_type" : "authorization_code",
        "client_id" : OAUTH42_UID,
        "client_secret" : OAUTH42_SECRET,
        "code" : returned_code,
        "redirect_uri" : redirect_uri,
        "state" : returned_state
    })

    token_data = token_response.json()
    access_token = token_data.get("access_token")
    user_info = requests.get(OAUTH42_USER_INFO_URL, headers={
        "Authorization": f"Bearer {access_token}"
    }).json()

    username = user_info["login"]
    user, created = get_user_model().objects.get_or_create(username=username, defaults={"oauth" : True})
    if not created:
        if not user.oauth:
            messages.error(request, "Username exists but not with [Log in with 42]")
            return redirect("accounts:login")
    login(request, user)
    return redirect("pong:pong")


def is_valid_password(password):
    lower = re.search(r'[a-z]', password)
    upper = re.search(r'[A-Z]', password)
    digits = re.search(r'[0-9]', password)
    length = len(password) > 8 and len (password) < 40
    special = re.search(r'[!@#$%^&*()_\-+=\[\]{}|\\:;\"\'<>,.?/]', password)
    return bool(lower and upper and digits and special and length)


def signin_user(request):
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "").strip()
        if not username or not password:
            messages.error(request, "Username and password are required.")
            return render(request, "accounts/login.html")

        if (len(username) > 40):
            messages.error(request, "Username must be at most 40 characters.")
            return render(request, "accounts/login.html")

        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            messages.error(request, "Username can only contain letters, numbers, and underscores.")
            return render(request, "accounts/login.html")

        User = get_user_model()
        if User.objects.filter(username=username).exists():
            messages.info(request, "User already exists. Please login.")
            return redirect("accounts:login")
        
        try:
            user = get_user_model()(username=username)
            user.set_password(password)
            user.save()
        except Exception as e:
            messages.error(request, f"An error occrured: {str(e)}")

    return render(request, "accounts/login.html")


def logout_user(request):
    if request.user.is_authenticated:
        username = request.user.username
        
        # Nettoyage complet lors du logout explicite
        r.srem('online_users', username)
        r.delete(f"user:{username}:pong_lock")
        r.delete(f"user:{username}:reco_lock")
        
        logout(request)
        request.session.flush()
    
    return redirect("accounts:login")

    
def update_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User not authenticated'}, status=401)

    if request.user.is_authenticated and request.method == "POST":
        if request.FILES.get("avatar"):
            avatar = request.FILES.get('avatar')
            if avatar:
                user_data = get_user_model().objects.get(username=request.user)
                user_data.avatar = avatar
                user_data.save()
            else:
                logger.info("no avatarfound")
        pseudo = request.POST.get("pseudo", "").strip()
        if pseudo:
            if (len(pseudo) > 40):
                return JsonResponse({'error': 'Pseudo must be at most 40 characters.'}, status=400)

            if not re.match(r'^[a-zA-Z0-9_]+$', pseudo):
                messages.error(request, "Pseudo can only contain letters, numbers, and underscores.")
                return JsonResponse({'error': 'Pseudo can only contain letters, numbers, and underscores.'}, status=400)
            
            try:
                user_model = get_user_model().objects.get(username=request.user)
            except get_user_model().DoesNotExist:
                return JsonResponse({'error': 'User does not exist'}, status=404)
            
            if get_user_model().objects.filter(tournament_pseudo=pseudo).exists():
                return JsonResponse({'error': 'Pseudo already taken by another user'}, status=404)
            try:
                user_model.tournament_pseudo = pseudo
                user_model.save()
            except Exception as e:
                return JsonResponse({'error': f"An error occrured: {str(e)}"}, status=500)
    return JsonResponse({"messages": "ok"})


def getAvatar(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    if request.method == "GET":
        username = request.GET.get("username")
        try:
            user = get_user_model().objects.get(username=username)
            avatar = user.avatar
            if avatar: 
                with avatar.open('rb') as img_file:
                    return HttpResponse(img_file.read(), content_type="image/png")
            else:
                return JsonResponse({"message": "Avatar not found"}, status=404)
        except get_user_model().DoesNotExist:
            return JsonResponse({"message": "User Doen't exist"}, status=404)
        except get_user_model().DoesNotExist:
            return JsonResponse({"message": "Extra Data Doen't exist for this user"}, status=404)

def user_keymap(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    if request.method == 'GET':
        user_requested = request.GET.get('user')
        if not user_requested or len(user_requested) == 0:
            return JsonResponse({'error': 'User not provided'}, status=400)        
        try:
            user = get_user_model().objects.get(username=user_requested)
        except get_user_model().DoesNotExist:
            return JsonResponse({'error': 'User does not exist'}, status=404)

        return JsonResponse(user.keys_map, safe=False)
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        
        username = request.user.username
        try:
            user = get_user_model().objects.get(username=username)
            data = json.loads(request.body)
            user.keys_map = data
            user.save()
            return JsonResponse({"messages": "ok"})
        except get_user_model().DoesNotExist:
            return JsonResponse({'error': 'User does not exist'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        



def language(request):
    if not request.user.is_authenticated:
       return JsonResponse({'status':'error', 'error': 'User not authenticated'}, status=401)
    username = request.user.username
    try:
        user = get_user_model().objects.get(username=username)
    except get_user_model().DoesNotExist:
        return JsonResponse({'status':'error', 'error': 'invalid request'}, status=400)

    if request.method == 'GET':
            return JsonResponse({'status':'success', 'language':user.language})

    if request.method == 'PUT':
        data = json.loads(request.body)
        language = data.get("language")
        if language in dict(LANGUAGES):
            user.language = language
            request.session['django_language'] = language
            user.save()
            return JsonResponse({'status': 'success'}, status=201)
        return JsonResponse({'status':'error', 'error': 'invalid request'}, status=400)
    return JsonResponse({'status':'error', 'error': 'invalid method'}, status=405)
