from django.test import TestCase
from alacrity_backend.models import Test

class Test(TestCase):
    def test_example(self):
        self.assertEqual(1 + 1, 2)
