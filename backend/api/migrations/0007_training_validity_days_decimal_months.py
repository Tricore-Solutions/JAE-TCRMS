from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_training_archive'),
    ]

    operations = [
        migrations.AddField(
            model_name='training',
            name='validity_days',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='training',
            name='validity_months',
            field=models.DecimalField(
                blank=True,
                decimal_places=1,
                default=Decimal('12'),
                max_digits=4,
                null=True,
            ),
        ),
    ]
