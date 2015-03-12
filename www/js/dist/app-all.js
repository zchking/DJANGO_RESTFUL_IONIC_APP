// Ionic FrontPage App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'frontpage' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
// 'frontpage.services' is found in services.js
angular.module('frontpage', [
    'ngAnimate',
    'ionic',
    'frontpage.controllers',
    'frontpage.services',
    'frontpage.directives',
    //'ionic.services.analytics',
    'ionic.services.update',
    'cfp.loadingBar',
    'ngMessages',
    'ui.select',
    'ngSanitize'
])

.run(function($rootScope, $ionicPlatform, $http, TokenAuth,
              /*$ionicTrack,*/ $ionicUpdate, $ionicHistory) {
        // set check for the cookie when a user comes to the site
        console.info("Got frontpage.run()");

        if(0)$ionicPlatform.ready(function() {
            // for ios7 style header bars
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }
            // hide the prev/next buttons on the keyboard input
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            // hide the splash screen only after everything's ready (avoid flicker)
            // requires keyboard plugin and confix.xml entry telling the splash screen to stay until explicitly told
            if (navigator.splashscreen) {
                navigator.splashscreen.hide();
            }

            $ionicUpdate.initialize(ionic.Config.app_id);
            $ionicUpdate.check().then(function(response) {
                console.log('got a response', response);
                // response will be true/false
                if (response) {
                    // Download the updates
                    console.log('downloading updates');
                    $ionicUpdate.download().then(function() {
                        // Extract the updates
                        console.log('extracting updates');
                        $ionicUpdate.extract().then(function() {
                            console.log('update extracted, loading');
                            // Load the updated version
                            $ionicUpdate.load();
                        }, function(error) {
                            console.log('error extracting');
                            // Error extracting
                        }, function(progress) {
                            // Do something with the zip extraction progress
                            console.log('extraction progress', progress);
                        });
                    }, function(error) {
                        console.log('error downloading');
                        // Error downloading the updates
                    }, function(progress) {
                        // Do something with the download progress
                        console.log('progress downloading', progress);
                    });
                } else {
                    // No updates, load the most up to date version of the app
                    console.log('no update, loading');
                    $ionicUpdate.load();
                }
            }, function(error) {
                console.log('error checking for update');
                // Error checking for updates
            })
        });

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
            /**
             * per-state login Required implementation, refer to:
             * http://brewhouse.io/blog/2014/12/09/authentication-made-simple-in-single-page-angularjs-applications.html
             */
            var loginRequired = (toState.data || {}).loginRequired || false;

            if(loginRequired && !TokenAuth.isAuthenticated()) {
                $rootScope.$broadcast('event:auth-loginRequired', toState);
                event.preventDefault();
            }
        });
    })
    .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
        cfpLoadingBarProvider.includeSpinner = false;
    }])
    .config(function($stateProvider, $urlRouterProvider, $ionicAppProvider, $compileProvider, $ionicConfigProvider) {
        try {
            $ionicAppProvider.identify({
                "app_id": ionic.Config.app_id,
                "api_write_key": ionic.Config.api_write_key
            });
        } catch (e) {
            console.error('ionic.Config not set. Make sure config.js is loaded', e)
        }

        $compileProvider.debugInfoEnabled(false);

        $ionicConfigProvider.views.maxCache(10);

        $ionicConfigProvider.tabs.position('bottom');

        $ionicConfigProvider.templates.maxPrefetch(3);

        //$ionicConfigProvider.navBar.alignTitle('center');
        $ionicConfigProvider.navBar.positionPrimaryButtons('left');

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

        // setup an abstract state for the tabs directive
        // the tab state isn't an actual page we navigate to, but a necessary state for ionic tabs
        .state('tab', {
            url: "/tab",
            abstract: true,
            templateUrl: "templates/tabs.html"
        })

        .state('register', {
            parent: 'tab',
            url: "/register",
            views: {
                'user': {
                    controller: 'RegisterCtrl',
                    templateUrl: "templates/register.html"
                }
            }
        })

        .state('login', {
            parent: 'tab',
            url: "/login",
            views: {
                'user': {
                    controller: 'LoginCtrl',
                    templateUrl: "templates/login.html"
                }
            }
        })

        .state('account', {
            parent: 'tab',
            abstract: true,
            url: '/account',
            data: {
                loginRequired: true
            },
            views: {
                'user': {
                    // Maybe a bug of ionic here, when using templateUrl!!!
                    template: '<ion-nav-view/>',
                    //templateUrl: 'templates/account.html',
                    controller: 'AccountCtrl'
                }
            }
        })

        .state('account.center', {
            url: '/center',
            templateUrl: 'templates/account-center.html'
        })

        .state('account.detail', {
            url: '/detail',
            templateUrl: 'templates/account-detail.html',
            controller: 'UserDetail'
        })

        .state('account.set-password', {
            url: '/set-password',
            templateUrl: 'templates/set-password.html',
            controller: 'SetPassword'
        })

        // Each tab has its own nav history stack:
        // Font page and Newest are nearly identical and could probably share a template and possibly even a controller
        // It's reasonable to expect they'll diverge as the app matures though, so we'll keep them separate
        // Check the comments page to see an example of how to reuse a template/controller
        .state('tab.products', {
            url: '/products',
            views: {
                'product': {
                    templateUrl: 'templates/tab-products.html',
                    controller: 'ProductsCtrl'
                }
            }
        })

        // 发布产品
        .state('tab.add-product', {
            url: '/add-product',
            data: {
                loginRequired: true
            },
            views: {
                'publish': {
                    templateUrl: 'templates/tab-edit.html',
                    controller: 'ProductEditCtrl'
                }
            }
        })

        // the detail pages are identical but we'd like to have each tab have their own,
        // so we'll just reuse the controller and template for each one
        .state('product-detail', {
            url: '/products/:id',
            templateUrl: 'templates/tab-detail.html',
            controller: 'DetailCtrl'
        })

        // 更新发布产品
        .state('tab.edit-product', {
            url: '/edit-product/:id',
            views: {
                'publish': {
                    templateUrl: 'templates/tab-edit.html',
                    controller: 'ProductEditCtrl'
                }
            }
        })

        // 店铺(我的盘子 & 展示其他用户的店铺信息)
        .state('shop', {
            //parent: 'account',
            url: '/shop/:id',
            templateUrl: 'templates/shop.html',
            controller: 'ShopCtrl'
        })

        .state('favors', {
            cache: false,
            parent: 'account',
            url: '/favors',
            templateUrl: 'templates/favors.html',
            controller: 'FavorsCtrl'
        })
        ;

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/tab/products');

    })

