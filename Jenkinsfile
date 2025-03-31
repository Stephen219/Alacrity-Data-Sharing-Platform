


// pipeline {
//     agent any

//     triggers {
//         gitlab(
//             triggerOnPush: true,
//             branchFilterType: 'NameBasedFilter',
//             sourceBranchRegex: 'main',
//             secretToken: 'HXC2nKoRL3QhifqdKumN'

//         )
//     }

//     stages {
//         stage('Cleanup') {
//             steps {
//                 script {
                    
//                     sh 'docker-compose down -v --remove-orphans || true'
                    
//                     sh 'docker system prune -a --volumes -f || true'
//                     sh 'docker system prune -a --volumes -f || true'
                    
//                     sh 'docker stop deploywith_docker-backend-1 || true'
//                     sh 'docker rm deploywith_docker-backend-1 || true'
//                     // Check if port 8000 is free, free it if necessary
//                     sh '''
//                         if netstat -tulnp | grep :8000; then
//                             PID=$(netstat -tulnp | grep :8000 | awk \'{print $7}\' | cut -d\'/\' -f1)
//                             kill -9 $PID || true
//                         fi
//                     '''
//                 }
//             }
//         }
//         stage('Checkout Code') {
//             steps {
//                 git branch: 'main',
//                     credentialsId: 'ssh-cred',
//                     url: 'git@git.cardiff.ac.uk:c22067364/alacrity-3-deploytest.git'
//             }
//         }

       
//         stage('Retrieve Secrets & Create .env') {
//         steps {
//             withCredentials([file(credentialsId: 'django-env-file', variable: 'ENV_FILE_PATH')]) {
//                 sh """
//                     echo "Creating .env file..."
//                     cp $ENV_FILE_PATH alacrity_backend/alacrity_backend/.env
//                 """
//             }


//             withCredentials([file(credentialsId: 'frontend-env-file', variable: 'FRONTEND_ENV_FILE_PATH')]) {
//                 cp "\${FRONTEND_ENV_FILE_PATH}" alacrity_frontend/.env.local
//                 sh """
//                     echo "Creating .env.local file..."
//                     cp $FRONTEND_ENV_FILE_PATH alacrity_frontend/.env.local
//                 """
//             }
//         }

//         }
//         }




//         stage('Build Docker Images') {
//             steps {
//                 sh 'docker-compose build'
//             }
//         }





//         stage('Deploy Containers') {
//             steps {
//                 sh 'docker-compose up -d --remove-orphans'
//             }
//         }
//     }

//     post {
//         always {
//             sh 'docker-compose logs'
//         }
//         success {
//             echo 'Deployment successful!'
//             echo 'Please check the logs for any errors.'
//         }
//         failure {
//             echo 'Deployment failed.'
//         }
//     }
// }






pipeline {
    agent any

    triggers {
        gitlab(
            triggerOnPush: true,
            branchFilterType: 'NameBasedFilter',
            sourceBranchRegex: 'main',
            secretToken: 'HXC2nKoRL3QhifqdKumN'
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
                }
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'ssh-cred',
                    url: 'git@git.cardiff.ac.uk:c22067364/alacrity-3-deploytest.git'
            }
        }

        stage('Retrieve Secrets & Create .env') {
            steps {

                // permissions
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
