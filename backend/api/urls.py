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
    path('trainings/meta/titles', trainings.training_titles),
    path('trainings/archived', trainings.archived_trainings),
    path('trainings/bulk-archive', trainings.bulk_archive_trainings),
    path('trainings/bulk-restore', trainings.bulk_restore_trainings),
    path('trainings/bulk-delete', trainings.bulk_delete_trainings),
    path('trainings/import', trainings.import_trainings),
    path('trainings/<int:pk>/restore', trainings.restore_training),
    path('trainings/<int:pk>/delete-permanent', trainings.delete_archived_training),
    path('trainings', trainings.training_list_create),
    path('trainings/<int:pk>', trainings.training_detail),

    path('users', users.user_list_create),
    path('users/<int:pk>', users.user_detail),

    path('reports/overview', reports.overview),
    path('reports/by-category', reports.by_category),
    path('reports/by-factory', reports.by_factory),
    path('reports/expiring', reports.expiring),
    path('reports/audit-logs', reports.audit_logs),
    path('reports/audit-logs/<str:table_name>/<int:record_id>', reports.record_audit_logs),
    path('reports/export/trainings', reports.export_trainings),
    path('reports/takes-per-month', reports.takes_per_month),

    path('public/employees', public.public_employees),
    path('public/employees/<int:pk>/trainings', public.public_employee_trainings),
    path('public/training-titles', public.public_training_titles),
]
