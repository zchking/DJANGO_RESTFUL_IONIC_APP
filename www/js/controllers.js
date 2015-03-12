angular.module('frontpage.controllers', [ /*'ionic.services.analytics',*/ 'angularFileUpload', 'ngCookies', 'http-auth-interceptor', 'validation.match' ])

.controller('CitySwitchCtrl', function($scope, Area, Location, $ionicModal) {
    /** 控制城市的切换
     */

    $scope.ctrlData = {
        searchText: null,
    };

    // 当前城市
    $scope.currentCity = Location.getCity();

    // 切换城市
    $scope.setCurrentCity = function(city) {
        $scope.currentCity = city;
        Location.setLocation(city);
    };

    // 热门城市
    $scope.hotCities = ['北京', '上海', '广州', '深圳',
                        '天津', '成都', '武汉', '西安'];

    // 首先从服务器加载全部城市数据, 后续不再请求服务器
    // TODO:
    // 1. UI方面, 关键词输入省份, 也可以得到下面的城市选项
    // 2. 拼音查询, 模糊查询
    Area.find({tags: 'city'}).then(function(allCities) {
        console.info('load all cities', allCities);

        // 所有城市
        $scope.Allcities = allCities;

        // 城市选项
        $scope.cities = allCities.filter(function(c) {
            for (idx in $scope.hotCities) {
                if(c.name.indexOf($scope.hotCities[idx]) >= 0) {
                    return true
                }
            }
            return false;
        });

        $scope.$watch('ctrlData.searchText', function() {
            var searchText = ($scope.ctrlData.searchText || '').trim()
            if (searchText){
                console.info('Filtering cities with', searchText);
                $scope.cities = $scope.Allcities.filter(function(c) {
                    return c.name.indexOf(searchText) >= 0;
                });
            }
        });
    });

    // 城市切换UI
    $ionicModal.fromTemplateUrl('templates/city-switch.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.activateCitySwitch = function() {
            console.info('activate city switch.');
            modal.show();
        };

        $scope.deactivateCitySwitch = function() {
            console.info('deactivate city switch.');
            modal.hide();
        };

        $scope.selectCity = function(city) {
            $scope.setCurrentCity(city);
            $scope.deactivateCitySwitch();
        };
    });
})

