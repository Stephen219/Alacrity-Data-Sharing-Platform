from django.test import TestCase
from alacrity_backend.models import Test


"""
This file contains the tests for the models in the database. The tests are used to check if the models are working as expected
this is a test model for the root applicstion
it can be deleted


"""

class Test(TestCase):
    def test_example(self):
        self.assertEqual(1 + 1, 2)