.filter('timeAgo', function() {
    var cache = [];
    return function(date) {
        if (typeof cache[date] === 'string') return cache[date];
        var prettyDate = moment(date).fromNow();
        cache[date] = prettyDate;
        return prettyDate;
    };
})

;

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

/**
 * Created by perry on 7/31/14.
 */

angular.module('frontpage.directives', [])
.directive('fpSearchBar', function($rootScope, $timeout) {
  return {
    restrict: 'E',
    replace: true,
    require: '?ngModel',
    scope: {
      searchModel: '=?',
      focused: '=?',
      submit: '&'
    },
    template:function(){
      if(ionic.Platform.isAndroid()){
        return '<form class="bar bar-header bar-energized item-input-inset" ng-submit="submit()">' +
          '<div class="item-input-wrapper light-bg" ng-class="alignment" ng-click="focus()">' +
          '<i class="icon ion-android-search placeholder-icon"></i>' +
          '<input type="search"' +
          'id="searchInput"' +
          'placeholder="Search HN"' +
          'ng-model="searchModel"' +
          'ng-focus="alignment = \'text-left\'"' +
          'ng-blur="alignment = searchModel.length?\'left\':\'centered\'">' +
          '</div>' +
          '<i class="icon ion-ios7-close dark" ng-show="searchModel.length" ng-click="clear()"></i>' +
          '</form>'
      }
      return '<form class="bar bar-header bar-energized item-input-inset" ng-submit="submit()">' +
        '<div class="item-input-wrapper energized-bg" ng-class="alignment" ng-click="focus()">' +
        '<i class="icon ion-ios7-search placeholder-icon"></i>' +
        '<input type="search"' +
        'id="searchInput"' +
        'placeholder="Search"' +
        'ng-model="searchModel"' +
        'ng-focus="alignment = \'left\'"' +
        'ng-blur="alignment = searchModel.length?\'left\':\'centered\'">' +
        '</div>' +
        '<i class="icon ion-ios7-close dark ng-hide" ng-show="searchModel.length" ng-click="clear()"></i>' +
        '</form>'
    },
    link: function(scope, elem){
      var input = elem[0].querySelector('#searchInput');
      scope.focus = function(){
        input.focus()
        $timeout(function(){input.focus()},200);

      };
      scope.alignment = scope.searchModel.length? 'left':'centered';
      // grab the cached search term when the user re-enters the page
      $rootScope.$on('$ionicView.beforeEnter', function(){
        if(typeof localStorage.searchCache != 'undefined') {
          var sc = JSON.parse(localStorage.searchCache);
          scope.searchModel = sc.term;
        }
      });
      scope.clear = function(){
        scope.searchModel = '';
        scope.alignment = 'centered';
        input.blur();

        scope.$emit('fpSearchBar.clear');
      };
    }
  };
})
// custom directive to bind to hold events and trigger the sharing plugin
// expects the parent scope to contain a post item from the HNAPI service
.directive('fpShare', function($ionicGesture) {
  return {
    restrict :  'A',
    link : function(scope, elem) {
      $ionicGesture.on('hold',share , elem);

      function share(){
        if(typeof window.plugins === 'undefined' || typeof window.plugins.socialsharing === 'undefined'){
          console.error("Social Sharing Cordova Plugin not found. Disregard if on a desktop browser.");
          return;
        }
        window.plugins
          .socialsharing
          .share(
            scope.$parent.post.title,
            null,
            null,
            scope.$parent.post.url
          )
      }
    }
  }
})

