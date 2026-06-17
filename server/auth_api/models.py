from django.db import models


class AppUser(models.Model):
    name = models.CharField(max_length=120, default="")
    email = models.EmailField(default="")
    phone_number = models.CharField(max_length=20, default="")
    username = models.CharField(max_length=100, unique=True)
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.username


class Painting(models.Model):
    seller = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="paintings")
    title = models.CharField(max_length=150)
    image = models.FileField(upload_to="paintings/")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_ordered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "paintings"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
