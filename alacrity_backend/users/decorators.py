

from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication

def get_user_from_token(token):
    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        User = get_user_model()
        return User.objects.get(id=user_id)
    except (TokenError, InvalidToken, User.DoesNotExist):
        return None
    
    # adapted from
    # https://medium.com/@sdhone98/custom-decorator-in-python-for-validating-user-based-on-function-level-roles-85d1d0381425
    """
    Decorator to restrict access to a view based on user roles.

    Args:
        allowed_roles (list/set): Roles permitted to access the view.

    Returns:
        function: A wrapped view with role-based access control.
    
    Raises:
        - 401 Unauthorized if authentication fails.
        - 403 Forbidden if the user's role is not authorized.
        - 500 Internal Server Error for other exceptions.
    """

def role_required(allowed_roles=[]):
    """
    role_required Decorator

    This decorator restricts access to a view based on the user's role. It requires JWT authentication and checks if the user's role is in the allowed roles list.
    """


    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(self,request, *args, **kwargs):
            try:
                print("Incoming Headers:", request.headers)
                
                jwt_auth = JWTAuthentication()
                auth_result = jwt_auth.authenticate(request)

                if auth_result is None:
                    print("No token found or invalid token")
                    return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

                user, token = auth_result
                print(f"Authenticated user: {user.email}, Role: {user.role}")

                if user.role in allowed_roles:
                    request.user = user
                    return view_func(self, request, *args, **kwargs)
                else:
                    print(f"Access denied: User role {user.role} not in {allowed_roles}")
                    return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

            except Exception as e:
                print(f"Error in role_required: {str(e)}")
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return wrapped_view
    return decorator
