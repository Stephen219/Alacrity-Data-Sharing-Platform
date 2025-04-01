



pipeline {
    agent any

    triggers {
        gitlab(
            triggerOnPush: true,
            branchFilterType: 'NameBasedFilter',
            sourceBranchRegex: 'main',
            secretToken: '5tSVKGBSYUGBcJcAVUvt'       
            // ideally this should be a secret token, but for testing purposes, it's hardcoded here. 
            // i mean we can easily upload it to jenkins as a secret and use it here.
          

        )
    }

    stages {
        stage('Cleanup') {
            steps {
                script {
                    sh 'docker-compose down -v --remove-orphans || true'
                    sh 'docker system prune -a --volumes -f || true'
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
                        echo "Contents of .env file:"
                        cat alacrity_backend/alacrity_backend/.env
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