.directive('ngThumb', ['$window', function($window) {
    var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function(item) {
            return angular.isObject(item) && item instanceof $window.File;
        },
        isImage: function(file) {
            var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    };

    return {
        restrict: 'A',
        template: '<canvas/>',
        link: function(scope, element, attributes) {
            if (!helper.support) return;

            var params = scope.$eval(attributes.ngThumb);

            if (!helper.isFile(params.file)) return;
            if (!helper.isImage(params.file)) return;

            var canvas = element.find('canvas');
            var reader = new FileReader();

            reader.onload = onLoadFile;
            reader.readAsDataURL(params.file);

            function onLoadFile(event) {
                var img = new Image();
                img.onload = onLoadImage;
                img.src = event.target.result;
            }

            function onLoadImage() {
                var width = params.width || this.width / this.height * params.height;
                var height = params.height || this.height / this.width * params.width;
                canvas.attr({
                    width: width,
                    height: height
                });
                canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
            }
        }
    };
}])

;


angular.module('frontpage.services', ['firebase'])

.factory('Constants', function() {
    // 提供app常量

    function isProduction() {
        return document.location.hostname == '45.56.88.200';
    }

    var apiServerAddress = isProduction()?
        'http://' + document.location.hostname + ':8081':
        'http://' + document.location.hostname + ':8000';

    var mediaUrl = isProduction()?
        'http://' + document.location.hostname + '/media':
        'http://' + document.location.hostname + ':8000/media';

    return {
        apiServerAddress: apiServerAddress,

        apiRegisterAddress: apiServerAddress + '/api/accounts/register/',
        apiTokenAuthAddress: apiServerAddress + '/api-token-auth/',
        apiSetPassword: apiServerAddress + '/api/accounts/password/',
        apiUserInfo: apiServerAddress + '/api/accounts/users/',
        apiMyAccountInfo: apiServerAddress + '/api/accounts/me/',

        apiProductAddress: apiServerAddress + '/api/products/',
        apiArea: apiServerAddress + '/api/areas/',
        apiAreaTree: apiServerAddress + '/api/areas-tree/',
        apiCategory: apiServerAddress + '/api/category-trees/',
        apiImagePool: apiServerAddress + '/api/image-pool/',
        productImageURLPrefix: mediaUrl + '/images/product/'
    };
})

