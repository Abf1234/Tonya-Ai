from .settings import *  # noqa: F403

# SQLite is used only by the isolated automated test suite. Normal application
# and production settings require PostgreSQL in settings.py.
DATABASES = {  # noqa: F405
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
CELERY_TASK_ALWAYS_EAGER = True
SECURE_SSL_REDIRECT = False
