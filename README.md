

# Alacrity Project Documentation

## About the Project
The **Alacrity** project is a secure gateway for AI products to leverage healthcare data for testing and live production, developed in partnership with **National Digital Imaging Academy Wales** and **Life Sciences Hub Wales**. The project focuses on protecting healthcare data using **homomorphic encryption**, enabling safe and privacy-preserving data processing. It provides a full-stack web application with a **frontend** built using **Next.js** and **TailwindCSS**, and a **backend** developed with **Django**, deployed using **Docker** for consistency and scalability.



## Overview
The application uses **MySQL** for data persistence, **Redis** for caching, and **MinIO** for object storage. Deployment is managed via **Docker Compose** for local and production environments, with a CI/CD pipeline using **Jenkins** and **GitLab** to automate builds and deployments.

## Prerequisites
- **Local Development**:
  - Python 3.9+
  - Node.js 18+ and npm
  - MySQL 8.0+
  - Docker and Docker Compose
- **Production Deployment**:
  - Jenkins server for continuous integration and deployment
  - nginx or Apache for reverse proxy 
  - Access to GitLab repository: `git@git.cardiff.ac.uk:c2051028/alacrity.git`

## Running with Docker (Local and Production)
1. Clone the repository:
   ```bash
   git clone git@git.cardiff.ac.uk:c2051028/alacrity.git
   cd alacrity
   ```
2. Create a `.env` file in the root directory with the following content:
   ```env

   DJANGO_DATABASE_NAME=alacrity_db
   DJANGO_DATABASE_USER=your_username
   DJANGO_DATABASE_PASSWORD=your_password
   DJANGO_DATABASE_HOST=localhost
   DJANGO_DATABASE_PORT=3306
   REDIS_HOST=localhost
   REDIS_PORT=6379
   DJANGO_SETTINGS_MODULE=alacrity_backend.settings
   DEBUG=False
   BACKEND_URL=http://localhost:8000
   EMAIL_USER=your_email_here
   EMAIL_PASSWORD=your_gmail_app_key
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_SECRET=your_paypal_secret
   PAYPAL_MODE=sandbox
   PAYPAL_RETURN_URL=your_return_url
   PAYPAL_CANCEL_URL=your_cancel_url
   ```

3. Start the application:
   ```bash
   docker-compose up -d
   ```
4. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/`

## Running Without Docker (Local Development)
### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd alacrity_backend
   ```
2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure the database:
   - Create a MySQL database named `alacrity_db`.
   - Create a `.env` file in `alacrity_backend/`:
     ```env
     DJANGO_DATABASE_NAME=alacrity_db
     DJANGO_DATABASE_USER=your_username
     DJANGO_DATABASE_PASSWORD=your_password
     DJANGO_DATABASE_HOST=localhost
     DJANGO_DATABASE_PORT=3306
     REDIS_HOST=localhost
     REDIS_PORT=6379
     DJANGO_SETTINGS_MODULE=alacrity_backend.settings
     DEBUG=False
     BACKEND_URL=http://localhost:8000
     EMAIL_USER=your_email_here
     EMAIL_PASSWORD=your_gmail_app_key
     PAYPAL_CLIENT_ID=your_paypal_client_id
     PAYPAL_SECRET=your_paypal_secret
     PAYPAL_MODE=sandbox
     PAYPAL_RETURN_URL=your_return_url
     PAYPAL_CANCEL_URL=your_cancel_url
     ```
5. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
6. Start the backend server:
   ```bash
   python manage.py runserver
   ```
   - Backend API will be accessible at `http://localhost:8000/`.

**Note**: After pulling changes from the `dev` branch, update dependencies and migrations:
```bash
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd alacrity_frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with:
   ```env

   NEXT_PUBLIC_GOOGLE_API_KEY=Abad key and deactivate so cant workWjM4mBEP-UZWKN8   
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google cleint key
   NEXT_PUBLIC_DROPBOX_APP_KEY=your_dropbox_app_key_here
   NEXT_PUBLIC_ONEDRIVE_CLIENT_ID=your_onedrive_client_id_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   - Frontend will be accessible at `http://localhost:3000`.

