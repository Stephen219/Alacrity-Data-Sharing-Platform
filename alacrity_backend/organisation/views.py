# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Contributor
from .serializers import ContributorSerializer
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from rest_framework.permissions import BasePermission

# Custom permission to check if the user is an organization admin
class IsOrganizationAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'organization_admin'

class AddContributors(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def post(self, request):
        serializer = ContributorSerializer(data=request.data)
        if serializer.is_valid():
            # Ensure role defaults to 'contributor' if not provided
            if 'role' not in serializer.validated_data:
                serializer.validated_data['role'] = 'contributor'
            # Save the contributor
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
