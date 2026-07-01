from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_training_worker_line_status_take'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='last_name',
            field=models.CharField(default='', max_length=100),
        ),
        migrations.AddField(
            model_name='employee',
            name='first_name',
            field=models.CharField(default='', max_length=100),
        ),
        migrations.AddField(
            model_name='employee',
            name='middle_initial',
            field=models.CharField(blank=True, default='', max_length=10),
        ),
    ]