.controller('MainCtrl', function($rootScope, $scope, $state, /*$ionicTrack,*/ $http,
                                 cfpLoadingBar, $window, $ionicConfig, $cookieStore,
                                 $ionicHistory, Location, $ionicModal) {
    console.info("Got in MainCtrl", $state);
    $scope.$state = $state;
    $scope.$ionicHistory = $ionicHistory;

    // 是否当前navVIew历史的顶层
    $rootScope.isTopOfCurrentHistory = function() {
        var currentHistoryId = $ionicHistory.currentHistoryId();
        var allHistories = $ionicHistory.viewHistory().histories;
        var currentHistory = allHistories[currentHistoryId];

        function isFromSameHistory() {
            // NOTE: 如果是从别的历史线中斜插进来,
            // 这里视为当前history头部被重置.
            if (currentHistory.cursor < 1) {
                return false;
            } else {
                var curView = currentHistory.stack[currentHistory.cursor];
                var prevView = currentHistory.stack[currentHistory.cursor -1];
                return curView.backViewId === prevView.viewId;
            }
        };

        var res = (!currentHistoryId) ||
            currentHistory.cursor < 1 ||
            !isFromSameHistory();
        console.info('isTopOfCurrentHistory:', res,
                    currentHistoryId, allHistories);
        return res;
    };

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams) {
        console.info('Got in state', toState, ';',
                     'currentHistoryId', $ionicHistory.currentHistoryId(), ';',
                     'viewHistory', $ionicHistory.viewHistory(), ';'
                    );
    });

    $scope.open = function(url) {
        // Send event to analytics service
        //$ionicTrack.track('open', {
        //    url: url
        //});
        $ionicConfigProvider.platform.android.tabs.position("bottom");
        // open the page in the inAppBrowser plugin. Falls back to a blank page if the plugin isn't installed
        var params = 'location=no,' +
            'enableViewportScale=yes,' +
            'toolbarposition=top,' +
            'closebuttoncaption=Done';
        var iab = window.open(url, '_blank', params);
        // cordova tends to keep these in memory after they're gone so we'll help it forget
        iab.addEventListener('exit', function() {
            iab.removeEventListener('exit', argument.callee);
            iab.close();
            iab = null;
        });
    };

    // FIXME: 下面的认证状态维护相关的代码要从MainCtrl移除,
    // 放到适合初始化的地方
    if ($cookieStore.get('djangotoken')) {
        console.info('Authorization Token has stored in cookie previously');
        $http.defaults.headers.common['Authorization'] = 'Token ' + $cookieStore.get('djangotoken');
    } else {} // non-login state

    // 需要登陆的URL
    $rootScope.stateRequiringLogin = null;

    var loginRequiredHandler = function(state) {
        /**
         * param state: the state requiring login, otherwise the current state
         */

        var targetState = state || $state.current;
        console.log("Login required by:", targetState);
        $rootScope.stateRequiringLogin = targetState.name;
        $state.go('login');
    };

    $scope.$on('event:auth-loginRequired', function(event, state) {
        loginRequiredHandler(state);
    });
    $scope.$on('event:auth-forbidden', function() {
        loginRequiredHandler();
    });

    $scope.$on('event:auth-loginConfirmed', function() {
        var target;

        if($rootScope.firstLoginAfterRegister) {
            target = 'account.center';
            $rootScope.firstLoginAfterRegister = false;
        } else {
            target = $rootScope.stateRequiringLogin || 'tab.products';
        }

        console.info('Authenticated, go to target state:', target);
        $state.go(target);
    });

    //make sure we always clear any existing loading bars before navigation
    $scope.$on('$ionicView.beforeLeave', function() {
        cfpLoadingBar.complete();
    });

    var halfHeight = null;
    $scope.getHalfHeight = function() {
        if (ionic.Platform.isAndroid()) return 0;
        if (!halfHeight) {
            halfHeight = (document.documentElement.clientHeight / 2) - 200;
        }
        return halfHeight;
    };
})

.controller('RegisterCtrl', function($rootScope, $scope, $http, TokenAuth,
                                     $ionicModal, AccountCenter, Constants) {
    $scope.registerData = {};
    $scope.submit = function() {
        AccountCenter.register($scope.registerData)
            .success(function(response, status) {
                console.info('Register success:', response);
                // 主动型登陆设置登陆后进入的state.
                $rootScope.firstLoginAfterRegister = true;

                // 激活注册成功提示界面
                $ionicModal.fromTemplateUrl('register-success.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function(modal) {
                    modal.show();
                    $scope.OK = function() {
                        modal.hide();
                        // 自动登录
                        TokenAuth.login($scope.registerData);
                    };
                });
            })
            .error(function(response, status) {
                console.info('Register error:', response);
            });
    };

    $scope.showAgreement = function() {
        if(!$scope.agreementModal) {
            $ionicModal.fromTemplateUrl('agreement.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(agreementModal) {
                $scope.agreementModal = agreementModal;
                agreementModal.show();
            });
        } else {
            $scope.agreementModal.show();
        }
    };

    $scope.hideAgreement = function() {
        $scope.agreementModal.hide();
    };
})

.controller('SetPassword', function($scope, AccountCenter, $state) {
    $scope.ctrlData = {};
    $scope.submit = function() {
        AccountCenter.setPassword($scope.ctrlData).success(function(response) {
            console.info('setting password successfully.', response);
            $scope.serverResp = response;
            $state.go('account.center');
        }).error(function(response) {
            console.info('setting password failed.', response);
            $scope.serverResp = response;
        });
    };
})

