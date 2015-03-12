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
