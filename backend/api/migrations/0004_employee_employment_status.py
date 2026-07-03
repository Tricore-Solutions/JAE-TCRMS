from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_employee_name_parts'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='employment_status',
            field=models.CharField(
                blank=True,
                choices=[
                    ('FAMSI - Proby', 'FAMSI - Proby'),
                    ('FAMSI - Reg', 'FAMSI - Reg'),
                    ('MDHII - Proby', 'MDHII - Proby'),
                    ('MDHII - Reg', 'MDHII - Reg'),
                    ('Regular - JAE', 'Regular - JAE'),
                ],
                default='',
                max_length=50,
            ),
        ),
    ]