## Database Setup
- Install MySQL 8.0+ on your machine.
- Create a database named `alacrity_db`.
- Update the database settings in `alacrity_backend/.env` with your MySQL credentials.

## Project Structure
```
├── alacrity_backend/       # Django backend
├── alacrity_frontend/      # Next.js frontend
├── alacrity.wiki/          # all the necessary docs (in form of wiki) as referenced in the project or this read me
├── dockerfile-frontend             # Dockerfile for frontend
├── dockerfile-backend              # Dockerfile for backend
├── dockerfile-database               # Dockerfile for MySQL
├── docker-compose.yml      # Docker Compose configuration
├── Jenkinsfile            # Jenkins pipeline configuration
├── nginx.conf            # Nginx configuration for reverse proxy
├── used_deployments              # Directory for used deployments and its scripts
├── .gitlab-ci.yml          # GitLab CI/CD pipeline configuration
└── README.md               # Project documentation
```

## Deployment (Production)
The application is deployed using Docker Compose on a production server, with a Jenkins CI/CD pipeline triggered by pushes to the `main` branch. For detailed instructions, refer to the [Deployment Guide](https://git.cardiff.ac.uk/c2051028/alacrity/-/wikis/deployment). or the widki directory

### Key Deployment Steps
1. Merge changes from `dev` to `deploy` branch.
2. Update frontend (`NEXT_PUBLIC_API_URL`) and backend (`BACKEND_URL`) configurations in `.env` and `.env.local`. and files named config.py and config.tsx on the frontend and backend respectively.
3. Push the `deploy` branch to `main` and trigger the Jenkins pipeline.
4. Jenkins pipeline:
   - Builds Docker images for `frontend`, `backend`, and `mysql`.
   - Deploys containers using `docker-compose up -d`.
5. Application is accessible at the configured domain (e.g., `http://10.72.98.30`). (no port)

## Features
Todo: list features here.

## Contributing
To contribute to the project:
1. Clone the repository:
   ```bash
   git clone git@git.cardiff.ac.uk:c2051028/alacrity.git
   ```
2. Pick an issue from the GitLab issue tab.
3. Create a merge request from the issue to generate a new branch.
4. Pull the `dev` branch locally:
   ```bash
   git checkout dev
   git pull origin dev
   ```
5. Checkout the new branch created by the merge request:
   ```bash
   git checkout <new-branch>
   ```
6. Make changes, commit, and push:
   ```bash
   git commit -m "Add feature or fix issue"
   git push origin <new-branch>
   ```
7. Update backend dependencies and migrations:
   ```bash
   pip install -r alacrity_backend/requirements.txt
   python manage.py makemigrations
   python manage.py migrate
   ```

## Guides 

( this are in the wiki directory in the root folder if the link returns 403 login page)
- [Authentication Implementation](https://git.cardiff.ac.uk/c2051028/alacrity/-/wikis/authentication)
- [MinIO Object Storage](https://git.cardiff.ac.uk/c2051028/alacrity/-/wikis/Minio-object-storage)
- [Deployment Process](https://git.cardiff.ac.uk/c2051028/alacrity/-/wikis/deployment)
- [Frontend Documentation](https://git.cardiff.ac.uk/c2051028/alacrity/-/wikis/Frontend-Documentation)
- [Backend API Endpoints](https://git.cardiff.ac.uk/c2051028/alacrity/-/wikis/API-Endpoints)

## Authors
- KariukiSM (kariukism1@cardi)
- Mahi MS (mahi@m)
- Gikinyi (gikinyi@e)

## Support
For support, open an issue on GitLab or contact the maintainers via email.

## Project Status

## License
