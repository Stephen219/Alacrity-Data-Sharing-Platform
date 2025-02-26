# Alacrity


# Alacrity Project

## Overview
This project consists of a **frontend** built with **Next.js** and **TailwindCSS** and a **backend** developed using **Django**. To run the project, ensure you have **Python, Node.js, and npm** installed on your machine.

Running the project using **Docker** is also possible.

## Running with Docker
If you have Docker installed on your machine, use the following command to start the project:

```bash
docker-compose up  # This will start both the frontend and backend, accessible at localhost:3000 and localhost:8000 respectively.
```

## Running the Project Without Docker
### Backend Setup
To run the backend manually:

1. Clone the repository and navigate to the backend folder:

```bash
cd alacrity_backend
```

2. Set up a virtual environment and activate it:

```bash
python -m venv venv
source venv/Scripts/activate
```

3. Create a local database known as 'project_db'
4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Run the Django development server:

```bash
python manage.py runserver
```
##  Note 
remember to migrate your d aftter any changes
```python
python manage.py makemigrations 
    # if this fails run python manage.py makemigrations app_name  python manage.py makemigrations alacrity_backend
python manage.py migrate
```

6. The backend will be accessible at `localhost:8000`.


please note that after every pull from main, it is important to install the requirement.txt through

```bash
pip install -r requirements.txt
```

in order to get the necessary changes that might be pushed by other users or developers 
also  python manage.py make migrations to get any changes in the databases that might have been made.

```bash
python manage.py makemigrations
```

or 
```bash
python manage.py makemigrations alacrity_backend
```

### Frontend Setup
To run the frontend manually:

1. Navigate to the frontend folder:

```bash
cd alacrity_frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```


## Database Setup
To set up the database, ensure you have MySQL installed on your machine. Create a new database and name it project_db update the database settings in the `alacrity_backend/settings.py` file.




## Project Structure
```
├── frontend/       # Next.js frontend
├── backend/        # Django backend
├── docker-compose.yml  # Docker setup
└── README.md       # Project documentation
├── .gitlab-ci.yml   # GitLab CI pipeline configuration
```

## Features
- Full-stack web application
- Next.js frontend with TailwindCSS
- Django backend with MySQL support
- Docker support for easy deployment
- CI/CD pipelines for automated testing and linting

## Contributing
We welcome contributions! To contribute:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m "Add new feature"`).
4. Push to your branch (`git push origin feature-name`).

5. Open a merge request.
 else
1. Clone the repository.
2. pick an issue from the issue tab
3. Create a merge request from the issue and this should create a new branch for you
4. pull development branch in your local machine
5. checkout to the branch created by the merge request
6. make changes and push to the branch

## Guides
1.  A complete guide on how the authentication is implementesd and how to interact with it can be found [here](https://git.cardiff.ac.uk/c2051028/alacrity/-/wikis/authentication)


## Authors

## Support
For support or questions, open an issue on GitLab or contact the maintainers.

## Project Status