.controller('LoginCtrl', function($scope, TokenAuth, $state) {
    $scope.$on('$ionicView.afterEnter', function() {
        if(TokenAuth.isAuthenticated()) {
            console.info('Already authenticated, no need to login.');
            $state.go('account.center');
        }
    });

    $scope.authData = {};
    $scope.login = function() {
        TokenAuth.login({
            username: $scope.authData.username,
            password: $scope.authData.password
        }).then(function() {
        }, function(reason) {
            console.error('Login failed for', reason);
            if(!reason) {
                alert('服务器异常，请稍后重试！')
            } else {
                $scope.serverError = reason;
            }
        });
    };
})

.controller('AccountCtrl', function($scope, $state, $http, AccountCenter) {
    AccountCenter.getMyAccountInfo().then(function(user){
        console.info("loaded user detail", user);
        $scope.user = user;
    });

})

.controller('UserDetail', function($scope, AccountCenter, Area) {
    // ui交互相关控制状态
    $scope.operation = {
        // editing: 是否编辑状态
        editing: false,
        areaSearchText: undefined,
        previousAreaSearchText: undefined,
        selectedArea: undefined
    };

    $scope.areas = [];

    $scope.$watch('operation.areaSearchText', function() {
        var stext = $scope.operation.areaSearchText;
        var pstext = $scope.operation.previousAreaSearchText;

        console.info(stext, pstext);
        if(stext && stext.trim() && stext.length >= 2 && stext != pstext) {
            Area.search(stext).then(function(data) {
                $scope.areas = data;
            });
            $scope.operation.previousAreaSearchText = stext;
        }
    });
    $scope.$watch('user.address', function() {
        console.info('getting area detail for', $scope.user.address);
        Area.get($scope.user.address).then(function(area) {
            $scope.operation.selectedArea = area;
        });
    });

    $scope.submit = function() {
        console.info('update userdetail with:', $scope.user);
        AccountCenter.update($scope.user);
    };
})

