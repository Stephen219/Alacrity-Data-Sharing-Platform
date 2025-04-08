#!/bin/bash

# Exit on any error
set -e

# Define IPs
BACKEND_IP="10.72.102.171"
FRONTEND_IP="10.72.102.244"

echo "Starting frontend deployment script..."
cd /root || { echo "Failed to cd to /root"; exit 1; }

echo "Current user:" $(whoami)
echo "Current directory:" $(/bin/pwd)

echo "Updating system packages..."
sudo dnf upgrade -y -q || { echo "Failed to upgrade packages"; exit 1; }

echo "Installing prerequisites..."
sudo dnf install -y -q python3 git nginx || { echo "Failed to install prerequisites"; exit 1; }

echo "Installing Node.js 20 from nodesource..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - || { echo "Failed to setup Node.js repository"; exit 1; }
sudo dnf install -y -q nodejs || { echo "Failed to install Node.js"; exit 1; }

echo "Git version:" $(git --version)

echo "Configuring SSH for git.cardiff.ac.uk..."
mkdir -p ~/.ssh || { echo "Failed to create ~/.ssh"; exit 1; }
chmod 700 ~/.ssh
touch ~/.ssh/known_hosts
chmod 644 ~/.ssh/known_hosts
ssh-keyscan git.cardiff.ac.uk >> ~/.ssh/known_hosts 2>/dev/null || { echo "Failed to add git.cardiff.ac.uk to known_hosts"; exit 1; }

