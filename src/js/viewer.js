(function () {
    'use strict';

    angular.module('ai.viewer', [])

        .provider('$viewer', function $viewer() {

            var defaults = {
                    view: '<div ng-view />',
                    animate: 'slide'
                },
                get, set;

            set = function (options) {
                defaults = angular.extend(defaults, options);
            };

            get = ['$rootScope', '$compile', '$location', function ($rootScope, $compile, $location) {

                var prevRoutes = [],
                    initialized = false,
                    state;

                // store previous route set in/out state.
                $rootScope.$on('$routeChangeStart', function (event, next, current) {

                    var prevRoute = prevRoutes.slice(0).pop(),
                        route = next.$$route.originalPath;

                    current = current || {
                        $$route: '/'
                    };

                    if(initialized) {
                        if(route === prevRoute) {
                            state = 'back';
                            prevRoutes.pop();
                        } else {
                            state = 'forward';
                            prevRoutes.push(current.$$route.originalPath);
                        }
                    } else {
                        initialized = true;
                    }

                });

                function ViewFactory(element, options) {

                    var $module = {},
                        view,
                        scope;

                    scope = options.scope || $rootScope.$new();
                    options = scope.options = angular.extend(defaults, options);

                    view = angular.element(scope.options.view);
                    view.addClass('ai-viewer-view');

                    // only add ng-class state if animate is enabled.
                    if(scope.options.animate)
                        view.attr('ng-class', 'state');

                    view = $compile(view)(scope);

                    element.addClass('ai-viewer');
                    element.append(view);

                    // gets previous view.
                    $module.getView = function () {
                        return angular.element(document.querySelectorAll('.ai-viewer-view')[0]);
                    };

                    // gets current state.
                    $module.getState = function () {
                        return state;
                    };

                    $module.forward = function (path) {
                        $location.path(path);
                    };

                    $module.backward = function (path) {
                        // push route view will see as return path or backward.
                        prevRoutes.push(path);
                        $location.path(path);
                    };

                    return $module;
                }
                return ViewFactory;

            }];

            return {
                $get: get,
                $set: set
            };

        })

        .directive('aiViewer', ['$rootScope', '$viewer', function($rootScope, $view) {

            return {
                restrict: 'EA',
                scope: {
                    options: '&aiViewer'
                },
                link: function(scope, element) {

                    var defaults, init, options, $module;

                    defaults = {
                        scope: scope
                    };

                    init = function init() {

                        $module = $viewer(element, options);

                        // listen for route change and update state when animation is enabled.
                        $rootScope.$on('$routeChangeSuccess', function () {

                            var state = $module.getState(),
                                prevView = $module.getView();

                            if(state && scope.options.animate) {
                                // check for previously rendered views.
                                if(prevView)
                                    prevView.removeClass(state === 'forward' ? 'back' : 'forward').addClass(state);
                            }

                            scope.state = state;

                        });

                    };

                    options = angular.extend(defaults, scope.$eval(scope.options));

                    init();
                }
            };

        }]);

})();

