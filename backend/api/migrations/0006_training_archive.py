from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_alter_training_worker_line_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='training',
            name='is_archived',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='training',
            name='archived_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
