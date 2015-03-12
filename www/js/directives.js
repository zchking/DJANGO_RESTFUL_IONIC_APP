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
