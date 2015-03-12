# -*- coding: utf-8 -*-
from django.contrib import admin
from products.models import Product, Area, Category


class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner_name', 'address', 'reason', 'pv', 'passed')
    #fields = ('title', 'category', 'brand', 'reason', 'pv', 'address')
    #readonly_fields = ['owner']
    raw_id_fields = ("address",)
    search_fields = ['title']
    list_filter = ['owner', 'pubdate']

    def make_published(self, request, queryset):
        """Batch Update the status of the wiki entry recommend
        """
        queryset.update(passed=True)

    def cancel_published(self, request, queryset):
        """Batch Update the status of the wiki entry recommend
        """
        queryset.update(passed=False)

    #Batch Update the status of the wiki entry published
    actions = ('make_published','cancel_published')
    make_published.short_description    = "(P)通过审核"
    cancel_published.short_description  = "(D)审核拒绝"


class AreaAdmin(admin.ModelAdmin):
    def save_model(self, request, obj, form, change):
        obj.level = obj.parent.level + 1
        obj.save()

    search_fields = ['name', 'tags', 'parent__name']
    list_display = ('name', 'tags','level')
    fields = ('name', 'parent', 'tags')
    raw_id_fields = ['parent']
    ordering = ['level']


class CategoryAdmin(admin.ModelAdmin):
    def save_model(self, request, obj, form, change):
        obj.level = (obj.parent.level + 1) if obj.parent else 0
        obj.save()

    search_fields = ['name', 'tags']
    list_display = ('name', 'parent','level')
    fields = ('name', 'parent', 'tags')
    list_filter = ('parent',)
    #raw_id_fields = ['parent']


admin.site.register(Product, ProductAdmin)
admin.site.register(Area, AreaAdmin)
admin.site.register(Category, CategoryAdmin)


