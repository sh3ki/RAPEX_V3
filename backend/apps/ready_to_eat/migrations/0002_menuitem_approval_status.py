from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ready_to_eat', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='menuitem',
            name='approval_status',
            field=models.CharField(
                choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')],
                db_index=True,
                default='PENDING',
                max_length=20,
            ),
        ),
    ]
