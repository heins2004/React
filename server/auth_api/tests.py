import json

from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile

from .models import AppUser, Painting


class AuthApiTests(TestCase):
    def test_register_creates_user(self):
        response = self.client.post(
            "/api/auth/register",
            data=json.dumps(
                {
                    "name": "Alice Stone",
                    "email": "alice@example.com",
                    "phoneNumber": "9876543210",
                    "username": "alice",
                    "password": "secret123",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(AppUser.objects.filter(username="alice").exists())

    def test_login_returns_user_payload(self):
        AppUser.objects.create(
            name="Alice Stone",
            email="alice@example.com",
            phone_number="9876543210",
            username="alice",
            password_hash="fcf730b6d95236ecd3c9fc2d92d7b6b2bb061514961aec041d6c7a7192f592e4",
        )

        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": "alice", "password": "secret123"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["username"], "alice")
        self.assertEqual(response.json()["user"]["name"], "Alice Stone")

    def test_upload_painting_creates_listing(self):
        user = AppUser.objects.create(
            name="Artist One",
            email="artist@example.com",
            phone_number="9999999999",
            username="artist",
            password_hash="hash",
        )

        image = SimpleUploadedFile("painting.jpg", b"fake-image-content", content_type="image/jpeg")

        response = self.client.post(
            "/api/auth/paintings",
            data={
                "title": "Sunset",
                "price": "149.99",
                "userId": str(user.id),
                "image": image,
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Painting.objects.count(), 1)

    def test_buy_painting_marks_it_ordered(self):
        user = AppUser.objects.create(
            name="Artist One",
            email="artist@example.com",
            phone_number="9999999999",
            username="artist",
            password_hash="hash",
        )
        painting = Painting.objects.create(
            seller=user,
            title="Sunset",
            price="149.99",
            image=SimpleUploadedFile("painting.jpg", b"fake-image-content", content_type="image/jpeg"),
        )

        response = self.client.post(f"/api/auth/paintings/{painting.id}/buy")

        self.assertEqual(response.status_code, 200)
        painting.refresh_from_db()
        self.assertTrue(painting.is_ordered)
