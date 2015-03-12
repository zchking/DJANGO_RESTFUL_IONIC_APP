#!/usr/bin/env python
# coding=utf-8
from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from products.models import Product, Area, Category
from accounts.models import User


class UserBasisSerializer(serializers.ModelSerializer):
    '''
    Basis of `User`, used to nested in product data
    '''
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone_number',
                  'weixin_id', 'weixin_veri_mark')


class CategoryField(serializers.RelatedField):
    def to_representation(self, v):
        return {
            'id': v.id,
            'name': v.name,
        }

    def to_internal_value(self, v):
        return Category.objects.get(pk=v)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category


class CategoryTreeSerializer(serializers.Serializer):
    def to_representation(self, v):
        return v.to_tree_representation()


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ('id', 'name', 'tags')


class AreaTreeSerializer(serializers.Serializer):
    def to_representation(self, v):
        return v.to_tree_representation()


class AreaField(serializers.RelatedField):
    def to_representation(self, v):
        print("AreaField represented as:", v)
        return v.to_representation()

    def to_internal_value(self, v):
        print("AreaField Got input:", v)

        pk = None

        if isinstance(v, (int, str)):
            pk = v
        elif isinstance(v, dict) and 'id' in v:
            pk = v['id']

        if not pk or (isinstance(pk, str) and not pk.isdigit()):
            raise ValidationError("Invalid value for address: %s" % v)

        return Area.objects.get(pk=pk)


class JSONSerializerField(serializers.Field):
    """Serializer for JSONField -- required to make field writable

    Refer to: http://stackoverflow.com/questions/22434869/django-rest-framework-and-jsonfield
    """
    def to_internal_value(self, data):
        return data

    def to_representation(self, value):
        return value


class ProductSerializer(serializers.ModelSerializer):
    #owner_name = serializers.ReadOnlyField(source='owner.username')
    owner = UserBasisSerializer(read_only=True)
    # NOTE&FIXME: What does queryset really means? Under browsable api interface,
    # this leads `rest_framework.RelatedField.choices` to traverse the queryset
    #address = serializers.PrimaryKeyRelatedField(queryset=Area.objects.all())
    address = AreaField(queryset=Area.objects.none())
    #category = CategoryField(queryset=Category.objects.all())
    images = JSONSerializerField()

    class Meta:
        model = Product


class ProductImageSerializer(serializers.Serializer):
    file = serializers.ImageField(max_length=200)

    def create(self, validated_data):
        import base64
        import os.path as op
        import time
        import random
        from django.utils.text import slugify

        image = validated_data['file']

        root, ext = op.splitext(image.name)

        if not slugify(root).upper() == root.upper():
            root = base64.urlsafe_b64encode(root.encode()).decode().rstrip('=')

        # 转换过的文件名
        converted_name = '%s-%s%s' % (root[:100], time.time(), ext.lower())
        realpath = op.join(settings.PRODUCT_IMAGES_ROOT, converted_name)

        if op.exists(realpath):
            raise RuntimeError('%s exists' % realpath)

        with open(realpath, 'wb') as dest:
            for chunk in image.chunks():
                dest.write(chunk)

        # 制造时间消耗, 方便观察
        if settings.DEBUG:
            time.sleep(random.uniform(0,3))

        return {
            'name': converted_name,
        }
