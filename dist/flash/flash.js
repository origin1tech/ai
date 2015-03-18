
angular.module('ai.flash.factory', ['ai.helpers'])

    .provider('$flash', function $flash() {

        var defaults, get, set;

        // default settings.
        defaults = {
            template: 'ai-flash.html',              // the template for flash message.
            errorKey: 'err',
                                                    // if undefined validation errors are undefined.
            excludeErrors: [401, 403, 404],         // exclude errors by status type.           
            errorName: 'Unknown Exception',         // the error name to use in event and error.name is not valid.
            errorMessage: 'An unknown exception ' + // default error message in event one is not provided.
                          'has occurred, if the ' +
                          'problem persists ' +
                          'please contact the ' +
                          'administrator.',
            title: undefined,                       // when true flash error messages use the error name as the title
                                                    // in the flash message.
            stack: false,                           // when true stack trace is shown.
            multiple: false,                        // whether to allow multiple flash messages at same time.
            type: 'info',                           // the default type of message to show also the css class name.
            typeError: 'danger',                    // the error type or class name for error messages.
            timeout: 3500,                          // timeout to auto remove flashes after period of time..
                                                    // instead of by timeout.
            intercept: undefined,                   // when false flash error interception is disabled.
            onError: undefined                      // callback on error before flashed, return false to ignore.
        };

        // set global provider options.
        set = function set(key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        // get provider
        get = ['$rootScope', '$timeout', '$helpers',
            function get($rootScope, $timeout, $helpers) {

            var flashTemplate, $module;
 
            flashTemplate = '<div class="ai-flash-item" ng-repeat="flash in flashes" ng-mouseenter="enter(flash)" ' +
                            'ng-mouseleave="leave(flash)" ng-class="flash.type">' +
                                '<a class="ai-flash-close" type="button" ng-click="remove(flash)">&times</a>' +
                                '<div class="ai-flash-title" ng-if="flash.title" ng-bind-html="flash.title"></div>' +
                                '<div class="ai-flash-message" ng-bind-html="flash.message"></div>' +
                            '</div>';

            $helpers.getPutTemplate(defaults.template, flashTemplate);

            function tryParseTimeout(to) {
                if(undefined === to)
                    return to;
                try{
                   return JSON.parse(to);
                } catch(ex){
                    return to;
                }
            }

            // The flash factory
            function ModuleFactory() {

                var flashes = [],          
                    scope,
                    body,
                    overflows,
                    element,
                    options;
                
                $module = {};
                options = {};

                // uses timeout to auto remove flash message.
                function autoRemove(flash) {
                    clearTimeout(flash.timeoutId);
                    flash.timeoutId = $timeout(function () {
                        if(flash.focus) {
                            clearTimeout(flash.timeoutId);
                            autoRemove(flash);
                        } else {
                            clearTimeout(flash.timeoutId);
                            remove(flash);
                        }
                    }, flash.timeout);
                }
                
                // add a new flash message.
                function add(message, type, title, timeout) {
                    var flashDefaults = {
                            title: undefined,
                            type: options.type,
                            focus: false,
                            show: false,
                            timeout: false
                        }, flash = {}, tmpTitle;
                    title = tryParseTimeout(title);
                    timeout = tryParseTimeout(timeout);
                    // if title is number assume timeout
                    if(angular.isNumber(title) || 'boolean' === typeof title){
                        timeout = title;
                        title = undefined;
                    }
                    if(!options.multiple)
                        flashes = [];
                    // if message is not object create Flash.
                    if(!angular.isObject(message)){
                        flash = {
                            message: message,
                            type: type || options.type,
                            title: title || options.title,
                            timeout: timeout || options.timeout
                        };
                    }
                    // extend object with defaults.
                    flash = angular.extend({}, flashDefaults, flash);
                    // set the default timeout if true was passed.
                    if(flash.timeout === true)
                        flash.timeout = options.timeout;
                    if(flash.message) {
                        flashes.push(flash);
                        $module.flashes = scope.flashes = flashes;
                        body.css({ overflow: 'hidden'});
                        element.addClass('show');
                        if(flash.timeout)
                            autoRemove(flash);

                    }
                }
                
                // remove a specific flash message.
                function remove(flash) {
                    if(flash && flashes.length) {
                        flashes.splice(flashes.indexOf(flash), 1);
                        if(!flashes.length){
                            body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                            if(element)
                                element.removeClass('show');
                        }
                    }
                    
                }
                
                // remove all flash messages in collection.
                function removeAll() {
                    if(flashes.length) {
                        angular.forEach(flashes, function (flash) {
                            if(flash.shown === true)
                                remove(flash);
                            else
                                flash.shown = true;
                        });
                    }
                }

                // on flash enter set its focus to true
                // so it is not removed while being read.
                function enter(flash) {
                    flash.focus = true;
                }

                // on leave set the focus to false
                // can now be removed.
                function leave(flash) {
                    flash.focus = false;
                }
                
                function suppress() {
                    $module.suppressed = false;
                }

                function setOptions(key, value) {
                    var obj = key;
                    if(arguments.length > 1){
                        obj = {};
                        obj[key] = value;
                    }
                    $module = $module || {};
                    scope = scope || {};
                    options = $module.options = angular.extend(options, obj);
                    if(scope)
                        scope.options = options;
                }
                
                function destroy() {
                    if(element)
                        element.removeClass('show');
                    if(body)
                        body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                    scope.flashes = $module.flashes = flashes = [];
                    scope.$destroy();
                }
                
                // get overflows and body.
                body = $helpers.findElement('body');
                overflows = $helpers.getOverflow();
                
                function init(_element, _options, attrs) {
                    
                    element = _element;

                    // parse out relevant options
                    // from attributes.
                   attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);
                    
                    // extend options      
                    $module.scope = scope = _options.scope || $rootScope.$new();
                    options = angular.extend({}, defaults, attrs, options, _options);
                    options.onError = options.onError || function () { return true; };
                    $module.options = scope.options = options;

                    scope.add = add;
                    scope.remove = remove;
                    scope.removeAll = removeAll;
                    scope.flashes = flashes;
                    scope.leave = leave;
                    scope.enter = enter;
                    scope.set = setOptions;
                    scope.suppress = suppress;

                    $module.add = add;
                    $module.remove = remove;
                    $module.removeAll = removeAll;
                    $module.suppress = suppress;

                    // load the template.
                    $helpers.loadTemplate(options.template).then(function (template) {
                        if(template) {
                            element.html(template);
                            $helpers.compile(scope, element.contents());
                            element.addClass('ai-flash');
                        } else {
                            console.error('Error loading $flash template.');
                        }
                    });

                    // when route changes be sure
                    // to remove all flashes.
                    $rootScope.$on('$locationChangeStart', function () {
                        if(element)
                            element.removeClass('show');
                        if(body)
                            body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                        scope.flashes = $module.flashes = flashes = [];
                    });

                    scope.$watch($module.options, function (newVal, oldVal) {
                        if(newVal === oldVal) return;
                        scope.options = newVal;
                    });

                    scope.$on('destroy', function () {
                        $module.destroy();
                    });
                    
                }

                $module.set = setOptions;
                $module.init = init;
                
                return $module;
            }

            // $flash requires singleton
            function getInstance() {
                if(!$module)
                    $module = ModuleFactory();
                return $module;
            }

            // return $module instance.
            return getInstance();

        }];

        // return getter/setter.
        return {
            $set: set,
            $get: get
        };

    })

    .directive('aiFlash', [ '$flash', function ($flash) {

        return {
            restrict: 'EAC',
            scope: true,
            link: function (scope, element, attrs) {

                var $module, defaults, options;

                defaults = {
                    scope: scope
                };

                // initialize the directive.
                function init () {
                    $module = $flash.init(element, options, attrs);
                }

                options = scope.$eval(attrs.aiFlash) || scope.$eval(attrs.aiFlashOptions);
                options = angular.extend(defaults, options);

                init();

            }
        };
    }]);