.controller('ProductEditCtrl', function($scope, $state, $stateParams, Constants,
                                        Location, Area, Product, Category,
                                        FileUploader) {
    // 首次发布和更新发布都用这个controller(根据是否传id区分)
    $scope.editMode = $stateParams.id? 'update': 'create';

    $scope.Number = window.Number;
    $scope.productImageURLPrefix = Constants.productImageURLPrefix;

    $scope.uploader = new FileUploader({
        url: Constants.apiImagePool,
        autoUpload: true
    });

    Product.getSchema().then(function(schema) {
        console.info('Got product shema:', schema);
        $scope.productSchema = schema;
    });

    // 分类数据
    Category.getCategoryTrees().then(function(categories) {
        $scope.categories = categories
    });

    // 维护分类选择路径
    $scope.selectedCategories = [];

    // Ugly code below!
    // to set initial value of selectedCategories from product data
    // which makes the editing-page's ui looks well
    // NOTE: can implement path function in Category service
    $scope.$watchGroup(['categories', 'product'], function() {
        if($scope.categories && $scope.categories.length
           && $scope.product && $scope.product.id) {
            //FIXME: this only needs run once!
            console.info('C&P all ready!');
            for(var i in $scope.categories) {
                var cate = $scope.categories[i];
                if(cate.id === product.category) {
                    $scope.selectedCategories.splice(0, 1, cate);
                    break;
                } else {
                    for(var j in cate.children) {
                        var child = cate.children[j];
                        if(child.id === product.category) {
                            $scope.selectedCategories.splice(0, 2, cate, child);
                            break;
                        }
                    }
                }
            }
        }
    });

    // 根据关联分类选项设置产品的分类ID
    $scope.$watchCollection('selectedCategories', function() {
        console.info('category selected');
        for(var idx in $scope.selectedCategories) {
            var c = $scope.selectedCategories[idx];
            if(!c.children.length || c.level === 1) {
                $scope.product.category = c.id;
                break;
            }
        }
    });

    // 获取或创建产品对象
    if($scope.editMode === 'update') {
        //TODO: 产品数据加载前阻止用户交互
        Product.fetchProduct($stateParams.id).then(function(data) {
            console.log('Got product from service:', product);

            //product.category = String(product.category);
            product.images = product.images || [];
            product.original_images = product.images.slice();

            $scope.product = product;
        });
    } else {
        $scope.product = {
            images: [],
            original_images: []
        };
    }

    Area.getAreaTree(Location.getCity().id).success(function(areaTree) {
        console.info('Loaded area tree', areaTree);
        $scope.areaTree = areaTree;
    });

    // 上传图片数限额
    $scope.totalImgsAllowed = 5;

    // 已经上传图片数
    $scope.uploadedImgsCount = function() {
        // 此时产品数据可能没有加载完成
        if($scope.product && $scope.product.images) {
            return $scope.product.images.length || 0;
        }
        return 0;
    }

    // 剩余可(选择)上传照片数
    $scope.remainingImgsAmount = function() {
        // 队列未完成的
        var undoneCount = $scope.uploader.queue.filter(function(e) {
            return !e.isSuccess;
        }).length;
        return $scope.totalImgsAllowed - ($scope.uploadedImgsCount() + undoneCount);
    }

    // 图片添加到队列事件
    $scope.uploader.onBeforeUploadItem = function(item) {
        var rcnt = $scope.remainingImgsAmount();
        if(rcnt < 0) {
            $scope.removeImageFromQueue(item);
        }
    };

    // 图片上传成功, 关联到产品
    $scope.uploader.onSuccessItem = function(item, response, status, headers) {
        item.file.realname = response.name;
        //FIXME: 检查响应数据判断是否真的上传成功
        $scope.product.images.push(response.name);
    };

    // 从产品中移除图片
    $scope.removeImageFromProduct = function(img) {
        var idx = $scope.product.images.indexOf(img);
        if(idx >= 0) {
            $scope.product.images.splice(idx, 1);
        }

        var idx = $scope.product.original_images.indexOf(img);
        if(idx >= 0) {
            $scope.product.original_images.splice(idx, 1);
        }
    };

    // 从上传队列中移除项目(项目可能已经成功并关联到产品, 这时要从产品中移除)
    $scope.removeImageFromQueue = function(item) {
        item.cancel();
        item.remove();
        $scope.removeImageFromProduct(item.file.realname);
    };

    $scope.publish = function() {
        console.info('publish with data', $scope.product);
        Product.publish($scope.product).success(function(product){
            console.info('Successfully published', product);
            $state.go('product-detail', {id:product.id});
        });
    };
})

