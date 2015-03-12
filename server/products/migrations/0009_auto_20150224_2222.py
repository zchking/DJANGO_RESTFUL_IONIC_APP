# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0008_auto_20150224_1901'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='public',
            field=models.BooleanField(default=True, verbose_name='是否发布'),
            preserve_default=True,
        ),
    ]
