from django.conf import settings
from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from products.views import (CategoryViewSet,
                            AreaViewSet,
                            CategoryTreesView,
                            AreaTree,
                            ProductViewSet,
                            ImagePool,)

router = DefaultRouter()

router.register(r'products', ProductViewSet)
router.register(r'areas', AreaViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = patterns('',
    url(r'^grappelli/', include('grappelli.urls')),
    url(r'^admin/', include(admin.site.urls)),

    # for browsable api
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    # for clients to obtain a token given the username and password
    url(r'^api-token-auth/', 'rest_framework.authtoken.views.obtain_auth_token'),

    #url(r'^products/', include('products.urls')),
    url(r'^api/', include(router.urls)),

    url(r'^api/category-trees/$',    CategoryTreesView.as_view()),

    url(r'^api/areas-tree/(?P<pk>[^/.]+)/$',    AreaTree.as_view()),

    url(r'^api/accounts/',      include('accounts.urls')),

    url(r'^api/image-pool/$', ImagePool.as_view()),
) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