.controller('ProductsCtrl', function($scope, HNFirebase, $state, cfpLoadingBar, $timeout,
                                     $ionicScrollDelegate, $ionicPopover, Location, $ionicModal,
                                     Category, Area, Product, Constants) {
        $scope.pageName = '宝库寻宝';
        $scope.productImageURLPrefix = Constants.productImageURLPrefix;
        cfpLoadingBar.start();

        /* 层级区域数据的控制

            1. 锁定区域起点(可以根据定位得到, 或者用户手动设置, 比如上海市):


            2. 根据起点获取下面的区域树

            {
                id: 111,
                name: '上海',
                children: [
                    {
                        id: 1112,
                        name: '浦东'
                    },
                    {}
                ]
            }

            3. 起点的变化触发更新区域树
        */

        //区域选择起点, TODO: 这里写死成上海, 应该根据定位得到, 或用户全局切换
        $scope.rootArea = Location.getCity();
        $scope.$on('Location.locationChanged', function(e, location) {
            console.info('Learned location changed to', location,
                         ', reset rootArea');
            $scope.rootArea = location;
        });

        $scope.orderingOptions = [
            {
                key: null,
                name: '默认排序'
            },
            {
                key: 'pubdate',
                name: '最新发布',
                reverse: true
            },
            {
                key: 'price',
                name: '价格最低',
                reverse: false
            },
            {
                key: 'price',
                name: '价格最高',
                reverse: true
            }
        ];

        $scope.filterState = {
            //TODO:
            // 1. 这部分数据做本地存储
            selectedArea: $scope.rootArea,

            // 维护分类选项, null表示全部分类
            selectedCategory: null,

            // 跟踪分类选择深度
            selectedCategoriesTrack: [],

            // 维护排序选项, null表示默认排序(即不关心排序)
            selectedOrdering: $scope.orderingOptions[0],

            searchText: null
        };

        // 选择地区
        $scope.selectArea = function(areaObj){
            //var tags = areaObj.tags;
            $scope.filterState.selectedArea = areaObj;
            $scope.openFilter = false;
            refreshProducts();
        };

        // 全局城市切换触发自动选择地区
        $scope.$watch('rootArea', function() {
            $scope.selectArea($scope.rootArea);
        });

        // 选择分类
        $scope.selectCategory = function(cateObj, shallow) {
            $scope.filterState.selectedCategory = cateObj;
            if(!cateObj) {
                $scope.filterState.selectedCategoriesTrack.splice(0);
            } else {
                $scope.filterState.selectedCategoriesTrack.splice(cateObj.level);
                $scope.filterState.selectedCategoriesTrack[cateObj.level] = cateObj;
            }
            console.info('Select', cateObj, '; Tracks:',
                         $scope.filterState.selectedCategoriesTrack);
            if(!cateObj || cateObj.children.length === 0 || shallow) {
                $scope.openFilter = false;
                refreshProducts();
            }
        };

        // 判断分类是否被选中(选中子分类也算)
        $scope.isCategorySelected = function(cate) {
            return $scope.filterState.selectedCategoriesTrack.indexOf(cate) >= 0;
        };

        // 选择排序
        $scope.selectOrdering = function(ordering) {
            $scope.filterState.selectedOrdering = ordering;
            $scope.openFilter = false;
            refreshProducts();
        };

        $scope.$watch('rootArea', function() {
            console.info('Loading/Reloading area tree');
            Area.getAreaTree($scope.rootArea.id).success(function(areaTree) {
                $scope.areaTree = areaTree;
            });
        });

        Category.getCategoryTrees().then(function(categories) {
            $scope.categories = categories;
        });

        // Open popoverFilter by triggers
        $scope.openPopoverFilter = function($event, filterType) {
            $scope.curFilterType = filterType;
            if($scope.filterType === filterType && $scope.openFilter) {
                // close filter ui
                $scope.openFilter = false;
            } else {
                $scope.filterType = filterType;
                $scope.openFilter = true;
            }
        };

        // 创建搜索ui
        $ionicModal.fromTemplateUrl('products-search.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {

            // 激活搜索ui
            $scope.activateSearch = function() {
                console.info('activate search ui.');
                modal.show();
            };

            // 关闭搜索ui
            $scope.deactivateSearch = function() {
                console.info('deactivate search ui.');
                modal.hide();
            };
        });

        // 执行搜索
        $scope.search = function() {
            var searchText = $scope.filterState.searchText;
            if(searchText && searchText.trim()) {
                console.info('searching with', searchText);
                refreshProducts();

                // 搜索确定后关闭搜索UI
                // FIXME: 加载中状态, 响应成功后再关闭UI
                $scope.deactivateSearch();

                // 不记忆搜索关键词
                // TODO: 考虑改为记忆搜索词, 但在改变某些过滤条件时清楚搜索词
                $scope.filterState.searchText = undefined;
            }
        };

        // 传给service的产品查询参数
        var buildQueryParams = function() {
            var filterState = $scope.filterState;

            var params =  {
                public: 'True',
                completed: 'False',
                passed: 'True',
                address: filterState.selectedArea.id
            };


            if(filterState.selectedCategory) {
                params.category = filterState.selectedCategory.id;
            }

            if(filterState.selectedOrdering && filterState.selectedOrdering.key) {
                console.info('order by', filterState.selectedOrdering);
                params.ordering = (filterState.selectedOrdering.reverse?'-':'') + filterState.selectedOrdering.key;
            }

            if(filterState.searchText && filterState.searchText.trim()) {
                params.search = filterState.searchText.trim();
            }

            return params;
        };

        // 刷新产品数据
        var refreshProducts = function() {
            // NOTE: callback support?
            var params = buildQueryParams();
            console.info('Refresh products with query:', params);
            $scope.products = Product.findProducts(params);
            $ionicScrollDelegate.resize();
        };

        $timeout(function() {
            // first load products
            refreshProducts();
        }, 100);

        $scope.$on('HNFirebase.topStoriesUpdated', function() {
            $scope.products = HNFirebase.getTopStories();
        });

        $scope.$watch(function() {
            return HNFirebase.getTopStoriesPercentLoaded();
        }, function(percentComplete) {
            if (percentComplete >= 1) {
                $scope.$broadcast('scroll.refreshComplete');
                cfpLoadingBar.complete();
            } else {
                cfpLoadingBar.set(percentComplete);
            }
        });

        $timeout(function() {
            if ($scope.products.length < 1) {
                cfpLoadingBar.complete();
                $scope.timesUp = true;
            }
        }, 5000);

        $scope.loadDetail = function(id, $event) {
            $event.stopPropagation();
            if (id) $state.go('product-detail', {
                id: id
            });
        };
    })

    .controller('ShopCtrl', function($scope, TokenAuth, Product, AccountCenter,
                                     $stateParams, $ionicPopup, Constants) {
        $scope.productImageURLPrefix = Constants.productImageURLPrefix;

        // get user info
        if(TokenAuth.isAuthenticated()) {
            AccountCenter.getMyAccountInfo().then(function(user){
                $scope.user = user;
            });
        }

        // refresh products
        function refreshProducts() {
            $scope.products = Product.findProducts({owner: $scope.owner.id});
        }

        // get owner(shop) info
        AccountCenter.getUserInfo($stateParams.id).then(function(user) {
            $scope.owner = user;
            refreshProducts();
        });

        // 是否是我的(即当前用户)店铺
        $scope.isMineShop = function() {
            return $scope.user && $scope.owner && $scope.user.id == $scope.owner.id;
        };

        $scope.isOnShelve = function(product) {
            return product.public;
        };

        // 下架产品
        $scope.takeOff = function(product) {
            console.info('Takeing off:', product);
            $ionicPopup.show({
                title: '请选择下架原因',
                scope: $scope,
                buttons: [
                    {
                        text: '已成交',
                        type: 'button-energized',
                        onTap: function() {
                            console.info('已成交');
                            Product.update({
                                id: product.id,
                                public: false,
                                completed: true
                            }).success(function() {
                                console.info('下架成功');
                                refreshProducts();
                            });
                        }
                    },
                    {
                        text: '不卖了',
                        type: 'button-energized',
                        onTap: function() {
                            console.info('不卖了');
                            Product.update({
                                id: product.id,
                                public: false,
                            }).success(function() {
                                console.info('下架成功');
                                refreshProducts();
                            });
                        }
                    },
                    { text: '取消' }
                ]
            });
        };

        $scope.putOn = function(product) {
            Product.update({
                id: product.id,
                public: true,
                completed: false
            }).success(function() {
                console.info('上架成功');
                refreshProducts();
            });
        };
    })

    .controller('FavorsCtrl', function($scope, HNFirebase, $state,
                                        cfpLoadingBar, $timeout,
                                        $ionicScrollDelegate, $ionicPopover,
                                        Area, Product, AccountCenter, Constants) {
        $scope.productImageURLPrefix = Constants.productImageURLPrefix;
        $scope.pageName = '收藏宝贝';
        cfpLoadingBar.start();

        AccountCenter.getMyAccountInfo().then(function(user){
            $scope.user = user;
            $scope.products = Product.findProducts({fans: user.id});
        });

        $scope.removeFavor = function(product) {
            console.info('removeFavor', product.id);
            var idx = $scope.products.indexOf(product);
            if(idx >= 0) {
                $scope.products.splice(idx, 1);
            }
            AccountCenter.removeFavor(product.id);
        };
    })

    .controller('DetailCtrl', function($scope, Constants, Product, $stateParams,
                                       TokenAuth, AccountCenter, $ionicModal,
                                       $ionicPopup,
                                       $timeout, $ionicSlideBoxDelegate) {
        // requests take time, so we do a few things to keep things smooth.
        // we don't load comments until the page animation is over.
        // if after the page animation, the comments are still not available, we show a loading screen
        $scope.productImageURLPrefix = Constants.productImageURLPrefix;

        console.info('Got in DetailCtrl');
        $scope.$on('addFavor', function() {
            console.info('Got addFavor');
        });

        // Load single product data
        Product.fetchProduct($stateParams.id).then(function(data){
            console.log('Got product from service:', product);
            $scope.product = product;

            // fix ionic slidebox issue, refer to:
            // http://stackoverflow.com/questions/27831848/ionic-angularjs-ion-slide-box-with-ng-repeat-not-updating
            $ionicSlideBoxDelegate.update();
        });

        // get current user, only when authenticated
        if(TokenAuth.isAuthenticated()) {
            AccountCenter.getMyAccountInfo().then(function(user){
                $scope.user = user;
            });
        }

        $scope.$on('$ionicView.beforeEnter', function() {
            $timeout(function() {
                $scope.timesUp = true;
            }, 10000);
        });

        $scope.$on('$ionicView.afterEnter', function() {
            // 增加pv
            //$scope.product.pv += 1;
            //Product.updateInfo($stateParams.id, $scope.product);
            console.info('Enter Detail View', $scope.product);
        });

        $scope.$on('$ionicView.afterLeave', function() {
            $scope.timesUp = false;
        });

        $scope.isFavored = function() {
            var productID = Number($stateParams.id);
            return $scope.user && $scope.user.favors.indexOf(productID) >= 0;
        };

        $scope.addFavor = function() {
            console.info('addFavor', $stateParams.id);
            AccountCenter.addFavor($stateParams.id);
        };

        $scope.removeFavor = function() {
            console.info('removeFavor', $stateParams.id);
            AccountCenter.removeFavor($stateParams.id);
        };

        $ionicModal.fromTemplateUrl('share-weixin.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.openShare = function() {
                modal.show();
            };

            $scope.closeShare = function() {
                modal.hide();
            };
        });

        $scope.showAddWechatTip = function() {
            $scope.addWechatTipPopup = $ionicPopup.show({
                title: '添加微信',
                scope: $scope,
                template: '<p>微信号：{{product.owner.weixin_id||"未填写"}}</p>' +
                          '<p>微信暗号：{{product.owner.weixin_veri_mark||"未填写"}}</p>',
                buttons: [
                    {
                    text: '知道了',
                    type: 'button-energized',
                    }
                ]
            });
        };

    })

