from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fresh_market', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='freshmarketproduct',
            name='approval_status',
            field=models.CharField(
                choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')],
                db_index=True,
                default='PENDING',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='freshmarketproduct',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='freshmarketproduct',
            name='stock_qty',
            field=models.IntegerField(default=0),
        ),
    ]