echo "Installing GitLab deployment key..."
cat << EOF > ~/.ssh/project.key
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAgEA0MGhkCBFmLFafAIqe8t3hsj/aE32rpxezTdmzY0fvA9+GGVDv42n
A32l8cWD1/CSj1BWdf76odLZS1N2qJIoFv/bwK58JovHxMTDMROYRoioR5zLhyyK1o0XhW
NfIR/7DA2S3trxZA7vaw5A8Xz78bOEHTtmKx4LKzt3hliQg+fu9TLofBlpZf1XO7ZlWfH8
VZAOFqlxRFbsF73ZpOEW87JzHmDSefCNWZjWMd7dLcMqUHX3w8wc2qdSDsW0pdnBL7xVec
NgqhxyN0wzM6YqOBCgpcEYbQ2m+njdv+7RfncwgKi3EavzNNJnmqVH3o4D3o4fR4CqGajT
Ylvnrj9MLzqxEjptdPnWq5P8JnvraVXZrFyoFbctyU9B+i4CiZmr88QHbn9GLachF+2l07
y5H7LKRLtHbq4K+ibn044HKUu143D/fZS1aHWhMSAq0z123gvpaY0tYqX+MG56WeJ4U4HK
YuqXCHibZNCce5CTdPMv6ldofgzUv9rDn+ygRe5YoiXwdSS0DK3FCC3mH09spNwlsPCQqc
1s0ydFzkQqxyjz5YxvJJFFu4u2jnnCXOGb5oJ2q7xljkpCTrbZcfXrAIpiSOnwrIyMfTA9
38X16y41NzqJRqn/S/xkeOlryuhV5LQA3W46Iu5Cvaqt+9+u4HXF+zO2GlTm3LFdflxinD
8AAAdYMBoD4zAaA+MAAAAHc3NoLXJzYQAAAgEA0MGhkCBFmLFafAIqe8t3hsj/aE32rpxe
zTdmzY0fvA9+GGVDv42nA32l8cWD1/CSj1BWdf76odLZS1N2qJIoFv/bwK58JovHxMTDMR
OYRoioR5zLhyyK1o0XhWNfIR/7DA2S3trxZA7vaw5A8Xz78bOEHTtmKx4LKzt3hliQg+fu
9TLofBlpZf1XO7ZlWfH8VZAOFqlxRFbsF73ZpOEW87JzHmDSefCNWZjWMd7dLcMqUHX3w8
wc2qdSDsW0pdnBL7xVecNgqhxyN0wzM6YqOBCgpcEYbQ2m+njdv+7RfncwgKi3EavzNNJn
mqVH3o4D3o4fR4CqGajTYlvnrj9MLzqxEjptdPnWq5P8JnvraVXZrFyoFbctyU9B+i4CiZ
mr88QHbn9GLachF+2l07y5H7LKRLtHbq4K+ibn044HKUu143D/fZS1aHWhMSAq0z123gvp
aY0tYqX+MG56WeJ4U4HKYuqXCHibZNCce5CTdPMv6ldofgzUv9rDn+ygRe5YoiXwdSS0DK
3FCC3mH09spNwlsPCQqc1s0ydFzkQqxyjz5YxvJJFFu4u2jnnCXOGb5oJ2q7xljkpCTrbZ
cfXrAIpiSOnwrIyMfTA938X16y41NzqJRqn/S/xkeOlryuhV5LQA3W46Iu5Cvaqt+9+u4H
XF+zO2GlTm3LFdflxinD8AAAADAQABAAACAAOIK4VeHIGd2ZmKR0UQQR1m0jmEW5gkB1Wh
zWxfEZdiDEqJFltBLFSLUDK5srijxCiM3FIB5apsqt6v0T8IBpYXUQ67vWRfd2/WHDU51T
diAAsO5JcGvp0USb6WnfYhRiY50VPkZggWQSxad8/eJJHci7jGIO3eTPk3wRCPosBlhgfm
YHR8e6yljE/Cp1gK2pdExIhA9MsENIQwmd4gIP4v9Sh2wIUSZdQdhw4FbNaQRs0L424P0K
DHkPs66ArRKVdAUiTBfGKsCKG3WsGnMEsB362OQF4Rf2WXR4jNKbt0K1yHOy2Avow5PTHh
hkh5/63nRWIEphL2HLMq/OYne4ePGu85jAu1nOPSo5/vflZI7FL/Gkze1zUADTKZ1Ugkru
aGUCm9zT3TPjoYg+hDDQN04/fFFZondyaFNNuUKR/LcwvTNNIZ/Ur1NxozAYe53d6NbK45
IhqmNVUn4LJd/LW0ET7sdAHmQ48gV+G1lQSyQGNCrn7LU4zpLnMpmEycR3qRg36u+fGwj2
WyQCuiNQrWkzUAGS8oywbX4VxnLQq/nCdwJ3qEkZgDkNglb813595elSdTzsMehGDRM+0k
OpsmKk0WhBwvlcahsd/wGXsNHKe9lQwEiSNIptWFY5bogx89Ve2JX5V+hiIQ89M/m6xic2
v0ImQUYmY4N7zzPrURAAABAQCrG0mCCE8Ya+JEaFcPcuj8Xc5KW9qMFx5cMQsGVbJgWd93
6PS6/I1gf50ErTrqA9+iR+kXaNORbcBDjLC+wPjTQDKF4YC14fQWTj1Rkj/5lHwmqH78K1
AJy28s0HuIogSgIO8b6+NUS62wVKa/2gtlSWOLncqV7UkfQ8WcNGrhWsf3eNvT4vf3tIOs
pjBZiQ+jgr4Ve08Z9mc8x3W0GF9eckVF7SIoDEu9f8EK13cise0P60niRwKYyIqGFYNnMv
QskR01u6aAFF1bFw8JYeoUqgfNJg3oAVpBRmYMeF25oTscVSPv8c/LBwlN2QZEljFTqNbB
iXrn41w5yN5U/vEaAAABAQDzxH3M67h49o95EEjQYAww6h3NYg81XwL31FEKlMJBEalumR
3Bcw7siT7guooJ9LrZN0Sz4D549DTRG/dEnYwan3HK4TWH/tu/LVYng3l2FZCX370uSb6t
SQWl5gbsL4Cxg+uw8wUS72MbZqWn9gJugn0yYitVy6q8QRnPSg1tVYwootVLDfjkAfi8SR
xsaviSUDHc9Vvntw9GAjr6+IPhxqnbzs8nRJudxoxJ37gN55mLGZugZ4RlUDNjDaRUvaAg
v4Wg5tX8TmzEjvd8H7US5fpS9xEbLUrkCBuULB8jYqyyh1a8qWaK0RAIUMDzYlWD5Dg2xe
VrxfNrHngbKs+XAAABAQDbO2BCUGavPhYqxUaHCSI7dEaD2RcNxJvgjq33/u36EH76x2OJ
6fx1QG6CnH/5sXGXpJegfQifpsETLuFAfOWtD+IM3/ux3WpTlCuqbS0gsQNAY2EgF3wDLa
gOz7lkHBrEYVk/XNJEc5UQTnCAQUYM5fB0UPlL3IMfg9c7AKNuk383ex3r/v+hGKgt+YsP
y3YLHNNraF/maidukbvRiupfDn5G0LqYAuc3rOaEBleKAmJHXlZIhSnNDOkPQzKelf+EwO
T7E6in9Gs+uJFwrnzLZPxKsy9rqG7SaRP2DrBrHAVFk/8nS+NFowmzsbI7JT1752Kgng11
2o1Dru27CS2ZAAAAHElEK2MyMjA3NzA2NUBEU0E1MDg0OTI3MzE0ODcBAgMEBQY=
-----END OPENSSH PRIVATE KEY-----
EOF
chmod 400 ~/.ssh/project.key || { echo "Failed to set permissions on project.key"; exit 1; }

