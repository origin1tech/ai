var pageLoader = angular.module('ai.widget.pageloader', []);

pageLoader.directive('aiPageLoader', [ '$rootScope', '$timeout', function ($rootScope, $timeout) {


    /*
     *  set value for opacity to use it instead of rgba background color.
     *  when using opacity set rgba to hex color.
     */
    return {
        restrict: 'AE',
        scope: true,
        template: '<div class="page-loader" ng-show="loading">' +
                    '<div class="page-loader-wrapper">' +
                        '<span class="page-loader-title" ng-show="title">{{title}}</span>'  +
                        '<div class="page-loader-preloader" ng-show="preloader">' +
                            '<img ng-src="{{preloader}}"/>' +
                        '</div>' +
                    '</div>' +
                  '</div>',
        replace: true,
        link: function (scope, element, attrs) {

            var defaults, options, css, head, style, disabledPath;

            defaults = {
                title: 'Loading...',
                preloader: null,
                background: {
                    top: 0,
                    left: 0,
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    'text-align': 'center',
                    'z-index': 1055,
                    'background-color': 'rgba(33,33,33,0.7)'
                },
                opacity: null,
                center: true,
                transparentBackground: false,
                disableOnPath: '/passport/sigon',
                onRoute: true,
                onAjax: true,
                timeout: 300
            };

            options = angular.extend(defaults, scope.$eval(attrs.aiPageLoader || {}));

            if(options.center) {

                /*
                 *  add some needed pseudo styles to center loader
                 *  pseudo styles cannot be set via javascript so we add
                 *  a style to the header
                 */
                css = ".page-loader::before {content: ''; display: inline-block; height: 100%; vertical-align: middle; margin-right: -0.25em; }\n";
                css += '.page-loader > div { display: inline-block; vertical-align: middle; }';

                head = document.head || document.getElementsByTagName('head')[0];
                style = document.createElement('style');
                style.type = 'text/css';

                if(style.styleSheet)
                    style.styleSheet.cssText = css;
                else
                    style.appendChild(document.createTextNode(css));

                /* append the style */
                head.appendChild(style);

            }

            if(options.opacity){
                options.background.opacity = options.opacity;
                options.background['-khtml-opacity'] = options.background.opacity;
                options.background['-moz-opacity'] = options.background.opacity;
            }

            if(options.transparentBackground)
                options.background['background-color'] = 'transparent';

            scope.preloader = options.preloader;
            scope.title = options.title;
            scope.loading = false;

            /* add css styling */
            element.addClass('page-loader');
            element.css(options.background);

            disabledPath = function (next) {

                var route = next.$$route,
                    regex = route.regexp,
                    valid = false;

                if(angular.isArray(options.disableOnPath)){
                    angular.forEach(options.disableOnPath, function (path) {
                        if(!valid)
                            valid = regex.test(path);
                    });
                } else {
                    valid = regex.test(options.disableOnPath);
                }

                return valid;
            };

            if(options.onRoute) {

                $rootScope.$on('$routeChangeStart',  function (event, next, current) {
                    if(!disabledPath(next)) {
                        scope.loading = true;
                    }
                });

                $rootScope.$on('$routeChangeSuccess',  function (event, next, current) {
                    if(!disabledPath(next)) {
                        $timeout(function () {
                            scope.loading = false;
                        }, options.timeout);
                    }
                });

            }

            /* requires LoaderFactory Module */
            $rootScope.$watch('loading', function(newValue, oldValue) {
                if(newValue === oldValue) return;
                if(options.onAjax)
                    scope.loading = newValue;

            });

        }

    }

}]);