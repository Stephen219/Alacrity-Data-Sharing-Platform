from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import User  # Import the User model from the users app
from users.serializers import RegisterSerializer
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from users.decorators import role_required

class AddContributors(APIView):
    permission_classes = [IsAuthenticated]

    @role_required('organization_admin')
    def post(self, request):
        # Create a mutable copy of the request data
        data = request.data.copy()

        # Ensure the authenticated user has an associated organization.
        # If so, set the new user's organization to be the same as the admin's.
        if getattr(request.user, 'organization', None):
            data['organization'] = request.user.organization.Organization_id
        else:
            return Response(
                {'error': 'Authenticated user does not have an associated organization.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set role default to "contributor" if not provided.
        # Validate that the role is either "contributor" or "organization_admin".
        if 'role' not in data:
            data['role'] = 'contributor'
        elif data['role'] not in ['contributor', 'organization_admin']:
            return Response(
                {'error': 'Invalid role. Must be either "contributor" or "organization_admin".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize the serializer with the data
        #self.password = make_password(self.password)
        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            try:
                new_user = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
