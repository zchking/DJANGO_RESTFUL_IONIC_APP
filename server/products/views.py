import django_filters
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from rest_framework import mixins
from rest_framework import viewsets
from rest_framework import filters
from rest_framework import permissions
from rest_framework import metadata
from rest_framework.views import APIView
from rest_framework.decorators import detail_route, list_route
from rest_framework.parsers import FileUploadParser
from products.models import Area, Category, Product
from products.serializers import (ProductSerializer,
                                  CategorySerializer,
                                  AreaSerializer,
                                  CategoryTreeSerializer,
                                  AreaTreeSerializer,
                                  ProductImageSerializer,)
from products.permissions import IsOwnerOrReadOnly


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    paginate_by = 0


class CategoryTreesView(generics.ListAPIView):
    '''返回分类目录的多根树'''
    queryset = Category.objects.filter(parent=None)
    serializer_class = CategoryTreeSerializer
    paginate_by = 0


class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    paginate_by = 0
    filter_fields = ('id', 'name', 'tags', 'level',)
    search_fields = ('name', 'parent__name', 'parent__parent__name')
    ordering_fields = ('level',)


class AreaTree(generics.RetrieveAPIView):
    queryset = Area.objects.all()
    serializer_class = AreaTreeSerializer

    #def get(self, request, *args, **kwargs):
    #    import pdb; pdb.set_trace()


def _address_belong(qs, id):
    '''用来查询所有id对应的区域及**下属区域**的产品'''
    top = Area.objects.get(pk=id)
    areas = [top] + top.descendants
    return qs.filter(address__in=areas)

class ProductFilter(django_filters.FilterSet):
    address = django_filters.NumberFilter(name='address__parent', action=_address_belong)

    class Meta:
        model = Product
        fields = ('price', 'owner', 'category', 'address',
                  'public', 'completed', 'passed', 'fans')

class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows products to be viewed or edited.
    """
    metadata_class = metadata.SimpleMetadata
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,
                          IsOwnerOrReadOnly,)
    ordering = ('-pubdate', 'price')
    #filter_fields = ('price', 'owner', 'category', 'address')
    filter_class = ProductFilter
    search_fields = ('title', 'content')

    #def get_queryset(self):
    #    return []

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ImagePool(APIView):
    '''
    图片上传服务
    '''

    # 前端目前使用的`nervgh/angular-file-upload`没有和现有认证机制集成,
    # 所以暂时忽略图片上传的认证
    permission_classes = ()
    parser_classes = (FileUploadParser,)
    serializer_class = ProductImageSerializer

    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            return Response(serializer.save())
