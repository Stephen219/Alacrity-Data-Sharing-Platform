from django.db import models


## This is the model for the dataset table in the database holding the dataset information.
class Dataset(models.Model):
    id = models.AutoField(primary_key=True)
   #orgid = models.ForeignKey(Organization, on_delete=models.CASCADE) this is the foreign key to the organization table it will be uncommented when the organization table is created
   #uploaderid = models.ForeignKey(User, on_delete=models.CASCADE) this is the foreign key to the user table it will be uncommented when the user table is created 
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    link = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return self.name
