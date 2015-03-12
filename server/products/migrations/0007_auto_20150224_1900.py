# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0006_auto_20150224_1044'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='reason',
            field=models.CharField(max_length=400, default='不用了', verbose_name='卖出原因'),
            preserve_default=True,
        ),
    ]
