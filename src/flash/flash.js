
angular.module('ai.flash.factory', [])

    .run(['$templateCache', function ($templateCache) {
        var template =  '<div class="ai-flash alert" ng-repeat="flash in flashes" ng-mouseenter="enter(flash)" ng-mouseleave="leave(flash)" ng-class="flash.type">' +
                            '<button class="ai-flash-close" type="button" ng-click="remove(flash)">&times</button>' +
                            '<div class="ai-flash-title" ng-if="flash.title" ng-bind-html="flash.title"></div>' +
                            '<div class="ai-flash-message" ng-bind-html="flash.message"></div>' +
                        '</div>';
        $templateCache.put('flash.tpl.html', template);
    }])

    .provider('$flash', function $flash() {

        var defaults, get, set;

        // default settings.
        defaults = {
            template: 'flash.tpl.html',             // the template for flash message.
            html: true,                             // when true html flash messages can be used.(requires ngSanitize)
            errors: true,                           // when true flash is shown automatically on http status errors.
            excludeErrors: [401, 403, 404],         // exclude errors by status type.
            errorName: 'Unknown Exception',         // the error name to use in event and error.name is not valid.
            errorMessage: 'An unknown exception ' + // default error message in event one is not provided.
                          'has occurred, if the ' +
                          'problem persists ' +
                          'please contact the ' +
                          'administrator.',
            multiple: false,                        // whether to allow multiple flash messages at same time.
            type: 'ai-flash-info',                  // the default type of message to show also the css class name.
            typeError: 'ai-flash-danger',           // the error type or class name for error messages.
            animation: false,                       // provide class name for animation.
            timeout: 3500,                          // timeout to auto remove flashes after period of time..
                                                    // instead of by timeout.
            onError: undefined                      // function called on error before flashed, return false to ignore.

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

                    if(!options.multiple)
                        $module.flashes = [];
                    // if message is not object create Flash.
                    if(!angular.isObject(message)){
                        flash = {
                            title: title,
                            message: message,
                            type: type,
                            timeout: timeout
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

    .directive('aiFlash', [ '$compile', '$timeout', '$flash', function ($compile, $timeout, $flash) {

        return {
            restrict: 'EAC',
            scope: true,
            link: function (scope, element) {

                var directive;

                // initialize the directive.
                function init () {

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

                }

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
                function handleFlashError(errObj){
                    var name, message, stack;
                    name = errObj.name || flash.options.errorName;
                    message = errObj.message || flash.options.errorMessage;
                    stack = errObj.stack || '';
                    if(stack){
                        if(angular.isArray(stack))
                            stack = stack.join('<br/>');
                        if(angular.isString(stack) && /\\n/g.test(stack))
                            stack = stack.split('\n').join('<br/>');
                        message += ('<br/><strong>Stack Trace:</strong><br/>' +  stack);
                    }
                    message = '<strong>Message:</strong> ' + message;
                    message = message.replace(/From previous event:/ig, '<strong>From previous event:</strong>');
                    flash.add(message, flash.options.typeError, name);
                }
                if(res.status && excludeErrors.indexOf(res.status) === -1){
                    // handle error using flash.
                    if(!res.data){
                        flash.add(res.statusText, flash.options.typeError || 'flash-danger', res.status);
                    } else {
                        var err = res.data,
                            handle;
                        if(flash.options.onError){
                            handle = flash.options.onError.call(this, res);
                            if(handle === true)
                                handleFlashError(err);
                            if(angular.isObject(handle))
                                handleFlashError(handle);
                        } else {
                            handleFlashError(err);
                        }
                    }
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
