#!/bin/bash


###############################################################################
# Script Name: jenkins.sh
# Description: This script automates the installation and configuration of
#              Jenkins and Docker on a Rocky Linux system. It includes system
#              updates, swap space setup, disk cleanup, and user/group setup.
#
# Target OS  : Rocky Linux 9.2
# Architecture: x86_64

# Author     : Kariukism1
# Usage      : sts up the deployment environment for Jenkins and Docker refer to deployment wiki for details
##############################################################################

set -e

echo "Starting setup script..."
sudo su -



echo "Whoami..."
whoami

echo "Current directory..."
pwd

# Upgrade the system (uncommented as per your instruction for submission)
echo "Upgrading system packages..."
sudo dnf upgrade -y -q

# Add swap space (to address 0 swap space issue from screenshot)
echo "Checking for swap space..."
if ! free | grep -q "Swap: *[1-9]"; then
    echo "No swap space found, creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    # Make swap permanent
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    echo "Swap space created:"
    free -m
else
    echo "Swap space already exists:"
    free -m
fi

# Clean up disk space (to address 805.14 MiB free disk space issue)
echo "Cleaning up disk space..."
# Remove unused packages and cache
sudo dnf autoremove -y -q
sudo dnf clean all
# Remove old logs
sudo find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;
echo "Disk space after cleanup:"
df -h /

# Install wget (required for Jenkins repo)
echo "Installing wget..."
sudo dnf install -y wget -q
sudo dnf install git -y

# Install Jenkins
echo "Adding Jenkins repository..."
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo

echo "Importing Jenkins key..."
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

echo "Upgrading to reload the repository..."
sudo dnf upgrade -y -q

echo "Installing Jenkins..."
sudo dnf install -y java-17-openjdk jenkins -q

echo "Enabling Jenkins..."
sudo systemctl enable jenkins

echo "Starting Jenkins..."
sudo systemctl start jenkins

echo "Sleeping for 40 seconds to allow Jenkins to start..."
sleep 40

echo "Checking Jenkins status..."
sudo systemctl status jenkins --no-pager

echo "Jenkins initial admin password..."
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

echo "Adding Jenkins to sudoers file..."
echo "jenkins ALL=(ALL) NOPASSWD: ALL" | sudo tee -a /etc/sudoers.d/jenkins > /dev/null

# Configure SSH for GitLab
echo "Setting up SSH known hosts for GitLab..."
sudo mkdir -p /root/.ssh
sudo touch /root/.ssh/known_hosts
echo "Changing permissions of known_hosts..."
sudo chmod 644 /root/.ssh/known_hosts
echo "Adding git.cardiff.ac.uk to known hosts..."
sudo ssh-keyscan git.cardiff.ac.uk >> /root/.ssh/known_hosts

# Install Docker
echo "Adding Docker repository..."
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

echo "Installing Docker..."
sudo dnf install -y docker-ce docker-ce-cli containerd.io -q

echo "Starting and enabling Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker stsatus
echo "Checking Docker status..."
sudo systemctl status docker

echo "Docker version..."
docker --version

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.7/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
echo "Docker Compose version..."
docker-compose --version


# Add users to Docker group
echo "Adding Jenkins and rocky to Docker group..."
sudo usermod -aG docker jenkins
sudo usermod -aG docker rocky

# Restart Jenkins to apply group changes
echo "Restarting Jenkins..."
sudo systemctl restart jenkins

echo "Verifying Jenkins group membership..."
groups jenkins

# Final disk space check
echo "Final disk space check..."
df -h /

echo "End of script."