.controller('NewestCtrl', function($scope, HNFirebase, $state, cfpLoadingBar, $timeout, $ionicScrollDelegate) {
    // This is nearly identical to FrontPageCtrl and should be refactored so the pages share a controller,
    // but the purpose of this app is to be an example to people getting started with angular and ionic.
    // Therefore we err on repeating logic and being verbose
    $scope.pageName = 'Newest';
    cfpLoadingBar.start();
    HNFirebase.fetchNewStories();
    // just kicking the tires
    $scope.$on('$ionicView.afterEnter', function() {
        $timeout(function() {
            $scope.products = HNFirebase.getNewStories();
            $ionicScrollDelegate.resize();
        }, 100);
    });

    $scope.$on('HNFirebase.newStoriesUpdated', function() {
        $scope.products = HNFirebase.getNewStories();
    });

    $scope.loadMore = function() {
        cfpLoadingBar.start();
        HNFirebase.increaseNewStoriesCount(15);
    };

    // update the loading bar
    $scope.$watch(function($scope) {
        return HNFirebase.getNewStoriesPercentLoaded();
    }, function(percentComplete) {
        if (percentComplete >= 1) {
            $scope.$broadcast('scroll.infiniteScrollComplete');
            $scope.$broadcast('scroll.refreshComplete');
            cfpLoadingBar.complete();
        } else {
            //cfpLoadingBar.set(HNFirebase.getNewStoriesPercentLoaded());
        }
    });

    $timeout(function() {
        if ($scope.products.length < 1) {
            cfpLoadingBar.complete();
            $scope.timesUp = true;
        }
    }, 5000);

    $scope.loadComments = function(storyID, commentNum, $event) {
        $event.stopPropagation();
        if (commentNum) $state.go('tab.front-page-comments', {
            storyID: storyID
        });
    };
})

