from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Contributor
from .serializers import ContributorSerializer
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from rest_framework.permissions import BasePermission

class IsOrganizationAdmin(BasePermission):
    def has_permission(self, request, view):
        # Check if the authenticated contributor is an organization admin
        return request.user.role == 'organization_admin'

class AddContributors(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def post(self, request):
        # Create a mutable copy of the request data
        data = request.data.copy()
        
        # Add the organization from the authenticated contributor (who is an admin)
        data['organization'] = request.user.organization.id
        
        # Handle role assignment
        if 'role' not in data:
            data['role'] = 'contributor'
        elif data['role'] not in ['contributor', 'organization_admin']:
            return Response(
                {'error': 'Invalid role. Must be either "contributor" or "organization_admin".'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ContributorSerializer(data=data)
        if serializer.is_valid():
            try:
                contributor = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetContributors(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def get(self, request):
        # Get all contributors from the same organization as the authenticated contributor
        contributors = Contributor.objects.filter(organization=request.user.organization)
        serializer = ContributorSerializer(contributors, many=True)
        return Response(serializer.data)