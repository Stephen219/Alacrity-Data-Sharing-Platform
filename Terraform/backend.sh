#!/bin/bash

set -e

echo "Starting backend deployment script..."
cd /root || { echo "Failed to cd to /root"; exit 1; }

echo "Current user:" $(whoami)
echo "Current directory:" $(/bin/pwd)

echo "Updating system packages and refreshing metadata..."
sudo dnf upgrade -y -q || { echo "Failed to upgrade packages"; exit 1; }
sudo dnf makecache || { echo "Failed to refresh repository metadata"; exit 1; }

echo "Installing prerequisites..."
sudo dnf install -y -q epel-release || { echo "Failed to install epel-release"; exit 1; }
sudo dnf install -y -q python3 python3-pip python3-devel git mariadb-server mariadb-connector-c-devel redis pkg-config gcc || { echo "Failed to install prerequisites"; exit 1; }

echo "Starting MariaDB and Redis..."
sudo systemctl enable mariadb.service
sudo systemctl start mariadb.service || { echo "Failed to start mariadb"; exit 1; }
sudo systemctl enable redis
sudo systemctl start redis || { echo "Failed to start redis"; exit 1; }

echo "Setting MariaDB root password..."
sudo mysqladmin -u root password 'comsc' || { echo "Failed to set MariaDB root password"; exit 1; }

echo "Creating database and setting privileges..."
sudo mysql -uroot -pcomsc -e "DROP DATABASE IF EXISTS alacrity_db;" || { echo "Failed to drop database"; exit 1; }
sudo mysql -uroot -pcomsc -e "CREATE DATABASE alacrity_db;" || { echo "Failed to create database"; exit 1; }
sudo mysql -uroot -pcomsc -e "GRANT ALL PRIVILEGES ON alacrity_db.* TO 'root'@'localhost' IDENTIFIED BY 'comsc';" || { echo "Failed to set privileges"; exit 1; }
sudo mysql -uroot -pcomsc -e "FLUSH PRIVILEGES;" || { echo "Failed to flush privileges"; exit 1; }

echo "Configuring SSH for git.cardiff.ac.uk..."
mkdir -p ~/.ssh || { echo "Failed to create ~/.ssh"; exit 1; }
chmod 700 ~/.ssh
touch ~/.ssh/known_hosts
chmod 644 ~/.ssh/known_hosts
ssh-keyscan git.cardiff.ac.uk >> ~/.ssh/known_hosts 2>/dev/null || { echo "Failed to add git.cardiff.ac.uk to known_hosts"; exit 1; }

echo "Installing GitLab deployment key..."
cat << EOF > ~/.ssh/project.key
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----

EOF
chmod 400 ~/.ssh/project.key || { echo "Failed to set permissions on project.key"; exit 1; }

echo "Cloning backend repository..."
if [ ! -d "/root/alacrity" ]; then
    ssh-agent bash -c "ssh-add ~/.ssh/project.key && git clone git@git.cardiff.ac.uk:c2051028/alacrity.git" || { echo "Failed to clone repository"; exit 1; }
else
    echo "Repository already exists, pulling latest changes..."
    cd /root/alacrity
    ssh-agent bash -c "ssh-add ~/.ssh/project.key && git pull origin main" || { echo "Failed to pull repository"; exit 1; }
fi

cd /root/alacrity/alacrity_backend || { echo "Failed to cd to alacrity_backend"; exit 1; }

echo "Setting up virtual environment..."
python3 -m venv venv || { echo "Failed to create virtualenv"; exit 1; }
source venv/bin/activate || { echo "Failed to activate virtualenv"; exit 1; }

echo "Installing Python dependencies..."
pip install --upgrade pip || { echo "Failed to upgrade pip"; exit 1; }
pip install -r requirements.txt || { echo "Failed to install requirements"; exit 1; }
pip install gunicorn || { echo "Failed to install gunicorn"; exit 1; }

echo "Creating .env for deployment..."
cat << EOF > /root/alacrity/alacrity_backend/.env
DJANGO_DATABASE_NAME=alacrity_db
DJANGO_DATABASE_USER=root
DJANGO_DATABASE_PASSWORD=comsc
DJANGO_DATABASE_HOST=localhost
DJANGO_DATABASE_PORT=3306
EMAIL_USER=alacritytestingemail@gmail.com
EMAIL_PASSWORD=qyzb spmi fpfz ddmf
PAYPAL_CLIENT_ID=Afx9-bD4bxsIEX7UcDlofJ-BCHMjMrNeSNpQqXT1oUKd-crxbOgvq_5mOT-gNahXaEI6I2XYGOWWTVO3
PAYPAL_SECRET=EOGFcNtzPiuRkoiv7EhMZnbdspuMS-PEhtJk5f2KrXdnknGHGItHcuEQ_VcJPaBkYuV4dHt_a-v5DTol
PAYPAL_MODE=sandbox
PAYPAL_RETURN_URL=http://10.72.102.171:8000/payments/paypal/success/
PAYPAL_CANCEL_URL=http://10.72.102.171:8000/payments/paypal/cancel/
ENV=production
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

