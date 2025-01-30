from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Test    

@api_view(['POST'])
def submit_form(request):
    
    name = request.data.get('name')
    message = request.data.get('message')

    print (name , message)
    print (name , message)
    print (name , message)
    new_entry = Test.objects.create(name=name, message=message)
    print(f"Inserted: {new_entry.name}, {new_entry.message}")

    
    if not name or not message:
        return Response({"error": "Both name and message are required."}, status=400)
    
    new_entry = Test.objects.create(name=name, message=message)
    print(f"Inserted: {new_entry.name}, {new_entry.message}")

    return Response({"success": True, "name": name, "message": message})
