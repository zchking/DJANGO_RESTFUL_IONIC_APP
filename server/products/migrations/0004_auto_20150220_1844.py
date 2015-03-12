# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_auto_20150219_2127'),
    ]

    operations = [
        migrations.AlterField(
            model_name='category',
            name='level',
            field=models.IntegerField(verbose_name='层级'),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='product',
            name='oldornew',
            field=models.CharField(max_length=200, verbose_name='新旧程度', choices=[('全新', '全新'), ('9成新', '9成新'), ('7-8成新', '7-8成新'), ('比较旧', '比较旧')]),
            preserve_default=True,
        ),
    ]
