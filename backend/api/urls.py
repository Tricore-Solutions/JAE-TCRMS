from django.urls import path

from api.views import auth, employees, public, reports, trainings, users

urlpatterns = [
    path('auth/login', auth.login),
    path('auth/me', auth.me),
    path('auth/logout', auth.logout),

    path('employees/meta/filters', employees.employee_filters),
    path('employees', employees.employee_list_create),
    path('employees/<int:pk>', employees.employee_detail),

    path('trainings/summary', trainings.training_summary),
    path('trainings/meta/categories', trainings.training_categories),
    path('trainings', trainings.training_list_create),
    path('trainings/<int:pk>', trainings.training_detail),

    path('users', users.user_list_create),
    path('users/<int:pk>', users.user_detail),

    path('reports/overview', reports.overview),
    path('reports/by-category', reports.by_category),
    path('reports/by-factory', reports.by_factory),
    path('reports/expiring', reports.expiring),
    path('reports/audit-logs', reports.audit_logs),
    path('reports/export/trainings', reports.export_trainings),

    path('public/employees', public.public_employees),
]
