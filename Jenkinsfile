pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Inventory') {
            steps {
                dir('inventory') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Payment') {
            steps {
                dir('payment') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Notification') {
            steps {
                dir('notification') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Shipping') {
            steps {
                dir('shipping') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Order') {
            steps {
                dir('order') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Docker Compose') {
            steps {
                sh '''
                docker compose up --build -d
                '''
            }
        }
    }

    post {
        success {
            echo 'Application deployed successfully.'
        }
    }
}