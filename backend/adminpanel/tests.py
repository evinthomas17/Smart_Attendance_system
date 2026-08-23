from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class AdminPanelAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com", password="secure-password", role="ADMIN"
        )
        self.student_user = User.objects.create_user(
            email="student@example.com", password="secure-password", role="STUDENT"
        )

    def test_only_admins_can_access_the_dashboard(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(reverse("admin-dashboard"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("admin-dashboard"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_creates_student_user(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("admin-create-student"),
            {"email": "new.student@example.com", "password": "secure-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="new.student@example.com")
        self.assertEqual(user.role, "STUDENT")

        self.client.force_authenticate(user=None)
        login_response = self.client.post(
            reverse("login"),
            {"email": user.email, "password": "secure-password"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data["user"]["role"], "STUDENT")

    def test_admin_creates_faculty_user(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("admin-create-faculty"),
            {"email": "new.faculty@example.com", "password": "secure-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="new.faculty@example.com")
        self.assertEqual(user.role, "FACULTY")

        self.client.force_authenticate(user=None)
        login_response = self.client.post(
            reverse("login"),
            {"email": user.email, "password": "secure-password"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data["user"]["role"], "FACULTY")