// 用户位置管理服务
.factory('Location', function($rootScope) {
    var location = {id: 310000, name: '上海市'};
    return {
        setLocation: function(area) {
            if(location.id !== area.id) {
                location = area;
                $rootScope.$broadcast('Location.locationChanged', location);
                console.info('Location changed:', location);
            } else {
                console.warn('Previous location is the same, not set!');
            }
        },

        getCity: function() {
            return location;
        }
    };
})

.factory('TokenAuth', function($http, $q, $cookieStore, authService, Constants) {
    /**
     * Token auth service with help of [http-auth-interceptor](
     * https://github.com/witoldsz/angular-http-auth)
     * Refer to:
     * http://stackoverflow.com/questions/20498317/user-authentication-in-django-rest-framework-angular-js-web-app
     */
    return {
        login: function(params) {
            // Login to obtain token, interacts with django's SessionAuthentication,
            // params: {username, password}
            console.log('Login with:', params);
            var deferred = $q.defer();
            $http.post(Constants.apiTokenAuthAddress, params).success(function(data){
                console.info("Obtain token successful", data);

                $cookieStore.put('djangotoken', data.token);
                $http.defaults.headers.common['Authorization'] = 'Token ' + data.token;
                authService.loginConfirmed();

                deferred.resolve(data);
            }).error(function(data) {
                deferred.reject(data);
            });

            return deferred.promise;
        },

        logout: function() {},

        isAuthenticated: function() {
            // default `Authorization` header is set after login
            return 'Authorization' in $http.defaults.headers.common;
        }
    };
})

.factory('AccountCenter', function($rootScope, $http, $q, Constants) {
    /**
     * User related service, provides current logined user's info.
     */

    // for service internal use
    // ensure any update action will trigger updating userCache!
    var userCache = {};
    var userCacheExpired = true;

    return {
        // 注册
        register: function(params) {
            console.info('Registering:', params);
            return $http.post(Constants.apiRegisterAddress, params);
        },

        // 设置(修改)密码
        setPassword: function(passwords) {
            return $http.post(Constants.apiSetPassword, {
                current_password: passwords.current_password,
                new_password: passwords.new_password
            });
        },

        // 获取用户信息(如果要获取当前登陆用户信息请使用 `getMyAccountInfo`)
        getUserInfo: function(id) {
            var deferred = $q.defer();
            $http.get(Constants.apiUserInfo + id + '/').success(function(data) {
                deferred.resolve(data);
            });
            return deferred.promise;
        },

        // 获取当前用户信息
        getMyAccountInfo: function(options) {
            options = options || {
                forceReload: false
            };

            var deferred = $q.defer();

            // 没有标记用户缓存过期且没有制定强制刷新, 则直接取缓存
            if(!userCacheExpired && !options.forceReload) {
                deferred.resolve(/*angular.copy*/(userCache));
            } else {
                $http.get(Constants.apiMyAccountInfo).success(function(data) {
                    angular.extend(userCache, data);
                    userCacheExpired = false;
                    deferred.resolve(/*angular.copy*/(userCache));
                });
            }

            return deferred.promise;
        },

        // 更新用户信息到服务器
        update: function(data) {
            $http({
                method: 'PATCH',
                url: Constants.apiMyAccountInfo,
                data: data
            }).success(function(data) {
                angular.extend(userCache, data);
                userCacheExpired = false;
            });
        },

        // 添加产品到收藏
        addFavor: function(product) {
            var thisService = this;
            var productID = Number(product.id? product.id: product);
            thisService.getMyAccountInfo().then(function(user) {
                if(user.favors.indexOf(productID) < 0) {
                    user.favors.push(productID);
                    thisService.update({favors: user.favors});
                } else {
                    console.warn('product', productID, 'is already favored');
                }
            });
        },

        // 移除收藏
        removeFavor: function(product) {
            var thisService = this;
            var productID = Number(product.id? product.id: product);
            thisService.getMyAccountInfo().then(function(user) {
                var idx = user.favors.indexOf(productID);
                if(idx >= 0) {
                    user.favors.splice(idx, 1);
                    thisService.update({favors: user.favors});
                } else {
                    console.warn('product', productID, 'not in favors');
                }
            });
        }
    };
})

