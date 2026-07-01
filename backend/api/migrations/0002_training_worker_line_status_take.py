from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='training',
            name='worker_line_status',
            field=models.CharField(
                choices=[('On Line', 'On Line'), ('Off Line', 'Off Line')],
                default='On Line',
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name='training',
            name='take',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
