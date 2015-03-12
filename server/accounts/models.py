from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token

class User(AbstractUser):
    '''
    Refer to: [Extending Django’s default User](
    https://docs.djangoproject.com/en/1.7/topics/auth/customizing/#extending-django-s-default-user)

    NOTE: 为了与createsuperuser兼容, 定制字段均 `null=True`.
    '''
    # TODO: add validator to phone_number
    phone_number = models.CharField(verbose_name='电话号码', max_length=15,
                                    null=True, blank=True)
    weixin_id = models.CharField(verbose_name='微信号', max_length=100,
                                 null=True, blank=False)
    weixin_veri_mark = models.CharField(verbose_name='微信暗号', max_length=100,
                                 null=True, blank=False)
    address = models.ForeignKey('products.Area', verbose_name="地址",
                               null=True, blank=True)
    shop_name   = models.CharField(verbose_name='店铺名', max_length=200,
                                   null=True, blank=True) # 默认为 "XX的盘子"
    shop_desc   = models.CharField(verbose_name='店铺介绍', max_length=1000,
                                   null=True, blank=True)
    shop_notice = models.CharField(verbose_name='店铺公告', max_length=1000,
                                   null=True, blank=True)

    favors = models.ManyToManyField('products.Product', verbose_name='收藏', related_name='fans')

    #REQUIRED_FIELDS = ['phone_number', 'email']

    class Meta:
        db_table = 'accounts_user'
        verbose_name = verbose_name_plural = "用户"
        pass


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    '''automatically generated Token for every new user'''
    if created:
        Token.objects.create(user=instance)
