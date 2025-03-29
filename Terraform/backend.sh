#!/bin/bash

set -e

echo "Starting fresh backend deployment..."

# Define IPs and credentials
BACKEND_IP="10.72.102.171"
FRONTEND_IP="10.72.102.244"
DB_PASSWORD="comsc"  # Replace with a secure password

# Step 1: Clean up everything
echo "Cleaning up previous setup..."
sudo systemctl stop alacrity &>/dev/null || true
sudo systemctl disable alacrity &>/dev/null || true
sudo rm -f /etc/systemd/system/alacrity.service
sudo systemctl daemon-reload
sudo rm -rf /var/www/alacrity
sudo userdel -r alacrity &>/dev/null || true
sudo mysql -uroot -pcomsc -e "DROP DATABASE IF EXISTS alacrity_db;" &>/dev/null || true

# Step 2: Install base system
echo "Installing base system..."
sudo dnf install -y -q python3.11 python3.11-pip python3.11-devel git mariadb-server redis gcc mariadb-connector-c-devel
sudo systemctl enable mariadb redis
sudo systemctl start mariadb redis

# Step 3: Setup user and directory
echo "Setting up user and directory..."
sudo useradd -m -s /bin/bash alacrity
sudo mkdir -p /var/www/alacrity
sudo chown alacrity:alacrity /var/www/alacrity
sudo chmod 755 /var/www/alacrity

# Step 4: SSH setup
echo "Configuring SSH for git.cardiff.ac.uk..."
sudo -u alacrity bash -c "mkdir -p ~alacrity/.ssh && chmod 700 ~alacrity/.ssh"
sudo -u alacrity bash -c "touch ~alacrity/.ssh/known_hosts && chmod 644 ~alacrity/.ssh/known_hosts"
sudo -u alacrity bash -c "ssh-keyscan git.cardiff.ac.uk >> ~alacrity/.ssh/known_hosts 2>/dev/null"
sudo -u alacrity bash -c "cat << EOF > ~alacrity/.ssh/project.key
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
EOF"
sudo -u alacrity bash -c "chmod 400 ~alacrity/.ssh/project.key"

# Step 5: Clone repo and setup
echo "Cloning repository..."
sudo -u alacrity bash -c "cd /var/www && ssh-agent bash -c 'ssh-add ~alacrity/.ssh/project.key && git clone git@git.cardiff.ac.uk:c2051028/alacrity.git alacrity'"
sudo chown -R alacrity:alacrity /var/www/alacrity  # Ensure ownership after cloning
cd /var/www/alacrity/alacrity_backend || { echo "Failed to cd into /var/www/alacrity/alacrity_backend"; exit 1; }

# Step 6: Setup Python environment and install requirements
echo "Setting up Python environment and installing requirements..."
sudo -u alacrity bash -c "python3.11 -m venv /var/www/alacrity/alacrity_backend/venv"
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && pip install --upgrade pip"
echo "Installing requirements from requirements.txt..."
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && pip install -r /var/www/alacrity/alacrity_backend/requirements.txt"
echo "Installing Channels dependencies..."
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && pip install channels channels-redis daphne"

# Step 7: Configure environment variables
echo "Setting up environment variables..."
sudo -u alacrity bash -c "cat << EOF > /var/www/alacrity/alacrity_backend/.env
ENV=production
DEBUG=False
SECRET_KEY=your-secret-key-here
DJANGO_DATABASE_NAME=alacrity_db
DJANGO_DATABASE_USER=alacrity
DJANGO_DATABASE_PASSWORD=${DB_PASSWORD}
DJANGO_DATABASE_HOST=localhost
DJANGO_DATABASE_PORT=3306
ALLOWED_HOSTS=${BACKEND_IP},localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://${FRONTEND_IP},http://${FRONTEND_IP}:80
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
BACKEND_PORT=8080
MINIO_URL=http://10.72.98.137:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=Notgood1
MINIO_BUCKET_NAME=alacrity
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
PAYPAL_MODE=sandbox
PAYPAL_RETURN_URL=http://${FRONTEND_IP}/payments/paypal/success/
PAYPAL_CANCEL_URL=http://${FRONTEND_IP}/payments/paypal/cancel/
EOF"

# Step 8: Override settings.py with production-ready version and hardcode STATIC_ROOT
echo "Overriding settings.py with production configuration..."
sudo -u alacrity bash -c "cat << EOF > /var/www/alacrity/alacrity_backend/alacrity_backend/settings.py
from pathlib import Path
import os
import sys
import environ

BASE_DIR = Path(__file__).resolve().parent.parent
print(f'Debug: BASE_DIR is {BASE_DIR}')  # Debug output

env = environ.Env(
    ENV=(str, 'development'),
    DEBUG=(bool, False),
    DJANGO_DATABASE_NAME=(str, 'alacrity_db'),
    DJANGO_DATABASE_USER=(str, 'alacrity'),
    DJANGO_DATABASE_PASSWORD=(str, '${DB_PASSWORD}'),
    DJANGO_DATABASE_HOST=(str, 'localhost'),
    DJANGO_DATABASE_PORT=(str, '3306'),
    REDIS_HOST=(str, '127.0.0.1'),
    REDIS_PORT=(int, 6379),
)

environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

