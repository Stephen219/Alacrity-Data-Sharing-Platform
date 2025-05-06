
/*
=====================================================================
Jenkins Declarative Pipeline for GitLab-triggered Docker Deployment
=====================================================================

Purpose:
This pipeline automates the server for deploying a full-stack 
application (Django backend & next js frontend) using Docker Compose.

Trigger:
- Automatically triggered on pushes to the `main` branch from GitLab.
- Trigger uses a GitLab secret token (currently hardcoded for testing; 
  recommended to store securely in Jenkins credentials).

Pipeline Stages:
1. Cleanup
   - Stops and removes old containers or processes on ports 8000/3000
   - Ensures a clean state before building new containers

2. Checkout Code
   - Clones the project from the GitLab repository using SSH credentials

3. Retrieve Secrets & Create .env
   - Pulls environment files securely from Jenkins credentials
   - Creates backend and frontend `.env` files in the correct locations
   - Ensures proper permissions for required directories

4. Build Docker Images
   - Builds all services defined in `docker-compose.yml`

5. Deploy Containers
   - Runs the containers in detached mode and removes orphans

Post Actions:
- Logs container output for diagnostics
- Echoes success or failure messages for quick feedback

Security Note:
- The GitLab secret token should be stored securely using Jenkins 
  credentials, not hardcoded as done temporarily here.

Author: Stephen Kariuki
Date: 2025
=====================================================================
*/



pipeline {
    agent any

    triggers {
        gitlab(
            triggerOnPush: true,
            branchFilterType: 'NameBasedFilter',
            sourceBranchRegex: 'main',
            secretToken: '5tSVKGBSYUGBcJcAVUvt'       
            // ideally this should be a secret token, but for testing purposes, it's hardcoded here. 
            // i mean we can easily upload it to jenkins as a secret and use it here. ( it is not fuctional )
          

        )
    }

    stages {
        stage('Cleanup') {
            steps {
                script {
                    sh 'docker-compose down -v --remove-orphans || true'
                    // sh 'docker system prune -a --volumes -f || true'
                    sh 'docker stop deploywith_docker-backend-1 || true'
                    sh 'docker rm deploywith_docker-backend-1 || true'

                    
                    sh '''
                        if netstat -tulnp | grep :8000; then
                            PID=$(netstat -tulnp | grep :8000 | awk '{print $7}' | cut -d'/' -f1)
                            kill -9 $PID || true
                        fi
                    '''
                    sh '''
                        if netstat -tulnp | grep :3000; then
                            PID=$(netstat -tulnp | grep :3000 | awk '{print $7}' | cut -d'/' -f1)
                            kill -9 $PID || true
                        fi
                    '''
                }
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'ssh-cred',
                    url: 'git@git.cardiff.ac.uk:c2051028/alacrity.git'
            }
        }

        stage('Retrieve Secrets & Create .env') {
            steps {

                
                sh '''
                    echo "Setting directory permissions..."
                    chmod -R 777 alacrity_backend/alacrity_backend/
                    chmod -R 777 alacrity_frontend/
                '''
                
                withCredentials([file(credentialsId: 'django-env-file', variable: 'ENV_FILE_PATH')]) {
                    sh """
                        echo "Creating backend .env file..."
                        cp "\${ENV_FILE_PATH}" alacrity_backend/alacrity_backend/.env
                        echo "Backend .env file created."
                      
                        
                        echo "success"
                    """
                }

                withCredentials([file(credentialsId: 'frontend_env', variable: 'FRONTEND_ENV_FILE_PATH')]) {
                    sh """
                        echo "Creating frontend .env.local file..."
                        cp "\${FRONTEND_ENV_FILE_PATH}" alacrity_frontend/.env.local
                    """
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker-compose build'
            }
        }

        stage('Deploy Containers') {
            steps {
                sh 'docker-compose up -d --remove-orphans'
            }
        }
    }

    post {
        always {
            sh 'docker-compose logs'
        }
        success {
            echo 'Deployment successful!'
            echo 'Please check the logs for any errors.'
            echo 'success'
        }
        failure {
            echo 'Deployment failed.'
            echo 'failure'
        }
    }
}
