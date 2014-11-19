
angular.module('ai.flash.factory', [])

    .run(['$templateCache', function ($templateCache) {
        var template =  '<div class="flash alert" ng-repeat="flash in flashes" ng-mouseenter="enter(flash)" ng-mouseleave="leave(flash)" ng-class="flash.type">' +
                            '<button class="flash-close" type="button" ng-click="remove(flash)">&times</button>' +
                            '<div class="flash-title" ng-if="flash.title" ng-bind-html="flash.title"></div>' +
                            '<div class="flash-message" ng-bind-html="flash.message"></div>' +
                        '</div>';
        $templateCache.put('flash.tpl.html', template);
    }])

    .provider('$flash', function $flash() {

        var defaults, get, set;

        // default settings.
        defaults = {
            template: 'flash.tpl.html',             // the template for flash message.
            html: true,                             // when true html flash messages can be used.(requires ngSanitize)
            errors: true,                           // when true flash messages shown on errors.
            excludeErrors: [401, 403, 404],         // exclude errors by status type.
            multiple: false,                        // whether to allow multiple flash messages at same time.
            type: 'flash-info',                     // the type of message to show also the css class name.
            animation: false,                       // provide class name for animation.
            timeout: 3500                           // timeout for auto remove flashes.
                                                    // instead of by timeout.
        };

        // set global provider options.
        set = function (value) {
            defaults = angular.extend(defaults, value);
        };

        // get provider
        get = ['$rootScope', '$q', '$templateCache', function ($rootScope, $q, $templateCache) {

            // helper methods used internally.
            var helpers = {

                find: function find(query, element) {
                    return angular.element((element || document).querySelectorAll(query));
                },

                // helper function to load template
                fetch: function fetch(template) {
                    return $q.when($templateCache.get(template) || $http.get(template))
                        .then(function (res) {
                            if (angular.isObject(res)) {
                                $templateCache.put(template, res.data);
                                return res.data;
                            }
                            return res;
                        });
                },
                
                canSanitize: function canSanitize() {
                    try {
                        angular.module("ngSanitize");
                    } catch(err) {
                        throw new Error('ngSanitize is required by ai-flash.');
                    }
                }

            }, instance;

            // The flash factory
            function ModuleFactory(options) {

                var $module = {};

                options = $module.options = angular.extend(defaults, options);

                // collection of flashes.
                $module.flashes = [];

                // expose helper methods.
                $module.helpers = helpers;
                
                // add a new flash message.
                $module.add = function (message, type, title, timeout) {
                    var flash = message,
                        flashDefaults = {
                            type: options.type,
                            focus: false,
                            show: false,
                            timeout: false
                        };
                    // if title is number assume timeout
                    if(angular.isNumber(title)){
                        timeout = title;
                        title = undefined;
                    }
                    if(timeout )
                    if(!options.multiple)
                        $module.flashes = [];
                    // if message is not object create Flash.
                    if(!angular.isObject(message)){
                        flash = {
                            title: title,
                            message: message,
                            type: type
                        };
                    }
                    // extend object with defaults.
                    flash = angular.extend(flashDefaults, flash);
                    // set the default timeout if true was passed.
                    if(flash.timeout === true)
                        flash.timeout = options.timeout;
                    if(flash.message) {
                        $module.flashes.push(flash);
                        $rootScope.$broadcast('flash:add', { flash: flash, flashes: $module.flashes });
                    }
                };
                
                // remove a specific flash message.
                $module.remove = function (flash) {
                    if(flash && $module.flashes.length) {
                        $module.flashes.splice($module.flashes.indexOf(flash), 1);
                        $rootScope.$broadcast('flash:remove', { flash: flash, flashes: $module.flashes});
                    }
                };
                
                // remove all flash messages in collection.
                $module.removeAll = function () {
                    if($module.flashes.length) {
                        angular.forEach($module.flashes, function (flash) {
                            if(flash.shown === true)
                                $module.remove(flash);
                            else
                                flash.shown = true;
                        });
                    }
                };

                // reinit the module.
                $module.init = function (options) {
                    instance = new ModuleFactory(options);
                };

                // when route changes be sure
                // to remove all flashes.
                $rootScope.$on('$routeChangeStart', function () {
                    $module.removeAll();
                    $rootScope.$broadcast('flash:routing', { flashes: []});
                });


                return $module;
            }

            function getInstance() {
                if(!instance)
                    return new ModuleFactory();
                return instance;
            }

            return getInstance();
        }];

        // return getter/setter.
        return {
            $set: set,
            $get: get
        };

    })

    .directive('aiFlash', [ '$compile', '$timeout', '$flash', function ($compile, $timeout,$flash) {

        return {
            restrict: 'EAC',
            scope: true,
            link: function (scope, element) {

                var directive, init;

                // initialize the directive.
                init = function () {

                    var body, bodyOverflow, bodyOverflowY;
                    // for consistency define as directive.
                    directive = $flash;

                    // reference body element for overflow.
                    body = directive.helpers.find('body');

                    function getOverflow() {
                        // reference original body overflow style.
                        bodyOverflow = body[0].style.overflow || undefined;
                        bodyOverflowY = body[0].style.overflowY || undefined;
                    }

                    // auto removes flash after
                    // timeout when enabled.
                    function autoRemove(flash) {
                        clearTimeout(flash.timeoutId);
                        flash.timeoutId = $timeout(function () {
                            if(flash.focus) {
                                clearTimeout(flash.timeoutId);
                                autoRemove(flash);
                            } else {
                                clearTimeout(flash.timeoutId);
                                directive.remove(flash);
                            }

                        }, flash.timeout);
                    }

                    // on flash enter set its focus to true
                    // so it is not removed while being read.
                    scope.enter = function (flash) {
                        flash.focus = true;
                    };

                    // on leave set the focus to false
                    // can now be removed.
                    scope.leave = function (flash) {
                        flash.focus = false;
                    };

                    // remove flash from collection.
                    scope.remove = function (flash) {
                        directive.remove(flash);
                    };

                    // listener when flash messages are added.
                    scope.$on('flash:add', function (e, obj) {
                        var flash = obj.flash;
                        getOverflow();
                        scope.flashes = directive.flashes;
                        body.css({ overflow: 'hidden'});
                        element.addClass('show');
                        if(flash.timeout)
                            autoRemove(flash);
                    });

                    scope.$on('flash:remove', function (e, obj) {
                        var removed = obj.flash;
                        if(!scope.flashes.length){
                            body.css({ overflow: bodyOverflow, 'overflow-y': bodyOverflowY });
                            element.removeClass('show');
                        }
                    });

                    scope.$on('flash:routing', function (e, obj) {
                        element.removeClass('show');
                        body.css({ overflow: bodyOverflow, 'overflow-y': bodyOverflowY });
                        scope.flashes = [];
                    });

                    // add template to element.
                    element.addClass('flash-wrapper');

                    // compile the element
                    directive.helpers.fetch(directive.options.template).then(function (template) {
                        template = $compile(template)(scope);
                        element.append(template);
                    });

                };

                init();

            }
        };
    }]);


angular.module('ai.flash.interceptor', [])
    .factory('$flashInterceptor', ['$q', '$injector', function ($q, $injector) {
        return {
            responseError: function(res) {
                // get passport here to prevent circ dependency.
                var flash = $injector.get('$flash'),
                    excludeErrors = flash.options.excludeErrors || [];
                if(res.status && excludeErrors.indexOf(res.status) === -1){
                    // handle error using flash.    
                    console.log(res);
                }
                return $q.reject(res);
            }
        };
    }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('$flashInterceptor');
    }]);

// imports above modules.
angular.module('ai.flash', [
    'ai.flash.factory',
    'ai.flash.interceptor'
]);
