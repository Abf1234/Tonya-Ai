import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


DEBUG = env_bool("DEBUG", False)
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is required. Copy backend/.env.example to backend/.env and set it.")

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "apps.core",
    "apps.accounts",
    "apps.institutions",
    "apps.documents",
    "apps.reports",
    "apps.assistant",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required and must point to PostgreSQL.")

DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=60,
        conn_health_checks=True,
        ssl_require=env_bool("DATABASE_SSL_REQUIRE", False),
    )
}
if DATABASES["default"].get("ENGINE") != "django.db.backends.postgresql":
    raise RuntimeError("The application database must be PostgreSQL.")

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Freetown"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = []
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", FRONTEND_URL)
CORS_ALLOW_CREDENTIALS = True
CORS_URLS_REGEX = r"^/api/.*$"
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", FRONTEND_URL)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.accounts.authentication.AppwriteJWTAuthentication",
    ],
    # Public views opt into AllowAny explicitly; new API views are private by default.
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "DEFAULT_THROTTLE_CLASSES": [],
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
    "EXCEPTION_HANDLER": "apps.core.exceptions.api_exception_handler",
}

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", not DEBUG)
SECURE_COOKIES = env_bool("SECURE_COOKIES", not DEBUG)
SESSION_COOKIE_SECURE = SECURE_COOKIES
CSRF_COOKIE_SECURE = SECURE_COOKIES
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", False)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", False)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DATA_UPLOAD_MAX_NUMBER_FILES = 10
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 300
CELERY_TASK_SOFT_TIME_LIMIT = 270

GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "")
GOOGLE_SHEET_NAME = os.getenv("GOOGLE_SHEET_NAME", "")

# Optional Hugging Face Inference Providers layer for the public assistant.
# The browser never receives this token. It stays disabled until an operator
# deliberately enables it and configures a rotated, server-only credential.
HUGGINGFACE_ENABLED = env_bool("HUGGINGFACE_ENABLED", False)
HUGGINGFACE_TOKEN = (os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_TOKEN") or "").strip()
HUGGINGFACE_API_URL = os.getenv(
    "HUGGINGFACE_API_URL",
    "https://router.huggingface.co/v1/chat/completions",
).strip()
HUGGINGFACE_MODEL = os.getenv(
    "HUGGINGFACE_MODEL",
    "openai/gpt-oss-120b:fastest",
).strip()
HUGGINGFACE_TIMEOUT_SECONDS = max(
    1.0,
    min(float(os.getenv("HUGGINGFACE_TIMEOUT_SECONDS", "15")), 60.0),
)
HUGGINGFACE_MAX_TOKENS = max(
    64,
    min(int(os.getenv("HUGGINGFACE_MAX_TOKENS", "450")), 1200),
)
if HUGGINGFACE_API_URL and not HUGGINGFACE_API_URL.startswith("https://"):
    raise RuntimeError("HUGGINGFACE_API_URL must use HTTPS.")

# Appwrite owns browser identity and object storage. The server API key is
# deliberately loaded only by the backend and is never exposed to Vite.
# APPWRITE_DATABASE_ID is reserved for a future integration; PostgreSQL remains
# the authoritative domain database for this application.
APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "").strip().rstrip("/")
APPWRITE_ALLOW_INSECURE_ENDPOINT = env_bool("APPWRITE_ALLOW_INSECURE_ENDPOINT", DEBUG)
if APPWRITE_ALLOW_INSECURE_ENDPOINT and not DEBUG:
    raise RuntimeError("APPWRITE_ALLOW_INSECURE_ENDPOINT is allowed only when DEBUG=True.")
if APPWRITE_ENDPOINT and not APPWRITE_ENDPOINT.startswith(("https://", "http://")):
    raise RuntimeError("APPWRITE_ENDPOINT must use HTTPS outside explicitly allowed local development.")
if APPWRITE_ENDPOINT.startswith("http://") and (not DEBUG or not APPWRITE_ALLOW_INSECURE_ENDPOINT):
    raise RuntimeError("APPWRITE_ENDPOINT must use HTTPS; set APPWRITE_ALLOW_INSECURE_ENDPOINT only for local development.")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID", "").strip()
APPWRITE_DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID", "").strip()
APPWRITE_STORAGE_BUCKET_ID = os.getenv("APPWRITE_STORAGE_BUCKET_ID", "").strip()
APPWRITE_SERVER_API_KEY = os.getenv("APPWRITE_SERVER_API_KEY", "").strip()

# Evidence is never accepted as a successful upload until a server-side scanner
# and a private Appwrite Storage integration are both configured. These values
# are intentionally conservative defaults for the first live vertical slice.
EVIDENCE_MAX_UPLOAD_BYTES = int(os.getenv("EVIDENCE_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
EVIDENCE_ALLOWED_CONTENT_TYPES = set(
    env_list(
        "EVIDENCE_ALLOWED_CONTENT_TYPES",
        "application/pdf,image/png,image/jpeg,image/webp",
    )
)
EVIDENCE_SCANNING_ENABLED = env_bool("EVIDENCE_SCANNING_ENABLED", False)
EVIDENCE_SCANNER = os.getenv("EVIDENCE_SCANNER", "").strip()

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        }
    },
    "root": {
        "handlers": ["console"],
        "level": os.getenv("LOG_LEVEL", "INFO"),
    },
}
