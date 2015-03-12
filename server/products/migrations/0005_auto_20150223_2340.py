# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0004_auto_20150220_1844'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='images',
            field=jsonfield.fields.JSONField(blank=True, verbose_name='相关图片', max_length=1000),
            preserve_default=True,
        ),
    ]
