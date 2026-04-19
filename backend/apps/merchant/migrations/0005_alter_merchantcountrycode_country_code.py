from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('merchant', '0004_alter_merchantdocument_document_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='merchantcountrycode',
            name='country_code',
            field=models.CharField(max_length=8),
        ),
    ]