.factory('HNFirebase', function($q, $firebase, $rootScope) {
  var APIUrl = "https://hacker-news.firebaseio.com/v0",
      topStories  = [],
      newStories = {},
      comments = {},
      currentMaxID = null,
      newStoriesCount = 15,
      topStoryCache ={},
      checkedForNewStories = {},
      numberOfComments = null,
      lowestCommentLevel = 0;

  var getItem = function(itemID) {
    var refItem = new Firebase(APIUrl).child("item").child(itemID);
    var item = $firebase(refItem).$asObject();
    return item;
  };

  var getRef = function(itemID) {
    return new Firebase(APIUrl).child("item").child(itemID);
  };

  var getNewStoriesUntil = function(){
    if (currentMaxID === null) return;
    var alreadyAtMax = Object.keys(newStories).length >= newStoriesCount;
    // if the item is already found, skip it. used in infinite scroll
    if(!alreadyAtMax && checkedForNewStories[currentMaxID]){
      currentMaxID--;
      getNewStoriesUntil();
      return;
    }
    var item = getItem(currentMaxID);
    currentMaxID--;
    item.$loaded().then(function(data) {
      checkedForNewStories[data.id] = true;
      if(data.type === 'story' && !data.deleted && !data.dead && data.title){
        newStories[data.$id] = data;
        $rootScope.$broadcast('HNFirebase.newStoriesUpdated', newStories);
      }
      if(
      (!alreadyAtMax && Object.keys(newStories).length < newStoriesCount) ||
      (alreadyAtMax && typeof newStories[currentMaxID] == 'object')){
        // make one final recursive request
        getNewStoriesUntil();
      }
    });
  };

  var getComment = function(commentID, level){
    commentRef = getItem(commentID)
    commentRef.$loaded().then(function(comment){
      if(comment.deleted){
        numberOfComments--;
        return;
      }
      if(comment.kids){
        // get children
        numberOfComments = numberOfComments + comment.kids.length;
        angular.forEach(comment.kids, function (childID) {
          getComment(childID, level + 1 );
        });
      }
      if(level > lowestCommentLevel) lowestCommentLevel = level;
      comment.level = level;
      comments[comment.id] = comment;
      $rootScope.$broadcast('HNFirebase.commentsUpdated', comments);
    })
    .catch(function(error){
      console.error('Unable to get comment', error);
      numberOfComments--
    })
  };

  return {
    fetchTopStories: function(){
      topStories = [];
      var ref = new Firebase(APIUrl).child("topstories");
      ref.on('value', function(update){
        update.val().forEach(function (storyID, index) {
          // Since most updates are just position changes, we cache stories so
          // we don't have to re-grab them with every minor update
          if(typeof topStoryCache[storyID] == 'object'){
            topStories[index] = topStoryCache[storyID]
          }else{
            var storyRef = getRef(storyID);
            storyRef.on('value', function(storyVal){
              // note the value of kids will be wrong since it only has the top level children
              // getting subsequent children and having that live update creates a crazy amount of traffic
              // the HN API should update this
              topStories[index] = storyVal.val();
              topStoryCache[storyID] = storyVal.val();
            });
          }
          $rootScope.$broadcast('HNFirebase.topStoriesUpdated', topStories);
        });
      });
    },
    getTopStories: function() {
      return topStories;
    },
    getTopStoriesPercentLoaded: function(){
      var numberOfTopStories = 100;
      var numberCompleted = topStories.length;
      //angular.forEach(topStories, function (story) {
      //  console.log(story)
      //  if(story.$loaded().$$state.status === 1) numberCompleted++
      //});
      return numberCompleted / numberOfTopStories;
    },
    fetchComments: function(storyID) {
      comments = {};
      numberOfComments = null;
      lowestCommentLevel = 0;
      var refStory = new Firebase(APIUrl).child("item").child(storyID);
      var story = $firebase(refStory).$asObject();
      story.$loaded()
      .then(function(data) {
        numberOfComments = data.kids.length;
        angular.forEach(data.kids, function (commentID) {
          getComment(commentID, 0);
        });
      });
    },
    getComments: function() {
      commentArray = [];
      // convert the object of comment objects to an array of IDs so we're not juggling large objects
      var commentPool = Object.keys(comments).sort().reverse().map(function(strID){return parseInt(strID)});
      // get a list of the top level comments
      angular.forEach(commentPool, function(commentID) {
        if (comments[commentID].level == 0) {
          commentArray.push(commentID);
          commentPool.splice(commentPool.indexOf(commentID), 1);
        }
      });

      // reverse the order so subcomments show up newest first (last to be added)
      commentPool.reverse();
      // cycle through, looking for parent IDs in the array of comment IDs
      // if it's found, add it and remove it from the pool
      // continue this until the pool is empty or we've reached the max number of loops
      var lastPoolLength = commentPool.length;
      for(var i = 1; i < 20; i++){
        angular.forEach(commentPool, function(commentID){
          if(commentArray.indexOf(comments[commentID].parent) != -1){
            commentArray.splice(commentArray.indexOf(comments[commentID].parent)+1, 0, commentID);
            commentPool.splice(commentPool.indexOf(commentID), 1);
          }
        });
        // sometimes a comment can become an orphan if we are not applying new comments, then move on
        if(lastPoolLength === commentPool.length)break;
      }
      return commentArray.map(function(commentID){
        return comments[commentID]
      });
    },
    getCommentsPercentLoaded: function(){
      var numberCompleted = 0;
      angular.forEach(comments, function (story) {
        if(story.$loaded().$$state.status === 1) numberCompleted++
        //console.log(numberCompleted / numberOfComments)
      });
      return numberCompleted / numberOfComments;
    },
    fetchNewStories: function() {
      var ref = new Firebase(APIUrl).child("maxitem");
      ref.on('value', function(update){
        currentMaxID  = update.val();
        // http://stackoverflow.com/questions/985431/max-parallel-http-connections-in-a-browser
        var concurrentRequests = 6;
        // make several non-recursive requests
        for(var x = 0; x < concurrentRequests; x++) {
          // get 100 stories
          getNewStoriesUntil(newStoriesCount)
        }
      });
    },
    getNewStories: function() {
      return Object.keys(newStories).map(function(k) { return newStories[k] }).reverse();
    },
    increaseNewStoriesCount: function(increase) {
      newStoriesCount = newStoriesCount + increase;
      currentMaxID = Object.keys(newStories)[Object.keys(newStories).length - 1];
      this.fetchNewStories();
      return newStoriesCount;
    },
    getNewStoriesPercentLoaded: function() {
      return Object.keys(newStories).length/newStoriesCount;
    }
  }
})