INSTALLED_APPS = [
    'daphne',
    'channels',
    'channels_redis',
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'alacrity_backend',
    'organisation',  # Must come before 'users' due to ForeignKey dependency
    'users',
    'datasets',
    'storages',
    'research',
    'payments',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'notifications',
    'contact',
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
IS_GITLAB_CI = os.getenv('CI', 'false').lower() == 'true'

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS')

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(env('REDIS_HOST'), env('REDIS_PORT'))],
        },
    },
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': env('DJANGO_DATABASE_NAME'),
        'USER': env('DJANGO_DATABASE_USER'),
        'PASSWORD': env('DJANGO_DATABASE_PASSWORD'),
        'HOST': env('DJANGO_DATABASE_HOST'),
        'PORT': env('DJANGO_DATABASE_PORT'),
        'TEST': {
            'NAME': 'alacrity_dbtes',
        },
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
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

ENCRYPTION_KEY = env('ENCRYPTION_KEY', default='EHqnpsZeTQrwcmGfADez0GCRcJ_vQNCg5ch_pQg83Z0=')

CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'accept',
    'origin',
    'x-requested-with',
    'x-csrftoken',
    'accept-encoding',
    'accept-language',
    'cache-control',
    'connection',
    'content-length',
    'cookie',
    'host',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_CREDENTIALS = True

MINIO_URL = env('MINIO_URL')
MINIO_ACCESS_KEY = env('MINIO_ACCESS_KEY')
MINIO_SECRET_KEY = env('MINIO_SECRET_KEY')
MINIO_BUCKET_NAME = env('MINIO_BUCKET_NAME')

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB

AWS_ACCESS_KEY_ID = MINIO_ACCESS_KEY
AWS_SECRET_ACCESS_KEY = MINIO_SECRET_KEY
AWS_STORAGE_BUCKET_NAME = MINIO_BUCKET_NAME
AWS_S3_ENDPOINT_URL = MINIO_URL
AWS_S3_CUSTOM_DOMAIN = f'{MINIO_URL}/{MINIO_BUCKET_NAME}'
AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
AWS_S3_REGION_NAME = 'us-east-1'

import pymysql
pymysql.install_as_MySQLdb()

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.TemplateHTMLRenderer',
        'rest_framework.renderers RezaMultiPartRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

if DEBUG:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'].append('rest_framework.renderers.BrowsableAPIRenderer')

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

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

STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/alacrity/alacrity_backend/static'  # Hardcoded for clarity
print(f'Debug: STATIC_ROOT is {STATIC_ROOT}')  # Debug output

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

if DEBUG:
    import mimetypes
    mimetypes.add_type('application/javascript', '.js', True)

PAYPAL_CLIENT_ID = env('PAYPAL_CLIENT_ID')
PAYPAL_SECRET = env('PAYPAL_SECRET')
PAYPAL_MODE = env('PAYPAL_MODE')
PAYPAL_RETURN_URL = env('PAYPAL_RETURN_URL')
PAYPAL_CANCEL_URL = env('PAYPAL_CANCEL_URL')
EOF"

# Step 9: Database setup
echo "Setting up database..."
sudo mysql -uroot -pcomsc << EOF
DROP DATABASE IF EXISTS alacrity_db;
CREATE DATABASE alacrity_db;
CREATE USER IF NOT EXISTS 'alacrity'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON alacrity_db.* TO 'alacrity'@'localhost';
FLUSH PRIVILEGES;
EOF

# Step 10: Django setup with explicit migration order
echo "Configuring Django..."
# Ensure static directory exists and is owned by alacrity
echo "Creating and verifying static directory..."
sudo mkdir -p /var/www/alacrity/alacrity_backend/static
sudo chown alacrity:alacrity /var/www/alacrity/alacrity_backend/static
sudo chmod 755 /var/www/alacrity/alacrity_backend/static
sleep 1  # Ensure filesystem sync
echo "Static directory status before collectstatic:"
ls -ld /var/www/alacrity/alacrity_backend/static
# Ensure migrations are created with correct dependencies
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && python manage.py makemigrations organisation users --noinput"
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && python manage.py makemigrations --noinput"
# Apply migrations
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && python manage.py migrate --noinput"
# Run collectstatic with verbose output
echo "Running collectstatic..."
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && python manage.py collectstatic --noinput --verbosity 2"
echo "Static directory status after collectstatic:"
ls -ld /var/www/alacrity/alacrity_backend/static

# Step 11: Setup Daphne service
echo "Configuring Daphne service..."
sudo bash -c "cat << EOF > /etc/systemd/system/alacrity.service
[Unit]
Description=Alacrity Django Channels Backend
After=network.target redis.service mariadb.service

[Service]
User=alacrity
Group=alacrity
WorkingDirectory=/var/www/alacrity/alacrity_backend
Environment=\"PATH=/var/www/alacrity/alacrity_backend/venv/bin\"
ExecStart=/var/www/alacrity/alacrity_backend/venv/bin/daphne -b 0.0.0.0 -p 8080 alacrity_backend.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF"

# Step 12: Configure firewall
echo "Configuring firewall..."
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# Step 13: Finalize deployment
echo "Finalizing deployment..."
sudo systemctl daemon-reload
sudo systemctl enable alacrity
sudo systemctl start alacrity

# Step 14: Verify deployment
echo "Verifying deployment..."
sleep 5  # Give service time to start
if curl http://${BACKEND_IP}:8080 &>/dev/null; then
    echo "Backend deployed successfully! Running on http://${BACKEND_IP}:8080"
else
    echo "Backend deployment failed. Check logs with: journalctl -u alacrity"
    exit 1
fi

echo "Backend deployment complete! Frontend should access it at http://${BACKEND_IP}:8080"