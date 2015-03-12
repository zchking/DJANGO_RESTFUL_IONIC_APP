# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_auto_20150223_2340'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='images',
            field=jsonfield.fields.JSONField(verbose_name='相关图片', max_length=1000, default='[]', blank=True),
            preserve_default=True,
        ),
    ]