/**
 * A simple AJAX service for Algolia's search API
 */

.factory('Algolia', function($http, $q) {
  var apiURL = 'https://hn.algolia.com/api/v1/search?tags=story&query=',
      config = {timeout: 10000};

  function validateResponse(result){
    return !(typeof result.data != 'array' && typeof result.data != 'object');
  }

  return{
    // enter a request's reponse in to the cache
    search: function(query){
      var q = $q.defer();
      $http.get(apiURL+query, config)
      .then(function(result){
        return !validateResponse(result)? q.reject(new Error('Invalid Response')):q.resolve(result.data);
      },function(err){
        console.log('Query '+page+' Failed');
        q.reject(err);
      });
      return q.promise;
    }
  }
})

.factory('Category', function($http, $q, Constants) {
    return {
        getCategoryTrees: function() {
            var deferred = $q.defer();

            $http.get(Constants.apiCategory).success(function(data) {
                console.info('Loaded categories data:', data);
                deferred.resolve(data);
            });

            return deferred.promise;
        }
    };
})

// 地区数据服务
.factory('Area', function($http, $q, Constants) {

    // areas cache
    //  {id: {areaItem}}
    var areasCache = {};
    var pushCache = function(area) {
        if(Array.isArray(area)) {
            area.forEach(function(item) {
                pushCache(item);
            });
        } else if(!(area.id in areasCache)) {
            areasCache[area.id] = area;
        }
    };

    return {
        getAreaTree: function(rootArea) {
            return $http.get(Constants.apiAreaTree + rootArea + '/');
        },

        get: function(id) {
            // 根据id获取地区详情(优先从缓存取)
            var deferred = $q.defer();

            if(id in areasCache) {
                deferred.resolve(areasCache[id]);
            } else {
                $http({
                    method: 'GET',
                    url: Constants.apiArea + id + '/',
                }).success(function(data) {
                    console.info('fetch area', id, 'from server');
                    deferred.resolve(data);
                    pushCache(data);
                });
            }

            return deferred.promise;
        },

        // low-level query interface
        find: function(params) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: Constants.apiArea,
                params: params
            }).success(function(data) {
                deferred.resolve(data);
                pushCache(data);
            });

            return deferred.promise;
        },

        search: function(stext) {
            var deferred = $q.defer();

            $http({
                method: 'GET',
                url: Constants.apiArea,
                params: {search: stext.trim()}
            }).success(function(data) {
                deferred.resolve(data);
                pushCache(data);
            });

            return deferred.promise;
        }
    };
})

