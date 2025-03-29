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
sudo chown -R alacrity:alacrity /var/www/alacrity
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

# Step 8: Override settings.py with production-ready version and validate
echo "Overriding settings.py with production configuration..."
SETTINGS_FILE="/var/www/alacrity/alacrity_backend/alacrity_backend/settings.py"
TEMP_FILE="/tmp/settings.py.tmp"

# Write settings.py using echo -e to avoid heredoc issues
sudo -u alacrity bash -c "echo -e 'from pathlib import Path\nimport os\nimport sys\nimport environ\n\nBASE_DIR = Path(__file__).resolve().parent.parent\nprint(f\"Debug: BASE_DIR is {BASE_DIR}\")  # Debug output\n\nenv = environ.Env(\n    ENV=(str, \"development\"),\n    DEBUG=(bool, False),\n    DJANGO_DATABASE_NAME=(str, \"alacrity_db\"),\n    DJANGO_DATABASE_USER=(str, \"alacrity\"),\n    DJANGO_DATABASE_PASSWORD=(str, \"${DB_PASSWORD}\"),\n    DJANGO_DATABASE_HOST=(str, \"localhost\"),\n    DJANGO_DATABASE_PORT=(str, \"3306\"),\n    REDIS_HOST=(str, \"127.0.0.1\"),\n    REDIS_PORT=(int, 6379),\n)\n\nenviron.Env.read_env(os.path.join(BASE_DIR, \".env\"))\n\nSECRET_KEY = env(\"SECRET_KEY\")\nDEBUG = env(\"DEBUG\")\nALLOWED_HOSTS = env.list(\"ALLOWED_HOSTS\")\n\nINSTALLED_APPS = [\n    \"daphne\",\n    \"channels\",\n    \"channels_redis\",\n    \"corsheaders\",\n    \"django.contrib.admin\",\n    \"django.contrib.auth\",\n    \"django.contrib.contenttypes\",\n    \"django.contrib.sessions\",\n    \"django.contrib.messages\",\n    \"django.contrib.staticfiles\",\n    \"rest_framework\",\n    \"alacrity_backend\",\n    \"organisation\",  # Must come before \"users\" due to ForeignKey dependency\n    \"users\",\n    \"datasets\",\n    \"storages\",\n    \"research\",\n    \"payments\",\n    \"rest_framework_simplejwt\",\n    \"rest_framework_simplejwt.token_blacklist\",\n    \"notifications\",\n    \"contact\",\n    \"dataset_requests\",\n]\n\nMIDDLEWARE = [\n    \"corsheaders.middleware.CorsMiddleware\",\n    \"django.middleware.security.SecurityMiddleware\",\n    \"django.contrib.sessions.middleware.SessionMiddleware\",\n    \"django.middleware.common.CommonMiddleware\",\n    \"django.middleware.csrf.CsrfViewMiddleware\",\n    \"django.contrib.auth.middleware.AuthenticationMiddleware\",\n    \"django.contrib.messages.middleware.MessageMiddleware\",\n    \"django.middleware.clickjacking.XFrameOptionsMiddleware\",\n]\n\nROOT_URLCONF = \"alacrity_backend.urls\"\nASGI_APPLICATION = \"alacrity_backend.asgi.application\"\n\nTEMPLATES = [\n    {\n        \"BACKEND\": \"django.template.backends.django.DjangoTemplates\",\n        \"DIRS\": [],\n        \"APP_DIRS\": True,\n        \"OPTIONS\": {\n            \"context_processors\": [\n                \"django.template.context_processors.debug\",\n                \"django.template.context_processors.request\",\n                \"django.contrib.auth.context_processors.auth\",\n                \"django.contrib.messages.context_processors.messages\",\n            ],\n        },\n    },\n]\n\nWSGI_APPLICATION = \"alacrity_backend.wsgi.application\"\nIS_GITLAB_CI = os.getenv(\"CI\", \"false\").lower() == \"true\"\n\nCORS_ALLOW_ALL_ORIGINS = False\nCORS_ALLOWED_ORIGINS = env.list(\"CORS_ALLOWED_ORIGINS\")\n\nCHANNEL_LAYERS = {\n    \"default\": {\n        \"BACKEND\": \"channels_redis.core.RedisChannelLayer\",\n        \"CONFIG\": {\n            \"hosts\": [(env(\"REDIS_HOST\"), env(\"REDIS_PORT\"))],\n        },\n    },\n}\n\nDATABASES = {\n    \"default\": {\n        \"ENGINE\": \"django.db.backends.mysql\",\n        \"NAME\": env(\"DJANGO_DATABASE_NAME\"),\n        \"USER\": env(\"DJANGO_DATABASE_USER\"),\n        \"PASSWORD\": env(\"DJANGO_DATABASE_PASSWORD\"),\n        \"HOST\": env(\"DJANGO_DATABASE_HOST\"),\n        \"PORT\": env(\"DJANGO_DATABASE_PORT\"),\n        \"TEST\": {\n            \"NAME\": \"alacrity_dbtes\",\n        },\n        \"OPTIONS\": {\n            \"init_command\": \"SET sql_mode=\\\"STRICT_TRANS_TABLES\\\"\",\n        },\n    }\n}\n\nif \"test\" in sys.argv:\n    DATABASES = {\n        \"default\": {\n            \"ENGINE\": \"django.db.backends.sqlite3\",\n            \"NAME\": \":memory:\",\n        }\n    }\n\nENCRYPTION_KEY = env(\"ENCRYPTION_KEY\", default=\"EHqnpsZeTQrwcmGfADez0GCRcJ_vQNCg5ch_pQg83Z0=\")\n\nCORS_ALLOW_HEADERS = [\n    \"content-type\",\n    \"authorization\",\n    \"accept\",\n    \"origin\",\n    \"x-requested-with\",\n    \"x-csrftoken\",\n    \"accept-encoding\",\n    \"accept-language\",\n    \"cache-control\",\n    \"connection\",\n    \"content-length\",\n    \"cookie\",\n    \"host\",\n]\n\nCORS_ALLOW_METHODS = [\n    \"DELETE\",\n    \"GET\",\n    \"OPTIONS\",\n    \"PATCH\",\n    \"POST\",\n    \"PUT\",\n]\n\nCORS_ALLOW_CREDENTIALS = True\n\nMINIO_URL = env(\"MINIO_URL\")\nMINIO_ACCESS_KEY = env(\"MINIO_ACCESS_KEY\")\nMINIO_SECRET_KEY = env(\"MINIO_SECRET_KEY\")\nMINIO_BUCKET_NAME = env(\"MINIO_BUCKET_NAME\")\n\nDEFAULT_FILE_STORAGE = \"storages.backends.s3boto3.S3Boto3Storage\"\nDATA_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB\nFILE_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB\n\nAWS_ACCESS_KEY_ID = MINIO_ACCESS_KEY\nAWS_SECRET_ACCESS_KEY = MINIO_SECRET_KEY\nAWS_STORAGE_BUCKET_NAME = MINIO_BUCKET_NAME\nAWS_S3_ENDPOINT_URL = MINIO_URL\nAWS_S3_CUSTOM_DOMAIN = f\"{MINIO_URL}/{MINIO_BUCKET_NAME}\"\nAWS_S3_OBJECT_PARAMETERS = {\"CacheControl\": \"max-age=86400\"}\nAWS_S3_REGION_NAME = \"us-east-1\"\n\nimport pymysql\npymysql.install_as_MySQLdb()\n\nAUTH_PASSWORD_VALIDATORS = [\n    {\"NAME\": \"django.contrib.auth.password_validation.UserAttributeSimilarityValidator\"},\n    {\"NAME\": \"django.contrib.auth.password_validation.MinimumLengthValidator\"},\n    {\"NAME\": \"django.contrib.auth.password_validation.CommonPasswordValidator\"},\n    {\"NAME\": \"django.contrib.auth.password_validation.NumericPasswordValidator\"},\n]\n\nAUTH_USER_MODEL = \"users.User\"\n\nREST_FRAMEWORK = {\n    \"DEFAULT_AUTHENTICATION_CLASSES\": (\n        \"rest_framework_simplejwt.authentication.JWTAuthentication\",\n    ),\n    \"DEFAULT_RENDERER_CLASSES\": [\n        \"rest_framework.renderers.JSONRenderer\",\n        \"rest_framework.renderers.TemplateHTMLRenderer\",\n        \"rest_framework.renderers.MultiPartRenderer\",\n    ],\n    \"DEFAULT_PARSER_CLASSES\": [\n        \"rest_framework.parsers.JSONParser\",\n        \"rest_framework.parsers.MultiPartParser\",\n        \"rest_framework.parsers.FormParser\",\n    ],\n    \"DEFAULT_PERMISSION_CLASSES\": [\n        \"rest_framework.permissions.IsAuthenticated\",\n    ],\n    \"EXCEPTION_HANDLER\": \"rest_framework.views.exception_handler\",\n}\n\nif DEBUG:\n    REST_FRAMEWORK[\"DEFAULT_RENDERER_CLASSES\"].append(\"rest_framework.renderers.BrowsableAPIRenderer\")\n\nAUTHENTICATION_BACKENDS = [\n    \"django.contrib.auth.backends.ModelBackend\",\n]\n\nfrom datetime import timedelta\n\nSIMPLE_JWT = {\n    \"ACCESS_TOKEN_LIFETIME\": timedelta(minutes=300),\n    \"REFRESH_TOKEN_LIFETIME\": timedelta(days=1),\n    \"ROTATE_REFRESH_TOKENS\": False,\n    \"BLACKLIST_AFTER_ROTATION\": True,\n    \"ALGORITHM\": \"HS256\",\n    \"SIGNING_KEY\": SECRET_KEY,\n    \"BLACKLIST_ENABLED\": True,\n    \"VERIFYING_KEY\": None,\n    \"AUTH_HEADER_TYPES\": (\"Bearer\",),\n    \"USER_ID_FIELD\": \"id\",\n    \"USER_ID_CLAIM\": \"user_id\",\n    \"AUTH_TOKEN_CLASSES\": (\"rest_framework_simplejwt.tokens.AccessToken\",),\n    \"TOKEN_TYPE_CLAIM\": \"token_type\",\n}\n\nLANGUAGE_CODE = \"en-us\"\nTIME_ZONE = \"UTC\"\nUSE_I18N = True\nUSE_TZ = True\n\nSTATIC_URL = \"/static/\"\nSTATIC_ROOT = \"/var/www/alacrity/alacrity_backend/static\"  # Hardcoded for clarity\nprint(f\"Debug: STATIC_ROOT is {STATIC_ROOT}\")  # Debug output\n\nDEFAULT_AUTO_FIELD = \"django.db.models.BigAutoField\"\n\nEMAIL_BACKEND = \"django.core.mail.backends.smtp.EmailBackend\"\nEMAIL_HOST = \"smtp.gmail.com\"\nEMAIL_PORT = 587\nEMAIL_USE_TLS = True\nEMAIL_HOST_USER = env(\"EMAIL_USER\")\nEMAIL_HOST_PASSWORD = env(\"EMAIL_PASSWORD\")\nDEFAULT_FROM_EMAIL = EMAIL_HOST_USER\n\nMEDIA_URL = \"/media/\"\nMEDIA_ROOT = os.path.join(BASE_DIR, \"media\")\n\nif DEBUG:\n    import mimetypes\n    mimetypes.add_type(\"application/javascript\", \".js\", True)\n\nPAYPAL_CLIENT_ID = env(\"PAYPAL_CLIENT_ID\")\nPAYPAL_SECRET = env(\"PAYPAL_SECRET\")\nPAYPAL_MODE = env(\"PAYPAL_MODE\")\nPAYPAL_RETURN_URL = env(\"PAYPAL_RETURN_URL\")\nPAYPAL_CANCEL_URL = env(\"PAYPAL_CANCEL_URL\")\n' > ${TEMP_FILE}"

