
# Authentication & Security Guide
AUTHOR (S): [Kariuki S](https://git.cardiff.ac.uk/c22067364)
## Overview

Our system implements secure authentication and authorization using JWT (JSON Web Tokens) and Role-Based Access Control (RBAC).

### User Roles
- **Organization Admin**: Full access to manage datasets and contributors
- **Contributor**: Organization-affiliated users with dataset contribution access
- **Self-registered Researcher**: Access to public datasets only
- **Public User**: Unauthenticated users with limited access
- **Superuser**: System administrator with full access to all resources  this iis typically the django admin

## Frontend Implementation

### Token Management

The system uses two types of tokens stored in `localStorage`:
- **Access Token**: For API request authentication
- **Refresh Token**: For obtaining new access tokens when current ones expire

### Making Authenticated Requests

To ensure each request includes the access token in the header, the `fetchWithAuth` function is used. This function automatically attaches the token to the request.

the `fetchWithAuth` function is defined in the `auth.js` file in the `libs` folder. It is used to make authenticated requests to the backend API.

```javascript
import { fetchWithAuth } from "@/libs/auth";

// GET request example
const fetchData = async () => {
    try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/testget/`, "GET");
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
};

// POST request example
const createData = async (data) => {
    try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/create/`, {
            method: "POST",
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};
```

### Protecting Frontend Routes

The frontend uses the Higher-Order Component (HOC) ``withAccessControl`` to restrict access to pages based on user roles. This ensures that only users with the required roles can access specific pages.

The `withAccessControl` function is defined in the `AccessControl.js` file in the `auth_guard` folder. It checks the user's role against the required roles and redirects to the login page if the user is not authenticated.

```javascript
import { withAccessControl } from "@/components/auth_guard/AccessControl";
import { useAuth } from "@/libs/auth";

function OrganizationPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h1>Hello {user.username}</h1>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
        </div>
    );
}

// Protect route for organization admins only
export default withAccessControl(OrganizationPage, ['organization_admin']);

// Protect route for multiple roles
export default withAccessControl(SharedPage, ['organization_admin', 'contributor']);
```

## Backend Implementation

by default, the backed urls are protected and hence it witll always give a 401 error if the user is not authenticated. or credentials are not provided.

### Securing API Routes

Use the `role_required` decorator to protect endpoints based on user roles. This decorator ensures that only users with the specified roles can access the route. The decorator is defined in the `decorators.py` file in the `users` app.

example of how to use the decorator in the views.py file

```python
from rest_framework.decorators import api_view
from users.decorators import role_required

# Single role protection
@api_view(['POST'])
@role_required(['organization_admin'])
def admin_only_route(request):
    return Response(data)

# Multiple roles protection
@api_view(['GET'])
@role_required(['organization_admin', 'contributor'])
def get_datasets(request):
    datasets = Dataset.objects.all()
    data = [{
        'id': dataset.dataset_id,
        'title': dataset.title,
        'category': dataset.category,
        'link': dataset.link,
        'description': dataset.description
    } for dataset in datasets]
    return Response(data, status=200)
```

### Public Routes

To allow public access to certain routes, use the `AllowAny` permission class. This class allows unauthenticated users to access the route without any restrictions.

```python

from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([AllowAny])
def public_route(request):
    return Response({"message": "Public access granted"})
```

## Common Usage Patterns

### Authentication Flow

```javascript

// Logout
const handleLogout = () => {
    logout(); // Clears tokens and redirects to login
    // the logout function is defined in the auth.js file in the libs folder

};
```

### Protected API Calls

```javascript
// Fetch protected data
const getProtectedData = async () => {
    try {
        const response = await fetchWithAuth(`${BACKEND_URL}/protected-route/`);
        if (response.status === 401) {
            // Handle unauthorized access
            return;
        }
        const data = await response.json();
        // Process data
    } catch (error) {
        // Handle network errors
    }
};
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check localStorage for valid tokens
   - Try logging out and back in again and ensure you are giving the rrequests with the righght permisions
   - Verify token expiration

2. **403 Forbidden**
   - Verify user has required role
   - Check role_required decorator configuration
   - Confirm role array syntax `['role']` not `'role'`

3. **Token Refresh Issues**
   - Tokens auto-refresh every 9 minutes
   - Manual refresh: `await refreshToken()`
   - use the console to get the correct token as shown below
   ```javascript
   let token = localStorage.getItem('access_token');
    console.log(token);
    ```

   - Check refresh token validity

### Best Practices

1. **Always use fetchWithAuth**
   ```javascript
   // Correct
   const response = await fetchWithAuth(url, options);
   
   // Incorrect
   const response = await fetch(url, options);
   ```

2. **Proper Role Arrays**
   ```javascript
   // Correct
   @role_required(['organization_admin'])
   
   // Incorrect
   @role_required('organization_admin')
   ```

3. **Handle Loading States**
   ```javascript
   const { user, loading } = useAuth();
   if (loading) return <p>Loading...</p>;  // Show loading indicator
   ```

## Support
- Check token status: Browser DevTools → Application → Local Storage
- Verify roles: Backend admin panel → User management
- Review logs: Backend console for authentication errors
- Currently, the token is set to expire after 10 minutes. After every 10 minutes, you will see the following logs in your server, indicating that the system is working as expected.

> ***Note***: The exact 10-minute time difference is important. Since the refresh token is asynchronous, it does not block the main thread. As a result, the user will not notice any delay in the application.



```bash
[11/Feb/2025 18:40:37] "POST //users/token/refresh/ HTTP/1.1" 200 241
[11/Feb/2025 18:40:37] "POST //users/token/refresh/ HTTP/1.1" 200 241
[11/Feb/2025 18:40:37] "POST //users/token/refresh/ HTTP/1.1" 200 241
[11/Feb/2025 18:50:37] "OPTIONS //users/token/refresh/ HTTP/1.1" 200 0
[11/Feb/2025 18:50:37] "OPTIONS //users/token/refresh/ HTTP/1.1" 200 0
[11/Feb/2025 18:50:37] "OPTIONS //users/token/refresh/ HTTP/1.1" 200 0
[11/Feb/2025 18:50:37] "POST //users/token/refresh/ HTTP/1.1" 200 241
[11/Feb/2025 18:50:37] "POST //users/token/refresh/ HTTP/1.1" 200 241
[11/Feb/2025 18:50:37] "POST //users/token/refresh/ HTTP/1.1" 200 241
[11/Feb/2025 19:00:37] "OPTIONS //users/token/refresh/ HTTP/1.1" 200 0
[11/Feb/2025 19:00:37] "OPTIONS //users/token/refresh/ HTTP/1.1" 200 0
[11/Feb/2025 19:00:37] "OPTIONS //users/token/refresh/ HTTP/1.1" 200 0
[11/Feb/2025 19:00:37] "POST //users/token/refresh/ HTTP/1.1" 200 241
[11/Feb/2025 19:00:37] "POST //users/token/refresh/ HTTP/1.1" 200 241
[11/Feb/2025 19:00:37] "POST //users/token/refresh/ HTTP/1.1" 200 241
```




# Mocking a User in Backend Tests

## Overview
In backend tests, you might be required to mock a users for your tests. This  gives you the process of mocking a user for testing purposes using Django's `APIClient` and JWT-based authentication.

### Steps for Mocking a User in Backend Tests

### 1. **Create a User**
To mock a user, create a user object using Django's get_user_model() method, which returns the custom or default User model.

```python
from django.contrib.auth import get_user_model

class goodTestCase(TestCase):
    # this is preferably done in the setUp method
    def setUp(self):
        # Create a user for authentication
        User = get_user_model()
        self.user = User.objects.create_user(
            email='testuser@example.com', 
            password='testpassword', 
            username='testuser', 
            role='organization_admin'  # Assign the appropriate role for authentication
        )
        
        # Initialize the APIClient for making requests
        self.client = APIClient()
```

---

### 2. **Login and Retrieve JWT Token**
After creating the user, simulate the login process by sending a POST request to the login endpoint. The server should respond with a JWT token that can be used for authenticated requests.  

```python
    def login_and_get_token(self):
        # Make a POST request to login with user credentials
        login_response = self.client.post('/users/login/', {
            'email': 'testuser@example.com',
            'password': 'testpassword',
        })

        # Ensure the login response is successful (status code 200)
        self.assertEqual(login_response.status_code, 200)

        # Return the access token from the response
        return login_response.data['access_token']
```

---

### 3. **Use the Token for Authentication**
Once the JWT token is obtained, it must be included in the request headers for authentication. The token is passed as a `Bearer` token in the `Authorization` header.

```python
    def test_whether_it_is_good(self):
        # Log in and get the token
        token = self.login_and_get_token()

        # Set the token in the Authorization header for the API request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Now make the actual request to create the dataset
        response = self.client.post(
            '/datasets/create_dataset/', # your edpoint 
            self.valid_dataset_data,
            HTTP_ACCEPT='application/json'
        )

        # Assert that the dataset creation was successful
        self.assertEqual(response.status_code, 201)
        
```


you can basically have the above methods as a utility funvs in the test suite.

a successful implementation would have the following logs   (they are from the decorator func):
``` bash 
System check identified no issues (0 silenced).
..testuser@example.com testpassword
Incoming Headers: {'Cookie': '', 'Content-Type': 'application/octet-stream', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM5NTg3MTcwLCJpYXQiOjE3Mzk1ODcxNTAsImp0aSI6ImI5MTQ4ODkzNmUxZjQwNThhNjFmOTJhNWUyYzQ2ZmJlIiwidXNlcl9pZCI6Mn0.Eq3Nw4vRp3AgFhihOR2Klumt7lbw3I4cM1iAFV1brgY'}
Authenticated user: testuser@example.com, Role: organization_admin
```

for insufficient permissions, the response would be:
``` bash 
ystem check identified no issues (0 silenced).
..testuser@example.com testpassword
Incoming Headers: {'Cookie': '', 'Content-Type': 'application/octet-stream', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM5NTkwMDY1LCJpYXQiOjE3Mzk1OTAwNDUsImp0aSI6Ijk0ZGNhMjY1ZTE5OTRkMjBiYTcwNDMxMmNlNGU5NDVkIiwidXNlcl9pZCI6Mn0.HXTpWSj1Pj6UcT_-zydgnEJh35Ng7aAWeWTtmFPsgKo'}
Authenticated user: testuser@example.com, Role: user
Access denied: User role user not in ['organization_admin', 'contributor']
```
I
