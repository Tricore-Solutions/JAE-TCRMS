from django.db import models


class User(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('encoder', 'Encoder'),
        ('viewer', 'Viewer'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    username = models.CharField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=128)
    full_name = models.CharField(max_length=255, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username


class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('resigned', 'Resigned'),
    ]

    employee_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    factory = models.CharField(max_length=100, default='')
    line = models.CharField(max_length=100, default='')
    team = models.CharField(max_length=100, default='')
    position = models.CharField(max_length=100, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    hire_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employees'
        indexes = [
            models.Index(fields=['status'], name='idx_employees_status'),
        ]

    def __str__(self):
        return f'{self.employee_id} — {self.full_name}'


class Training(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='trainings',
        db_column='employee_id',
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='')
    training_date = models.DateField()
    trainer = models.CharField(max_length=255, default='')
    validity_months = models.PositiveIntegerField(default=12)
    expiration_date = models.DateField(null=True, blank=True)
    process_classification = models.CharField(max_length=255, default='')
    remarks = models.TextField(default='')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_trainings',
        db_column='created_by',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trainings'
        indexes = [
            models.Index(fields=['employee'], name='idx_trainings_employee'),
            models.Index(fields=['expiration_date'], name='idx_trainings_expiration'),
        ]

    def __str__(self):
        return self.title


class AuditLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        db_column='user_id',
    )
    username = models.CharField(max_length=150, null=True, blank=True)
    action = models.CharField(max_length=50)
    table_name = models.CharField(max_length=100)
    record_id = models.BigIntegerField(null=True, blank=True)
    details = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['-created_at'], name='idx_audit_created'),
        ]

    def __str__(self):
        return f'{self.action} on {self.table_name}'
