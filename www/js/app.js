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