angular.module('ai.flash.interceptor', [])
    .factory('$flashInterceptor', ['$q', '$injector', function ($q, $injector) {
        return {
            responseError: function(res) {
                
                // get passport here to prevent circular dependency.
                var flash = $injector.get('$flash'),
                    excludeErrors = flash.options.excludeErrors || [];
                
                // if interception is disabled
                // don't handle/show message.
                if(flash.options.intercept === false || flash.suppressed){
                    flash.suppressed = false;
                    return res;
                }                    
                
                function handleFlashError(errObj){
                    var name, message, stack;
                    if(flash.options.errorKey && errObj[flash.options.errorKey])
                        errObj = errObj[flash.options.errorKey];
                    name = errObj.displayName || errObj.name || flash.options.errorName;
                    message = errObj.message || flash.options.errorMessage;
                    stack = errObj.stack || '';
                    // handle stack trace.
                    if(stack && flash.options.stack){
                        if(angular.isArray(stack))
                            stack = stack.join('<br/>');
                        if(angular.isString(stack) && /\\n/g.test(stack))
                            stack = stack.split('\n').join('<br/>');
                        message += ('<br/><strong>Stack Trace:</strong><br/>' +  stack);
                    }
                    message = '<strong>Message:</strong> ' + message;
                    message = message.replace(/From previous event:/ig, '<strong>From previous event:</strong>');
                    // finally display the flash message.
                    if(flash.options.title !== false)
                        flash.add(message, flash.options.typeError, name);
                    else
                        flash.add(message, flash.options.typeError);
                    return $q.reject(res);
                }
                
                if(res.status && excludeErrors.indexOf(res.status) === -1){
                    // handle error using flash.
                    if(!res.data){                        
                        if(flash.options.title !== false)
                            flash.add(res.statusText, flash.options.typeError || 'flash-danger', res.status);
                        else
                            flash.add(res.statusText, flash.options.typeError || 'flash-danger');
                        return $q.reject(res);
                    } else {
                        var err = res.data;                     
                        $q.when(flash.options.onError(res, flash)).then(function (result) {
                            if(result){                                
                                if(result === true)
                                    result = err;                             
                                handleFlashError(result);                                
                            }                                
                        });                        
                    }
                }
            },
            response: function (res) {
                var flash = $injector.get('$flash');
                // ensure we turn disable once off.
                flash.suppressed = false;
                return res || $q.when(res);
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
