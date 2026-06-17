import hashlib
import json
from decimal import Decimal, InvalidOperation

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import AppUser, Painting


def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def parse_request_body(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


def serialize_painting(painting, request):
    return {
        "id": painting.id,
        "title": painting.title,
        "price": f"{painting.price:.2f}",
        "seller": painting.seller.username,
        "seller_id": painting.seller_id,
        "isOrdered": painting.is_ordered,
        "imageUrl": request.build_absolute_uri(painting.image.url),
    }


@csrf_exempt
def register(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed."}, status=405)

    payload = parse_request_body(request)
    if payload is None:
        return JsonResponse({"message": "Invalid JSON payload."}, status=400)

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone_number = (payload.get("phoneNumber") or "").strip()
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not name or not email or not phone_number or not username or not password:
        return JsonResponse(
            {"message": "Name, email, phone number, username, and password are required."},
            status=400,
        )

    if AppUser.objects.filter(username=username).exists():
        return JsonResponse({"message": "Username already exists."}, status=409)

    if AppUser.objects.filter(email=email).exists():
        return JsonResponse({"message": "Email already exists."}, status=409)

    AppUser.objects.create(
        name=name,
        email=email,
        phone_number=phone_number,
        username=username,
        password_hash=hash_password(password),
    )

    return JsonResponse(
        {"message": "Registration successful. Please log in."},
        status=201,
    )


@csrf_exempt
def login(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed."}, status=405)

    payload = parse_request_body(request)
    if payload is None:
        return JsonResponse({"message": "Invalid JSON payload."}, status=400)

    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return JsonResponse(
            {"message": "Username and password are required."},
            status=400,
        )

    try:
        user = AppUser.objects.get(username=username)
    except AppUser.DoesNotExist:
        return JsonResponse({"message": "Invalid username or password."}, status=401)

    if user.password_hash != hash_password(password):
        return JsonResponse({"message": "Invalid username or password."}, status=401)

    return JsonResponse(
        {
            "message": "Login successful.",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phoneNumber": user.phone_number,
                "username": user.username,
            },
        }
    )


@csrf_exempt
def paintings(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    if request.method == "GET":
        items = Painting.objects.select_related("seller").all()
        return JsonResponse({"paintings": [serialize_painting(item, request) for item in items]})

    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed."}, status=405)

    title = (request.POST.get("title") or "").strip()
    price_raw = (request.POST.get("price") or "").strip()
    user_id = request.POST.get("userId")
    image = request.FILES.get("image")

    if not title or not price_raw or not user_id or not image:
        return JsonResponse(
            {"message": "Title, price, image, and user are required."},
            status=400,
        )

    try:
        price = Decimal(price_raw)
    except InvalidOperation:
        return JsonResponse({"message": "Price must be a valid number."}, status=400)

    if price <= 0:
        return JsonResponse({"message": "Price must be greater than zero."}, status=400)

    try:
        seller = AppUser.objects.get(id=user_id)
    except AppUser.DoesNotExist:
        return JsonResponse({"message": "Seller not found."}, status=404)

    painting = Painting.objects.create(
        seller=seller,
        title=title,
        price=price,
        image=image,
    )

    return JsonResponse(
        {
            "message": "Painting uploaded successfully.",
            "painting": serialize_painting(painting, request),
        },
        status=201,
    )


@csrf_exempt
def buy_painting(request, painting_id):
    if request.method == "OPTIONS":
        return JsonResponse({})

    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed."}, status=405)

    try:
        painting = Painting.objects.get(id=painting_id)
    except Painting.DoesNotExist:
        return JsonResponse({"message": "Painting not found."}, status=404)

    if painting.is_ordered:
        return JsonResponse({"message": "Product already ordered."}, status=400)

    painting.is_ordered = True
    painting.save(update_fields=["is_ordered"])

    return JsonResponse(
        {
            "message": "Product ordered.",
            "painting": serialize_painting(painting, request),
        }
    )
