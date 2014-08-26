angular.module('ai.navigator', [])

    .provider('$navigator', function $navigator() {

        var defaults = {
                template: '',

                defaultRoute: '/'
            },
            get, set;

        set = function (options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$rootScope', '$compile',  function ($rootScope, $compile) {

            function NavigatorFactory(element, options) {

                var $module = {},
                    scope;

                options = angular.extend(defaults, options);
                scope = $module.$scope = (options.scope ? options.scope.$new() : $rootScope.$new());



                return $module;
            }
            return NavigatorFactory;

        }];

        return {
            $get: get,
            $set: set
        };

    })
  
    .directive('aiNavigator', ['$navigator', function($navigator) {

        function getSelf(element) {
            var div = angular.element('<div/>');
            return div.append(element.clone()).html();
        }

        return {
            restrict: 'EAC',
            scope: {
                options: '&aiNavigator'
            },
            link: function(scope, element) {

                var defaults, init, options, directive;

                defaults = {
                    scope: scope
                };

                init = function init() {
                    scope.options.html = getSelf(element);
                    directive = $navigator(element, options);
                };

                options = angular.extend(defaults, scope.$eval(scope.options));

                init();
            }
        };

    }]);