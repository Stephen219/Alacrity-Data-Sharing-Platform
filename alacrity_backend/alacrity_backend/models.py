"""
This file contains the models for the database. The models are used to create the tables in the databasee
this is a test model for the root applicstion
it can be deleted
"""
from django.db import models

class Test(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    message = models.TextField()



    def __str__(self):
        return self.name
