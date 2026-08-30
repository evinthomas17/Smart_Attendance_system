from django.urls import path

from .views import (
    ClassDeviceListCreateAPIView,
    ClassDeviceRetrieveUpdateDestroyAPIView,
    ClassroomListCreateAPIView,
    ClassroomRetrieveUpdateDestroyAPIView,
    DeviceListCreateAPIView,
    DeviceRegistrationAPIView,
    DeviceRetrieveUpdateDestroyAPIView,
)

urlpatterns = [
    path("devices/register/", DeviceRegistrationAPIView.as_view(), name="device-register"),
    path("devices/", DeviceListCreateAPIView.as_view(), name="device-list-create"),
    path(
        "devices/<int:device_id>/",
        DeviceRetrieveUpdateDestroyAPIView.as_view(),
        name="device-detail",
    ),
    path("classrooms/", ClassroomListCreateAPIView.as_view(), name="classroom-list-create"),
    path(
        "classrooms/<int:classroom_id>/",
        ClassroomRetrieveUpdateDestroyAPIView.as_view(),
        name="classroom-detail",
    ),
    path("classes/", ClassDeviceListCreateAPIView.as_view(), name="class-device-list-create"),
    path(
        "classes/<int:class_id>/",
        ClassDeviceRetrieveUpdateDestroyAPIView.as_view(),
        name="class-device-detail",
    ),
]
