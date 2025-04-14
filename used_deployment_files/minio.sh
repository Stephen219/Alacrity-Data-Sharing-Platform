#!/bin/bash


###############################################################################
# Script Name: install_minio.sh
# System     : Rocky Linux 9.2 (x86_64)
# Description: Installs and configures MinIO as a systemd service on a Rocky 
#              Linux system. Sets up required users, storage, and exposes
#              the MinIO API on port 9000 and Console on port 9001.
# Author     : Kariukis
# refer to deployment wiki for details on minio and its configuration
###############################################################################


echo "Starting MinIO installation..."
echo "whoami..."
whoami
echo "pwd..."
pwd

# Update the system
echo "Updating system packages..."
sudo dnf update -y -q


# wget the minio package
sudo dnf install -y wget -q


echo "Starting MinIO installation..."


# Install required tools for debugging
echo "Installing net-tools and curl for troubleshooting..."
sudo dnf install -y -q net-tools curl

# Download MinIO binary with sudo
echo "Downloading MinIO..."
sudo wget https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
if [ $? -ne 0 ]; then
    echo "Failed to download MinIO - check network or URL"
    exit 1
fi
sudo chmod +x /usr/local/bin/minio

# Verify MinIO binary exists
if [ ! -f /usr/local/bin/minio ]; then
    echo "MinIO binary not found at /usr/local/bin/minio - installation aborted"
    exit 1
fi


echo "Creating MinIO user and group..."
sudo groupadd -r minio-user || true  
sudo useradd -r -g minio-user -s /sbin/nologin minio-user || true  

# Create and configure storage directory
echo "Creating MinIO storage directory..."
sudo mkdir -p /mnt/data
sudo chown minio-user:minio-user /mnt/data
sudo chmod 750 /mnt/data

# Set MinIO environment variables
echo "Configuring MinIO credentials..."
sudo tee /etc/default/minio > /dev/null <<EOF
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=Notgood1
EOF

# Check for port conflicts
echo "Checking for port conflicts on 9000 and 9001..."
if sudo netstat -tuln | grep -q ":9000"; then
    echo "Error: Port 9000 is already in use. Please free it up."
    sudo netstat -tuln | grep ":9000"
    exit 1
fi
if sudo netstat -tuln | grep -q ":9001"; then
    echo "Error: Port 9001 is already in use. Please free it up."
    sudo netstat -tuln | grep ":9001"
    exit 1
fi

# Create MinIO systemd service file
echo "Creating MinIO systemd service..."
sudo tee /etc/systemd/system/minio.service > /dev/null <<EOF
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
User=minio-user
Group=minio-user
ExecStart=/usr/local/bin/minio server /mnt/data --address :9000 --console-address :9001
Restart=always
EnvironmentFile=/etc/default/minio
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF


echo "Reloading systemd and starting MinIO..."
sudo systemctl daemon-reload
sudo systemctl enable minio
sudo systemctl start minio


echo "Checking MinIO status..."
sleep 10
if systemctl is-active minio | grep -q "active"; then
    echo "MinIO is running successfully!"
    curl -s localhost:9000/minio/health/ready
    if [ $? -eq 0 ]; then
        echo "MinIO health check passed - API is ready at http://localhost:9000"
    else
        echo "MinIO started but health check failed - checking logs..."
        sudo journalctl -u minio -n 50
        exit 1
    fi
else
    echo "MinIO failed to start - checking logs..."
    sudo journalctl -u minio -n 50
    exit 1
fi

echo "MinIO installation and startup complete!"