# Validate settings.py syntax and line count
echo "Validating settings.py syntax..."
EXPECTED_LINES=238  # Approximate line count of the full settings.py
ACTUAL_LINES=$(wc -l < "${TEMP_FILE}")
echo "Expected lines: $EXPECTED_LINES, Actual lines: $ACTUAL_LINES"
if [ "$ACTUAL_LINES" -lt "$EXPECTED_LINES" ]; then
    echo "Error: settings.py is truncated. Check ${TEMP_FILE} contents:"
    cat "${TEMP_FILE}"
    exit 1
fi
python3.11 -m py_compile "${TEMP_FILE}" || { echo "Syntax error in settings.py; check ${TEMP_FILE}"; cat "${TEMP_FILE}"; exit 1; }
sudo -u alacrity bash -c "mv ${TEMP_FILE} ${SETTINGS_FILE}"
echo "Contents of settings.py after writing (first 10 and last 10 lines):"
sudo -u alacrity bash -c "head -n 10 ${SETTINGS_FILE}; echo '...'; tail -n 10 ${SETTINGS_FILE}"

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
echo "Creating and verifying static directory..."
sudo mkdir -p /var/www/alacrity/alacrity_backend/static
sudo chown alacrity:alacrity /var/www/alacrity/alacrity_backend/static
sudo chmod 755 /var/www/alacrity/alacrity_backend/static
sleep 1
echo "Static directory status before collectstatic:"
ls -ld /var/www/alacrity/alacrity_backend/static
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && export DJANGO_SETTINGS_MODULE=alacrity_backend.settings && python manage.py makemigrations organisation users --noinput"
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && export DJANGO_SETTINGS_MODULE=alacrity_backend.settings && python manage.py makemigrations --noinput"
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && export DJANGO_SETTINGS_MODULE=alacrity_backend.settings && python manage.py migrate --noinput"
echo "Running collectstatic..."
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && export DJANGO_SETTINGS_MODULE=alacrity_backend.settings && python manage.py collectstatic --noinput --verbosity 2"
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
Environment=\"DJANGO_SETTINGS_MODULE=alacrity_backend.settings\"
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
sleep 5
if curl http://${BACKEND_IP}:8080 &>/dev/null; then
    echo "Backend deployed successfully! Running on http://${BACKEND_IP}:8080"
else
    echo "Backend deployment failed. Check logs with: journalctl -u alacrity"
    exit 1
fi

echo "Backend deployment complete! Frontend should access it at http://${BACKEND_IP}:8080"