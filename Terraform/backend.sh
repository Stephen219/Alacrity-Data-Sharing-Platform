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
sudo dnf install -y -q python3.11 python3.11-pip python3.11-devel git mariadb-server redis gcc mariadb-connector-c-devel policycoreutils-python-utils net-tools firewalld
sudo systemctl enable mariadb redis firewalld
sudo systemctl start mariadb redis firewalld

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
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && pip install -r /var/www/alacrity/alacrity_backend/requirements.txt"
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && pip install channels channels-redis daphne"

# Step 7: Configure environment variables
echo "Setting up environment variables..."
sudo -u alacrity bash -c "cat << EOF > /var/www/alacrity/alacrity_backend/.env
ENV=production
DEBUG=False
SECRET_KEY=9cdf91842b864472c0570e917223afcc51a390b39a083a3f0de114cadf408f41
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
MINIO_SECURE=False
EMAIL_USER=alacritytestingemail@gmail.com
EMAIL_PASSWORD=qyzb spmi fpfz ddmf
PAYPAL_CLIENT_ID=Afx9-bD4bxsIEX7UcDlofJ-BCHMjMrNeSNpQqXT1oUKd-crxbOgvq_5mOT-gNahXaEI6I2XYGOWWTVO3
PAYPAL_SECRET=EOGFcNtzPiuRkoiv7EhMZnbdspuMS-PEhtJk5f2KrXdnknGHGItHcuEQ_VcJPaBkYuV4dHt_a-v5DTol
PAYPAL_MODE=sandbox
PAYPAL_RETURN_URL=http://${FRONTEND_IP}/payments/paypal/success/
PAYPAL_CANCEL_URL=http://${FRONTEND_IP}/payments/paypal/cancel/
EOF"

# Step 8: Patch settings.py
echo "Patching settings.py with deployment-specific settings..."
SETTINGS_FILE="/var/www/alacrity/alacrity_backend/alacrity_backend/settings.py"
sudo -u alacrity bash -c "cp ${SETTINGS_FILE} ${SETTINGS_FILE}.bak"
if grep -q "STATIC_ROOT =" "${SETTINGS_FILE}"; then
    sudo -u alacrity bash -c "sed -i 's|STATIC_ROOT =.*|STATIC_ROOT = \"/var/www/alacrity/alacrity_backend/static\"|' ${SETTINGS_FILE}"
else
    sudo -u alacrity bash -c "echo -e '\nSTATIC_ROOT = \"/var/www/alacrity/alacrity_backend/static\"' >> ${SETTINGS_FILE}"
fi
if grep -q "DEFAULT_FILE_STORAGE =" "${SETTINGS_FILE}"; then
    sudo -u alacrity bash -c "sed -i 's|DEFAULT_FILE_STORAGE =.*|DEFAULT_FILE_STORAGE = \"storages.backends.s3boto3.S3Boto3Storage\"|' ${SETTINGS_FILE}"
else
    sudo -u alacrity bash -c "echo -e '\nDEFAULT_FILE_STORAGE = \"storages.backends.s3boto3.S3Boto3Storage\"' >> ${SETTINGS_FILE}"
fi
if ! grep -q "MINIO_URL =" "${SETTINGS_FILE}"; then
    sudo -u alacrity bash -c "cat << EOF >> ${SETTINGS_FILE}

# MinIO settings from environment
MINIO_URL = env('MINIO_URL')
MINIO_ACCESS_KEY = env('MINIO_ACCESS_KEY')
MINIO_SECRET_KEY = env('MINIO_SECRET_KEY')
MINIO_BUCKET_NAME = env('MINIO_BUCKET_NAME')
MINIO_SECURE = env('MINIO_SECURE', default=False)
AWS_ACCESS_KEY_ID = MINIO_ACCESS_KEY
AWS_SECRET_ACCESS_KEY = MINIO_SECRET_KEY
AWS_STORAGE_BUCKET_NAME = MINIO_BUCKET_NAME
AWS_S3_ENDPOINT_URL = MINIO_URL
AWS_S3_REGION_NAME = 'us-east-1'
EOF"
fi
sudo -u alacrity bash -c "python3.11 -m py_compile ${SETTINGS_FILE}" || { echo "Syntax error in settings.py; check ${SETTINGS_FILE}"; cat "${SETTINGS_FILE}"; exit 1; }

# Step 9: Patch asgi.py with provided version and logging
echo "Patching asgi.py with provided version and logging..."
ASGI_FILE="/var/www/alacrity/alacrity_backend/alacrity_backend/asgi.py"
echo "Current asgi.py content before patching (if exists):"
if [ -f "${ASGI_FILE}" ]; then cat "${ASGI_FILE}"; else echo "No existing asgi.py"; fi
sudo -u alacrity bash -c "cp ${ASGI_FILE} ${ASGI_FILE}.bak" || true
sudo -u alacrity bash -c "cat << EOF > ${ASGI_FILE}
import os
import django
import logging
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import datasets.routing

# Setup logging
logging.basicConfig(level=logging.DEBUG, filename='/tmp/asgi_debug.log', filemode='a')
logger = logging.getLogger('asgi')

logger.debug('Starting ASGI setup...')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alacrity_backend.settings')
logger.debug('DJANGO_SETTINGS_MODULE set to: %s', os.environ['DJANGO_SETTINGS_MODULE'])

logger.debug('Calling django.setup()...')
django.setup()
logger.debug('django.setup() completed.')

