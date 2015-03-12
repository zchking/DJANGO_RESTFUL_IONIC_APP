# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Area',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, verbose_name='ID', auto_created=True)),
                ('name', models.CharField(verbose_name='名称', max_length=255)),
                ('tags', models.CharField(verbose_name='标识', max_length=255)),
                ('level', models.IntegerField(verbose_name='层级', max_length=2)),
                ('parent', models.ForeignKey(verbose_name='所属', null=True, related_name='children', to='products.Area')),
            ],
            options={
                'verbose_name_plural': '区域',
                'verbose_name': '区域',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, verbose_name='ID', auto_created=True)),
                ('name', models.CharField(verbose_name='名称', max_length=255)),
                ('tags', models.CharField(verbose_name='标签', max_length=255)),
                ('level', models.IntegerField(verbose_name='层级', max_length=2)),
                ('parent', models.ForeignKey(verbose_name='所属', null=True, related_name='children', to='products.Category')),
            ],
            options={
                'verbose_name_plural': '分类目录',
                'verbose_name': '分类目录',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, verbose_name='ID', auto_created=True)),
                ('title', models.CharField(verbose_name='物品名称', max_length=200)),
                ('source', models.CharField(verbose_name='物品来源', max_length=200)),
                ('brand', models.CharField(verbose_name='品牌型号', max_length=200)),
                ('hascert', models.BooleanField(verbose_name='有无凭证', default=False)),
                ('oldornew', models.CharField(verbose_name='新旧程度', max_length=200)),
                ('qgp', models.CharField(verbose_name='保质期(食品必填)', max_length=200, blank=True)),
                ('reason', models.CharField(verbose_name='卖出原因', max_length=400)),
                ('content', models.CharField(verbose_name='其它', max_length=400, blank=True)),
                ('price', models.DecimalField(verbose_name='出价', max_digits=10, decimal_places=4)),
                ('cost', models.DecimalField(verbose_name='原价', max_digits=10, decimal_places=4)),
                ('images', models.CharField(verbose_name='相关图片', max_length=1000, blank=True)),
                ('creation_date', models.DateTimeField(verbose_name='创建时间', auto_now_add=True)),
                ('modification_date', models.DateTimeField(verbose_name='修改时间', auto_now=True, auto_now_add=True)),
                ('public', models.BooleanField(verbose_name='是否发布', default=False)),
                ('pubdate', models.DateTimeField(verbose_name='上架时间', auto_now_add=True)),
                ('offreason', models.CharField(verbose_name='下架原因', max_length=200, blank=True)),
                ('completed', models.BooleanField(verbose_name='是否成交', default=False)),
                ('passed', models.BooleanField(verbose_name='是否通过审核', default=False)),
                ('pv', models.IntegerField(verbose_name='访问量', default=99, blank=True)),
                ('address', models.ForeignKey(verbose_name='物品地址', to='products.Area')),
                ('category', models.ForeignKey(verbose_name='物品类别', to='products.Category')),
                ('owner', models.ForeignKey(verbose_name='物品主人', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name_plural': '二手物品信息',
                'verbose_name': '二手物品信息',
            },
            bases=(models.Model,),
        ),
    ]
