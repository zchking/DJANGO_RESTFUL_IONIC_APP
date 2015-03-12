# -*- coding: utf-8 -*-
# django imports
from django.db import models
from django.utils.translation import ugettext_lazy as _
from jsonfield import JSONField
from accounts.models import User


class Area(models.Model):
    name = models.CharField(max_length=255, verbose_name=_("名称"))
    parent = models.ForeignKey("self", verbose_name=_("所属"), null=True,
                               related_name="children")
    tags = models.CharField(max_length=255, verbose_name=_("标识"), choices=(
        ('province', '省'),
        ('city', '市'),
        ('district', '区'),
        ('street', '街道'),))
    level = models.IntegerField(verbose_name=_("层级"))

    def __str__(self):
        return self.name

    def to_representation(self):
        print('handle node:', self.id)

        def _gen_node(v):
            return {
                'id': v.id,
                'name': v.name,
                'parent': _gen_node(v.parent) if v.parent else None,
            }
        return _gen_node(self)

    def to_tree_representation(self):
        print('handle node:', self.id)

        def _gen_node(v):
            return {
                'id': v.id,
                'name': v.name,
                'level': v.level,
                'tags': v.tags,
                'children': [_gen_node(child) for child in Area.objects.filter(parent=v)],
            }
        return _gen_node(self)

    @property
    def descendants(self):
        '''所有后代节点(考虑短暂缓存)

        Returns:
            [Area]
        '''
        descendants = []

        def _append_children(n):
            for c in n.children.all():
                descendants.append(c)
                _append_children(c)

        _append_children(self)

        return descendants

    class Meta:
        verbose_name = "区域"
        verbose_name_plural = "区域"


class Category(models.Model):
    name = models.CharField(max_length=255, verbose_name=_("名称"))
    parent = models.ForeignKey("self", verbose_name=_("所属"),
                               related_name="children", null=True, blank=True)
    # NOTE: tags作何用?
    tags = models.CharField(max_length=255, verbose_name=_("标签"))
    level = models.IntegerField(verbose_name=_("层级"))

    def __str__(self):
        return self.name

    def to_tree_representation(self):
        def _gen_node(v):
            return {
                'id': v.id,
                'name': v.name,
                'level': v.level,
                'tags': v.tags,
                'children': [_gen_node(child) for child in
                             Category.objects.filter(parent=v)],
            }
        return _gen_node(self)

    class Meta:
        verbose_name = verbose_name_plural = "分类目录"
        ordering = ('level',)


# Create your models here.
class Product(models.Model):
    """
    Product object
    """
    owner    = models.ForeignKey(User, verbose_name =_("物品主人"))
    title    = models.CharField(verbose_name=_("物品名称"), max_length=200)
    category = models.ForeignKey(Category, verbose_name=_("物品类别"))
    source   = models.CharField(verbose_name=_("物品来源"), max_length=200,
                                default='个人',
                                choices=(('个人', '个人'),
                                         ('商家', '商家'),))
    brand    = models.CharField(verbose_name=_("品牌型号"), max_length=200)
    hascert  = models.BooleanField(verbose_name=_("有无凭证"), default=False)
    oldornew = models.CharField(verbose_name=_("新旧程度"), max_length=200,
                                choices=(('全新', '全新'),
                                         ('9成新', '9成新'),
                                         ('7-8成新', '7-8成新'),
                                         ('比较旧', '比较旧'),))
    qgp      = models.CharField(verbose_name="保质期(食品必填)", max_length=200, blank=True)
    reason   = models.CharField(verbose_name=_("卖出原因"), default='不用了', max_length=400)
    content  = models.CharField(verbose_name=_("其它"), max_length=1000, blank=True)
    price    = models.DecimalField(verbose_name='出价', max_digits=10, decimal_places=4)
    cost     = models.DecimalField(verbose_name='原价', max_digits=10, decimal_places=4)
    # FIXME: how to allow multiple images?
    images   = JSONField(_("相关图片"), default='[]', max_length=1000, blank=True)
    address  = models.ForeignKey(Area, verbose_name=_("物品地址"),
                                 default=310000 # 上海市
                                 )

    # 不作为开放字段
    creation_date = models.DateTimeField(_("创建时间"), auto_now_add=True)
    modification_date = models.DateTimeField(_("修改时间"), auto_now=True, auto_now_add=True)

    # NOTE: 下架产品即设置public=False, 然后让用户选择下架原因,
    # 如果下架原因是"已成交", 则同时设置completed=True
    public      = models.BooleanField(verbose_name=_("是否发布"), default=True)
    # 设置 public=True 时更新 pubdate
    pubdate     = models.DateTimeField(_("上架时间"), auto_now_add=True)
    offreason   = models.CharField(verbose_name=_("下架原因"), max_length=200, blank=True)
    completed   = models.BooleanField(verbose_name="是否成交", default=False)

    passed   = models.BooleanField(verbose_name=_("是否通过审核"), default=False)
    pv       = models.IntegerField(verbose_name=_("访问量"), default=99, blank=True)

    def owner_name(self):
        return self.owner.username
    owner_name.short_description = '物品主人'

    def is_available(self):
        return self.public and self.passed and (not self.completed)

    class Meta:
        verbose_name = verbose_name_plural = "二手物品信息"

    def __str__(self):
        return 'Product(%s)' % self.pk