logger.debug('Importing datasets.routing...')
application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(datasets.routing.websocket_urlpatterns)
    ),
})
logger.debug('ASGI application initialized.')
EOF"
sudo -u alacrity bash -c "python3.11 -m py_compile ${ASGI_FILE}" || { echo "Syntax error in asgi.py; check ${ASGI_FILE}"; cat "${ASGI_FILE}"; exit 1; }
echo "Verifying asgi.py content after patching:"
cat "${ASGI_FILE}"
echo "Testing asgi.py import:"
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && python3.11 -c 'import alacrity_backend.asgi'" || { echo "Failed to import asgi.py"; exit 1; }

# Step 10: Database setup
echo "Setting up database..."
sudo mysql -uroot -pcomsc << EOF
DROP DATABASE IF EXISTS alacrity_db;
CREATE DATABASE alacrity_db;
CREATE USER IF NOT EXISTS 'alacrity'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON alacrity_db.* TO 'alacrity'@'localhost';
FLUSH PRIVILEGES;
EOF

# Step 11: Django setup
echo "Configuring Django..."
sudo mkdir -p /var/www/alacrity/alacrity_backend/static
sudo chown alacrity:alacrity /var/www/alacrity/alacrity_backend/static
sudo chmod 755 /var/www/alacrity/alacrity_backend/static
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && export DJANGO_SETTINGS_MODULE=alacrity_backend.settings && python manage.py makemigrations organisation users --noinput"
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && export DJANGO_SETTINGS_MODULE=alacrity_backend.settings && python manage.py makemigrations --noinput"
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && export DJANGO_SETTINGS_MODULE=alacrity_backend.settings && python manage.py migrate --noinput"
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && export DJANGO_SETTINGS_MODULE=alacrity_backend.settings && python manage.py collectstatic --noinput --verbosity 2"

# Step 12: Pre-flight checks
echo "Running pre-flight checks..."
if command -v netstat >/dev/null 2>&1; then
    if sudo netstat -tuln | grep -q ":8080 "; then
        echo "Port 8080 is in use, attempting to free it..."
        PID=$(sudo lsof -t -i:8080)
        if [ -n "$PID" ]; then
            sudo kill -9 "$PID"
            echo "Killed process $PID using port 8080."
        else
            echo "Could not identify process using port 8080; manual intervention required."
            exit 1
        fi
    fi
elif command -v ss >/dev/null 2>&1; then
    if sudo ss -tuln | grep -q ":8080 "; then
        echo "Port 8080 is in use, attempting to free it..."
        PID=$(sudo lsof -t -i:8080)
        if [ -n "$PID" ]; then
            sudo kill -9 "$PID"
            echo "Killed process $PID using port 8080."
        else
            echo "Could not identify process using port 8080; manual intervention required."
            exit 1
        fi
    fi
else
    echo "Warning: Neither netstat nor ss is available; skipping port 8080 check."
fi
if ! sudo systemctl is-active redis >/dev/null; then
    echo "Redis is not running, starting it..."
    sudo systemctl start redis
fi
if ! redis-cli -h 127.0.0.1 -p 6379 ping | grep -q "PONG"; then
    echo "Redis is not responding on 127.0.0.1:6379; check Redis configuration."
    exit 1
fi

# Step 13: Setup Daphne service
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
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF"

# Step 14: Configure firewall and SELinux
echo "Configuring firewall and SELinux..."
if command -v firewall-cmd >/dev/null 2>&1 && sudo systemctl is-active firewalld >/dev/null; then
    sudo firewall-cmd --permanent --add-port=8080/tcp
    sudo firewall-cmd --reload
    echo "Firewall configured to allow port 8080."
else
    echo "Warning: firewalld is not running or firewall-cmd not found; skipping firewall configuration."
fi
if sestatus | grep -q "SELinux status:.*enabled"; then
    sudo semanage port -a -t http_port_t -p tcp 8080 || echo "Port 8080 already allowed or semanage failed (non-critical)."
fi

# Step 15: Test Daphne manually
echo "Testing Daphne manually..."
sudo -u alacrity bash -c "source /var/www/alacrity/alacrity_backend/venv/bin/activate && cd /var/www/alacrity/alacrity_backend && echo 'Environment:' && env && ls -l /var/www/alacrity/alacrity_backend/alacrity_backend/asgi.py && DJANGO_SETTINGS_MODULE=alacrity_backend.settings /var/www/alacrity/alacrity_backend/venv/bin/daphne -b 0.0.0.0 -p 8080 alacrity_backend.asgi:application &> /tmp/daphne_test.log &"
sleep 5
if pgrep -f "daphne" >/dev/null; then
    echo "Daphne started successfully in manual test."
    sudo pkill -f "daphne"
else
    echo "Daphne failed to start in manual test. Check /tmp/daphne_test.log:"
    cat /tmp/daphne_test.log
    echo "Dumping ASGI debug log (if exists):"
    cat /tmp/asgi_debug.log || echo "No /tmp/asgi_debug.log found"
    exit 1
fi

# Step 16: Finalize deployment
echo "Finalizing deployment..."
sudo systemctl daemon-reload
sudo systemctl enable alacrity
sudo systemctl start alacrity

# Step 17: Verify deployment
echo "Verifying deployment..."
sleep 5
if sudo systemctl is-active alacrity >/dev/null; then
    echo "Daphne service is running."
else
    echo "Daphne service failed to start. Dumping logs:"
    sudo journalctl -u alacrity --since "10 minutes ago"
    exit 1
fi
if curl http://${BACKEND_IP}:8080 &>/dev/null; then
    echo "Backend deployed successfully! Running on http://${BACKEND_IP}:8080"
else
    echo "Backend deployment failed (no response from http://${BACKEND_IP}:8080). Dumping logs:"
    sudo journalctl -u alacrity --since "10 minutes ago"
    exit 1
fi

echo "Backend deployment complete! Frontend should access it at http://${BACKEND_IP}:8080"