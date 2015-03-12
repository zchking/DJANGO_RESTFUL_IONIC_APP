# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_auto_20150217_0217'),
    ]

    operations = [
        migrations.AlterField(
            model_name='area',
            name='level',
            field=models.IntegerField(verbose_name='层级'),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='area',
            name='tags',
            field=models.CharField(max_length=255, verbose_name='标识', choices=[('province', '省'), ('city', '市'), ('district', '区'), ('street', '街道')]),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='product',
            name='address',
            field=models.ForeignKey(verbose_name='物品地址', default=310000, to='products.Area'),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='product',
            name='source',
            field=models.CharField(max_length=200, verbose_name='物品来源', default='个人', choices=[('个人', '个人'), ('商家', '商家')]),
            preserve_default=True,
        ),
    ]