echo "Configuring settings.py for production..."
cat << EOF > alacrity_backend/settings.py
from pathlib import Path
import os
import sys
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    ENV=(str, 'development'),
    DEBUG=(bool, True),
    DJANGO_DATABASE_NAME=(str, 'alacrity_db'),
    DJANGO_DATABASE_USER=(str, 'root'),
    DJANGO_DATABASE_PASSWORD=(str, 'comsc'),
    DJANGO_DATABASE_HOST=(str, 'localhost'),
    DJANGO_DATABASE_PORT=(str, '3306'),
    REDIS_HOST=(str, '127.0.0.1'),
    REDIS_PORT=(int, 6379),
)

environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY', default='9cdf91842b864472c0570e917223afcc51a390b39a083a3f0de114cadf408f41')
DEBUG = env('DEBUG')
ENV = env('ENV')
IS_GITLAB_CI = os.getenv('CI', 'false').lower() == 'true'

ALLOWED_HOSTS = ['10.72.102.171', 'localhost', '127.0.0.1'] if ENV == 'production' else ['*']
CORS_ALLOW_ALL_ORIGINS = False if ENV == 'production' else True
CORS_ALLOWED_ORIGINS = [
    'http://10.72.102.244:80',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
] if ENV == 'production' else []

INSTALLED_APPS = [
    'channels',
    'channels_redis',
    'daphne',
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'alacrity_backend',
    'datasets',
    'storages',
    'users',
    'research',
    'payments',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'notifications',
    'contact',
    'organisation',
    'dataset_requests',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'alacrity_backend.urls'
ASGI_APPLICATION = 'alacrity_backend.asgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'alacrity_backend.wsgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(env('REDIS_HOST'), env('REDIS_PORT'))],
        },
    },
} if ENV == 'production' else {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': env('DJANGO_DATABASE_NAME'),
        'USER': env('DJANGO_DATABASE_USER'),
        'PASSWORD': '' if IS_GITLAB_CI else env('DJANGO_DATABASE_PASSWORD'),
        'HOST': env('DJANGO_DATABASE_HOST'),
        'PORT': env('DJANGO_DATABASE_PORT'),
        'TEST': {
            'NAME': 'alacrity_dbtes',
        },
    }
}

if 'test' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }

ENCRYPTION_KEY = env('ENCRYPTION_KEY', default="EHqnpsZeTQrwcmGfADez0GCRcJ_vQNCg5ch_pQg83Z0=")

CORS_ALLOW_HEADERS = [
    'content-type', 'authorization', 'accept', 'origin', 'x-requested-with', 'x-csrftoken',
    'accept-encoding', 'accept-language', 'cache-control', 'connection', 'content-length', 'cookie', 'host',
]

CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_CREDENTIALS = True

MINIO_URL = env('MINIO_URL', default="http://10.72.98.137:9000")
MINIO_ACCESS_KEY = env('MINIO_ACCESS_KEY', default="admin")
MINIO_SECRET_KEY = env('MINIO_SECRET_KEY', default="Notgood1")
MINIO_BUCKET_NAME = env('MINIO_BUCKET_NAME', default="alacrity")

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000

AWS_ACCESS_KEY_ID = MINIO_ACCESS_KEY
AWS_SECRET_ACCESS_KEY = MINIO_SECRET_KEY
AWS_STORAGE_BUCKET_NAME = MINIO_BUCKET_NAME
AWS_S3_ENDPOINT_URL = MINIO_URL
AWS_S3_CUSTOM_DOMAIN = f"{MINIO_URL}/{MINIO_BUCKET_NAME}"
AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
AWS_S3_REGION_NAME = 'us-east-1'

import pymysql
pymysql.install_as_MySQLdb()

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME Facets': {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',),
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer', 'rest_framework.renderers.TemplateHTMLRenderer', 'rest_framework.renderers.MultiPartRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser', 'rest_framework.parsers.MultiPartParser', 'rest_framework.parsers.FormParser'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

if DEBUG:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'].append('rest_framework.renderers.BrowsableAPIRenderer')

AUTHENTICATION_BACKENDS = ['django.contrib.auth.backends.ModelBackend']

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=300),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'BLACKLIST_ENABLED': True,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static') if ENV == 'production' else STATIC_URL

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_PASSWORD', default='')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

PAYPAL_CLIENT_ID = env('PAYPAL_CLIENT_ID', default='')
PAYPAL_SECRET = env('PAYPAL_SECRET', default='')
PAYPAL_MODE = env('PAYPAL_MODE', default='sandbox')
PAYPAL_RETURN_URL = env('PAYPAL_RETURN_URL', default='http://10.72.102.171:8000/payments/paypal/success/')
PAYPAL_CANCEL_URL = env('PAYPAL_CANCEL_URL', default='http://10.72.102.171:8000/payments/paypal/cancel/')
EOF

echo "Running Django migrations..."
python3 manage.py makemigrations || { echo "Failed to makemigrations"; exit 1; }
python3 manage.py migrate || { echo "Failed to migrate"; exit 1; }

echo "Collecting static files..."
python3 manage.py collectstatic --noinput || { echo "Failed to collect static files"; exit 1; }

echo "Setting up Gunicorn service..."
cat << EOF > /etc/systemd/system/gunicorn.service
[Unit]
Description=Gunicorn instance for Alacrity Backend
After=network.target mariadb.service redis.service

[Service]
User=root
Group=root
WorkingDirectory=/root/alacrity/alacrity_backend
ExecStart=/root/alacrity/alacrity_backend/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:8000 alacrity_backend.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn || { echo "Failed to start gunicorn"; exit 1; }

echo "Backend deployment complete!"