.controller('CommentsCtrl', function($scope, HNFirebase, $stateParams, $sce, $timeout) {
    // requests take time, so we do a few things to keep things smooth.
    // we don't load comments until the page animation is over.
    // if after the page animation, the comments are still not available, we show a loading screen
    $scope.$on('$ionicView.beforeEnter', function() {
        HNFirebase.fetchComments($stateParams.storyID);
        $timeout(function() {
            $scope.timesUp = true
        }, 10000);
        $scope.delay = true;
        $scope.starting = true;

    });
    $scope.$on('$ionicView.afterEnter', function() {
        $timeout(function() {
            $scope.starting = false
        }, 0);
    })
    $scope.$on('HNFirebase.commentsUpdated', function() {
        //$timeout(function(){
        $scope.percentLoaded = HNFirebase.getCommentsPercentLoaded();
        $scope.comments = HNFirebase.getComments();
        $timeout(function() {
            if ($scope.comments.length && $scope.delay) $scope.delay = false
        }, 1500)

    });
    $scope.$on('$ionicView.afterLeave', function() {
        $scope.timesUp = false;
        //cleanup so simplify returning
        $scope.comments = [];
        $scope.delay = true;
    });

    $scope.trust = function(comment) {
        return '<p>' + $sce.trustAsHtml(comment);
    };
    $scope.bubbleCheck = function(e) {
        if (e.toElement.tagName == "A") {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }
})

.controller('SearchCtrl', function($scope, Algolia, $state, $timeout) {
    $scope.focused = 'centered';
    $scope.searchTerm = '';
    $scope.products = [];
    $scope.$on('$ionicView.beforeEnter', function() {
        $scope.starting = true;
        $scope.searching = false;
        $timeout(function() {
            $scope.starting = false
        }, 500)
    });
    if (typeof localStorage.searchCache != 'undefined') {
        var sc = JSON.parse(localStorage.searchCache);
        $scope.searchTerm = sc.term;
        $scope.products = sc.results;
        $scope.focused = 'left';
    }
    $scope.search = function(searchTerm) {
        if (searchTerm === '') return;
        $scope.products = [];
        $scope.searching = true;
        document.getElementById('searchInput').blur();
        Algolia.search(searchTerm).then(function(searchResults) {
            $timeout(function() {
                $scope.products = searchResults.hits;
            }, 500);
            localStorage.searchCache = JSON.stringify({
                term: searchTerm,
                results: searchResults.hits
            });
            $scope.searching = false;
            $scope.error = false;
        }, function() {
            $scope.products = [];
            $scope.searching = false;
            $scope.error = true;
        });
    };
    $scope.$on('fpSearchBar.clear', function() {
        $scope.products = [];
        $scope.searchTerm = '';
        delete localStorage.searchCache;
    });
    $scope.loadComments = function(storyID) {
        $state.go('tab.search-comments', {
            storyID: storyID
        });
    }
});