echo "Cloning frontend repository..."
if [ ! -d "/root/alacrity" ]; then
    ssh-agent bash -c "ssh-add ~/.ssh/project.key && git clone git@git.cardiff.ac.uk:c2051028/alacrity.git" || { echo "Failed to clone repository"; exit 1; }
else
    echo "Repository already exists, pulling latest changes..."
    cd /root/alacrity
    ssh-agent bash -c "ssh-add ~/.ssh/project.key && git pull origin main" || { echo "Failed to pull repository"; exit 1; }
fi

echo "Navigating to frontend directory..."
cd /root/alacrity/alacrity_frontend || { echo "Failed to cd to alacrity_frontend"; exit 1; }

# Set environment for deployment
echo "Setting deployment environment..."
echo "NEXT_PUBLIC_BACKEND_URL=http://${BACKEND_IP}:8080" > .env || { echo "Failed to create .env"; exit 1; }

echo "Installing Node.js dependencies..."
npm install || { echo "Failed to install npm dependencies"; exit 1; }

echo "Building Next.js application..."
npm run build || { echo "Failed to build Next.js app"; exit 1; }

echo "Deploying static files to /var/www/alacrity..."
mkdir -p /var/www/alacrity || { echo "Failed to create /var/www/alacrity"; exit 1; }
\cp -rf .next/static /var/www/alacrity/ || { echo "Failed to copy .next/static"; exit 1; }
\cp -rf .next/server /var/www/alacrity/ || { echo "Failed to copy .next/server"; exit 1; }

# Locate and copy index.html
INDEX_PATH=$(find .next -name "index.html" | head -n 1)
if [ -n "$INDEX_PATH" ]; then
    \cp -f "$INDEX_PATH" /var/www/alacrity/index.html || { echo "Failed to copy index.html"; exit 1; }
else
    echo "No index.html found in .next/. Build may have failed."
    exit 1
fi

echo "Setting permissions for Nginx..."
chown -R nginx:nginx /var/www/alacrity || { echo "Failed to set ownership"; exit 1; }
chmod -R 755 /var/www/alacrity || { echo "Failed to set permissions"; exit 1; }

# Configure SELinux for Nginx
if command -v getenforce > /dev/null 2>&1 && [ "$(getenforce)" = "Enforcing" ]; then
    echo "Configuring SELinux for Nginx..."
    chcon -R -t httpd_sys_content_t /var/www/alacrity || { echo "Failed to set SELinux context"; exit 1; }
    setsebool -P httpd_can_network_connect 1 || { echo "Failed to set SELinux boolean"; exit 1; }
fi

# Write Nginx configuration with WebSocket support
echo "Configuring Nginx..."
cat << EOF > /etc/nginx/nginx.conf
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  ${FRONTEND_IP};

        location / {
            root /var/www/alacrity;
            index index.html;
            try_files \$uri \$uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://${BACKEND_IP}:8080;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }

        location /ws/ {
            proxy_pass http://${BACKEND_IP}:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }
    }
}
EOF

echo "Testing Nginx configuration..."
nginx -t || { echo "Nginx configuration test failed"; exit 1; }

echo "Starting and enabling Nginx..."
systemctl enable nginx || { echo "Failed to enable Nginx"; exit 1; }
systemctl restart nginx || { echo "Failed to restart Nginx"; exit 1; }

echo "Verifying Nginx status..."
systemctl status nginx | grep "Active: active" || { echo "Nginx failed to start"; exit 1; }

echo "Testing deployment..."
curl http://localhost > /tmp/frontend_test.html 2>/dev/null
if grep -q "Alacrity" /tmp/frontend_test.html; then
    echo "Frontend deployed successfully! Access at http://${FRONTEND_IP}"
else
    echo "Frontend deployment failed. Check /var/log/nginx/error.log"
    cat /var/log/nginx/error.log
    exit 1
fi

echo "Frontend deployment complete! Test with: curl http://${FRONTEND_IP} and curl http://${FRONTEND_IP}/api/"