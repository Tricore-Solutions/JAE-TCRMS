from rest_framework import serializers

from api.models import AuditLog, Employee, Training, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'role', 'status', 'created_at']
        read_only_fields = fields


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(max_length=255, required=False, default='')
    role = serializers.ChoiceField(choices=['admin', 'encoder', 'viewer'])


class UserUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255, required=False)
    role = serializers.ChoiceField(choices=['admin', 'encoder', 'viewer'], required=False)
    status = serializers.ChoiceField(choices=['active', 'inactive'], required=False)
    password = serializers.CharField(write_only=True, required=False)


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'last_name', 'first_name', 'middle_initial',
            'full_name', 'factory', 'line', 'team',
            'position', 'employment_status', 'status', 'hire_date', 'created_at', 'updated_at',
        ]


class TrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = [
            'id', 'employee_id', 'title', 'category', 'training_date', 'trainer',
            'validity_months', 'expiration_date', 'process_classification',
            'remarks', 'worker_line_status', 'take', 'created_by', 'created_at', 'updated_at',
        ]


class TrainingListSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    emp_code = serializers.CharField(source='employee.employee_id', read_only=True)
    factory = serializers.CharField(source='employee.factory', read_only=True)
    line = serializers.CharField(source='employee.line', read_only=True)
    team = serializers.CharField(source='employee.team', read_only=True)

    class Meta:
        model = Training
        fields = [
            'id', 'employee_id', 'title', 'category', 'training_date', 'trainer',
            'validity_months', 'expiration_date', 'process_classification',
            'remarks', 'worker_line_status', 'take', 'created_by', 'created_at', 'updated_at',
            'employee_name', 'emp_code', 'factory', 'line', 'team',
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'table_name', 'record_id', 'details', 'created_at', 'full_name']

    def get_full_name(self, obj):
        from api.utils import user_display_name
        return user_display_name(obj.user, obj.username)
