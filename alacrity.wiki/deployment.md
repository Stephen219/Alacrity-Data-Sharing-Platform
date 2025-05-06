
# Continuous Deployment Guide for Alacrity Application

This guide outlines the process for continuously deploying the Alacrity application using Jenkins, Docker, Terraform as the Infrastructure as Code (IaC) tool, and Nginx. The deployment is automatically triggered when changes are pushed to the `main` branch after merging the `dev` branch into the `deploy` branch and updating configurations.

## Overview

The deployment process automates infrastructure provisioning, application build, and deployment using the following components:

1. **Terraform for VM Provisioning**:
   - Terraform provisions two virtual machines:
     - **Jenkins VM**: It is used to run the app. Jenkins is chosen for its ability to easily integrate webhooks with GitLab. Later, Jenkins can be used for CI as well.
     - **Application VM**: Hosts the application with Nginx as a reverse proxy.

2. **Jenkins & Docker Integration**:
   - Jenkins is installed on the Jenkins VM and listens for webhooks from GitLab.
   - On detecting a push to the `main` branch, Jenkins executes the `Jenkinsfile` pipeline.
   - The pipeline builds the application into a Docker image using the `Dockerfile`.
   - The new Docker container is deployed on the same VM. 
   - Acknowledging that this should ideally be done on a separate VM, Jenkins can be used as the production pipeline server. GitLab CI is being used for the development pipelines.

3. **Nginx Configuration**:
   - Nginx is used as a reverse proxy to route traffic to the backend API and serve the frontend.
   - Backend API routes are prefixed with `/api` for correct proxying.
   - Before merging `deploy` into `main`, necessary configuration updates are applied.

4. **Automated Deployment Flow**:
   - Developers merge `dev` into `deploy`, update configurations, and push `deploy` to `main`.
   - Jenkins detects changes in `main` and triggers the automated build and deployment process.
   - The new version of the application is deployed and accessible through Nginx. The app is accessible via the URL of the Jenkins server.

---

## Continuous Deployment Process

### 1. Merge `dev` into `deploy` Branch
- Ensure your changes are in the `dev` branch and have been tested.
- Merge the `dev` branch into the `deploy` branch:
  ```bash
  git checkout deploy
  git merge dev
  ```
- Update the backend `urls.py` file to ensure all routes are appended with `/api` due to the Nginx configuration.
- Modify `config.py` to update the frontend and backend URL variables for production.
- Make any other necessary changes for production.
- Merge `deploy` into `main`:
  ```bash
  git checkout main
  git merge deploy
  git push origin main
  ```
- The build will be triggered automatically.

## Prerequisites

This section outlines the initial setup required for continuous deployment of the Alacrity application.

### 1. Provision Terraform Servers
Use Terraform to provision two servers with the `main.tf` script:
- **Jenkins Server**: Hosts the deployment pipeline.
- **MinIO Server**: Handles object storage (if applicable).

**Details**:
- The `main.tf` script sets up a VM at `10.72.98.30` with Rocky Linux, Docker, and Jenkins.
- SSH access is configured for the `rocky` user using a private key (`cloud.key`).
- The server runs two shell scripts:
  - MinIO deployment script
  - Jenkins setup script

### 2. Set Up Jenkins on the VM
Access Jenkins at `http://10.72.98.30:8080` and configure it as follows:

#### Install Required Jenkins Plugins
Install the following plugins for Git integration, pipeline execution, and SSH functionality:
- **Git Plugin**
- **GitLab Plugin**
- **Pipeline Plugin**
- **SSH Agent Plugin**
- **Docker Plugin**

#### Configure SSH Keys
Set up SSH keys for Jenkins to authenticate with GitLab:
- **Private Key**:
  - Go to **Manage Jenkins > Manage Credentials > Global Credentials > Add Credentials**.
  - Select **SSH Username with Private Key**, set the username to `rocky`, and paste the private key (`cloud.key`).
  - Set the credential ID to `cloud-key-credentials-id`.
- **Public Key**:
  - In GitLab, go to **Profile > SSH Keys**.
  - Add the public key corresponding to `cloud.key`.

#### Create a New Jenkins Project
1. Create a new project named `alacrity_deploy` in Jenkins.
2. Select **Pipeline** as the project type.
3. Configure the pipeline to use SCM:
   - **SCM**: Git
   - **Repository URL**: `git@git.cardiff.ac.uk:c2051028/alacrity.git`
   - **Credentials**: Select `cloud-key-credentials-id`.
   - **Branch Specifier**: `*/main`
4. Enable the trigger: **Build when a change is pushed to GitLab**.
   - Webhook URL: `http://10.72.98.30:8080/project/alacrity_deploy`
   - Copy this URL for the next step.

#### Create an Access Token for the Webhook
1. In GitLab, go to **Project Settings > Access Tokens**.
2. Create a token with `api` scope, named `jenkins-webhook-token`, and copy it.
3. Add the token to Jenkins:
   - Go to **Manage Jenkins > Configure System > GitLab**.
   - Add a GitLab connection, set the host URL to `https://git.cardiff.ac.uk`, and input the token.

#### Add a Webhook in GitLab
1. In GitLab, navigate to **Settings > Webhooks**.
2. Add the webhook URL: `http://10.72.98.30:8080/project/alacrity_deploy`.
3. Set the secret token to the `jenkins-webhook-token`.
4. Enable **Push Events** for the `main` branch.
5. Test the webhook to confirm it triggers a Jenkins build (should return **200 OK**). If you receive a **401 Unauthorized** error, ensure your `Jenkinsfile` has been committed to the repository.

---

## Improvements

### 1. Add Jenkins as the Production Pipeline Server
- **Jenkins as the Prod Pipeline Server**: Use Jenkins as the production pipeline server to manage the entire deployment pipeline. It will handle all production deployment steps and can later be adapted for further pipeline needs.
  
### 2. Add Monitoring Tools
- **Monitoring Tools**: To ensure that the application remains in good health, monitoring tools like Prometheus and Grafana can be integrated to track metrics and monitor application performance. This will provide insight into the health of the app and alert when necessary.

