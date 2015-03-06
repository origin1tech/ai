angular.module('ai.viewer', ['ai.helpers'])

    .provider('$viewer', function $viewer() {

        var defaults = {
                template: '<div class="ai-viewer" ng-view />',
                viewCss: 'ai-viewer-view',
                animate: 'slide'
            },
            get, set;

        set = function set(options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$rootScope', '$helpers', '$location', function get($rootScope, $helprs, $location) {

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

            function ModuleFactory(element, options, attrs) {

                var $module = {},
                    view,
                    scope;

                if(attrs)
                    attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

                scope = options.scope || $rootScope.$new();
                options = scope.options = angular.extend({}, defaults, options);

                view = angular.element(options.template);
                view.addClass(options.viewCss);

                // only add ng-class state if animate is enabled.
                if(scope.options.animate)
                    view.attr('ng-class', 'state');

                view = $helpers.compile(scope, view);

                element.append(view);

                // gets previous view.
                $module.getView = function () {
                    return angular.element(document.querySelectorAll('.' + options.viewCss)[0]);
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

            return ModuleFactory;

        }];

        return {
            $get: get,
            $set: set
        };

    })

    .directive('aiViewer', ['$rootScope', '$viewer', function($rootScope, $viewer) {

        return {
            restrict: 'EA',
            link: function(scope, element) {

                var defaults, options, $module;

                defaults = {
                    scope: scope
                };

                function init() {

                    $module = $viewer(element, options, attrs);

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

                }

                options = attrs.aiViewer || attrs.aiViewerOptions;
                options = angular.extend(defaults, scope.$eval(options));

                init();
            }
        };

    }]);