/**
 * Product service
 */

.factory('Product', function($http, $q, Constants) {
    return {
        findProducts: function(params) {
            var products = [];
            $http({
                method: 'GET',
                url: Constants.apiProductAddress,
                params: params
            }).success(function(data) {
                angular.forEach(data.results, function(p) {
                    products.push(p);
                });
            });
            return products;
        },

        fetchProduct: function(id) {
            var deferred = $q.defer();

            $http.get(Constants.apiProductAddress + id + '/').success(function(data){
                product = data;
                deferred.resolve(data);
            });

            return deferred.promise;
        },

        getSchema: function() {
            var deferred = $q.defer();

            $http({
                method: 'OPTIONS',
                url: Constants.apiProductAddress
            }).success(function(response) {
                if(response.actions && response.actions.POST) {
                    deferred.resolve(response.actions.POST);
                } else {
                    deferred.resolve(null);
                }
            });

            return deferred.promise;
        },

        publish: function(product) {
            return $http({
                method: product.id? 'PATCH': 'POST',
                url: Constants.apiProductAddress + (product.id? (product.id+'/'): ''),
                data: product
            });
        },

        update: function(partial) {
            // update to server
            if(!partial.id) {
                throw 'Product.update must be applied on an object with id.';
            } else {
                return this.publish(partial);
            }
        },
    }
});
