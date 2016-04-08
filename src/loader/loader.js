angular.module('ai.loader.factory', ['ai.helpers'])

    .provider('$loader', function $loader() {

        var defaults = {
                intercept: undefined,                               // when false loader intercepts disabled.
                template: 'ai-loader.html',                         // the default loader content template. only used
                                                                    // if content is not detected in the element.
                message: 'Loading',                                 // text to display under loader if value.
                delay: -1,                                         // the delay in ms before loader is shown.
                overflow: undefined,                                // hidden or auto when hidden overflow is hidden,
                                                                    // then toggled back to original body overflow.
                                                                    // default loader is set to hidden.
                onLoading: undefined                                // callback on loader shown, true to show false
                                                                    // to suppress. returns module and instances.
            }, get, set, page;

        set = function set (key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        get = [ '$q', '$rootScope', '$helpers',  function get($q, $rootScope, $helpers) {

            var loaderTemplate, instances, loaderUri;

            instances = {};
            loaderUri = 'data:image/gif;base64,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';
            loaderTemplate = '<div>' +
                                '<img src="' + loaderUri + '" />' +
                                '<div ng-bind="message" ng-show="message" class="ai-loader-message">test</div>' +
                            '</div>';

            $helpers.getPutTemplate(defaults.template, loaderTemplate);

            function ModuleFactory(name, element, options, attrs) {

                var $module = {},
                    body,
                    overflows,
                    htmlContent,
                    contentTemplate,
                    scope;

                // set global name if not passed.
                if(!angular.isString(name)){
                    attrs = options;
                    options = element;
                    element = name;
                    name = undefined;
                }

                // if no element can't create loader.
                if(!element)
                    return console.error('Cannot configure loader with element of undefined.');

                attrs = attrs || {};
                attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

                options = options || {};
                scope = $module.scope = options.scope || $rootScope.$new();
                $module.options = scope.options = options = angular.extend({}, defaults, attrs, options);
                $module.element = scope.element = element;

                options.name = options.name || name;

                if (!options.name) {
                  console.log('ai-loader could not initialize using name of undefined.');
                  return {};
                }

                if(options.name === 'page')
                    options.overflow = $module.options.overflow = scope.options.overflow = 'hidden';

                if(instances[options.name]){
                    $module = undefined;
                    return $module;
                }

                body = $helpers.findElement('body');
                overflows = $helpers.getOverflow();
                htmlContent = element.html();
                contentTemplate = options.template;

                if(htmlContent && htmlContent.length){
                    contentTemplate = htmlContent;
                    // remove element contents
                    // we'll add it back later.
                    element.empty();
                }

                // start the loader.
                function start() {
                    if(!$module.loading && !$module.disabled){
                        $module.loading = true;
                        if(angular.isFunction(options.onLoading)){
                            $q.when(options.onLoading($module, instances)).then(function(res) {
                                if(res){
                                    $module.loading = true;
                                    if(options.overflow)
                                        body.css({ overflow: 'hidden'});
                                    element.addClass('show');
                                }
                            });
                        } else {
                            $module.loading = true;
                            if(options.overflow)
                                body.css({ overflow: 'hidden'});
                            element.addClass('show');
                        }
                    }
                }

                // stop the loader.
                function stop() {
                    if(options.overflow)
                        body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                    if(element)
                        element.removeClass('show');
                    $module.loading = scope.loading = false;
                    $module.suppressed = scope.suppressed = false;
                }

                // suppresses once.
                function suppress() {
                    $module.suppressed = true;
                }

                // disable the loader
                function disable() {
                    $module.disabled = true;
                }

                // enable the loader
                function enable() {
                    $module.disabled = false;
                }

                // set/update options.
                // does not support live templates.
                function setOptions(key, value) {
                    var obj = key;
                    if(arguments.length > 1){
                        obj = {};
                        obj[key] = value;
                    }
                    options = $module.options = scope.options = angular.extend(options, obj);
                    scope.message = options.message;
                }

                function destroy() {
                    delete instances[$module.options.name];
                    scope.$destroy();
                }

                function init() {

                    $module.start = scope.start = start;
                    $module.stop = scope.stop = stop;
                    $module.set = scope.set = setOptions;
                    $module.suppress = scope.suppress = suppress;
                    $module.enable = scope.enable = enable;
                    $module.disable = scope.disable = disable;
                    scope.message = options.message;

                    $helpers.loadTemplate(contentTemplate).then(function (template) {
                        if(template) {
                            element.html(template);
                            $helpers.compile(scope, element.contents());
                            if(options.name === 'page')
                                element.addClass('ai-loader-page');
                        } else {
                            console.error('Error loading $loader template.');
                        }
                    });

                    // remove loader on location/route change.
                    $rootScope.$on('$locationChangeStart', function () {
                        if(element)
                            element.removeClass('show');
                        if(body && options.overflow)
                            body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                    });

                    scope.$watch($module.options, function (newVal, oldVal) {
                        if(newVal === oldVal) return;
                        scope.options = newVal;
                    });

                    scope.$on('destroy', function () {
                        $module.destroy();
                    });

                }

                init();

                return $module;
            }

            function getLoader(name, element, options) {
                var instance;
                if(!arguments.length)
                    return instances;
                else if(arguments.length === 1)
                    return instances[name];
                else
                    instance = ModuleFactory(name, element, options);
                if(instance && instance.options)
                    instances[instance.options.name] = instance;
                return instance;
            }

            // Add the default page loader.
            if (!Object.keys(instances).length) {
              var pageLoaderElem = angular.element('<ai-loader name="page">');
              var body = angular.element(document).find('body');
              getLoader(page, pageLoaderElem, { name: 'page' });
              body.append(pageLoaderElem);
            }

            return getLoader;

        }];

        // The default page loader
        // set to false to disable.
        page = 'page';

        return {
            $get: get,
            $set: set,
            $page: page
        };

    })

    .directive('aiLoader', [ '$loader', function ($loader) {

        return {
            restrict: 'EAC',
            link: function (scope, element, attrs) {

                var $module, defaults, options, watchKey, validKeys, instances;

                instances = $loader();

                defaults = {
                    scope: scope
                };

                validKeys = ['name', 'template', 'intercept', 'message', 'delay', 'overflow', 'onLoading'];

                // initialize the directive.
                function init () {
                    $module = $loader(element, options, attrs);
                }

                options = scope.$eval(attrs.aiLoader) || scope.$eval(attrs.aiLoaderOptions);
                options = angular.extend(defaults, options);

                // This is the default page
                // loader or invalid config.
                if (!options.name || options.name === 'page')
                  return;

                watchKey = attrs.aiLoader ? 'aiLoader' : 'aiLoaderOptions';
                scope.$watch(attrs[watchKey], function (newVal, oldVal) {
                    if(newVal === oldVal) return;
                    $module.set(newVal);
                });

                init();

            }

        };

    }]);

angular.module('ai.loader.interceptor', [])
    .factory('$loaderInterceptor', [ '$q', '$injector', '$timeout', function ($q, $injector, $timeout) {

        function getLoaders() {
            return $injector.get('$loader')();
        }

        // prevents loader from immediately showing
        // set options.delay.
        function delayLoader(_loader) {
            if(_loader.options.delay === 0 && !_loader.completed){
                _loader.start();
            } else {
                clearTimeout(_loader.timeoutId);
                _loader.timeoutId = $timeout(function () {
                    if(_loader.completed){
                        clearTimeout(_loader.timeoutId);
                        _loader.stop();
                    } else {
                        _loader.start();
                    }
                }, _loader.options.delay);
            }
        }

        function startLoaders() {
            var loaders = getLoaders();
            angular.forEach(loaders, function (_loader) {
                _loader.completed = false;
                if(_loader.options.intercept !== false){
                    if(!_loader.suppressed){
                        delayLoader(_loader);
                    }
                }
            });
        }

        function stopLoaders(){
            var loaders = getLoaders();
            angular.forEach(loaders, function (_loader) {
                _loader.completed = true;
                _loader.loading = false;
                _loader.stop();
            });
        }

        return {
            request: function (req) {
                startLoaders();
                return req || $q.when(req);
            },
            response: function (res) {
                stopLoaders();
                return res || $q.when(res);
            },
            responseError: function (res){
                stopLoaders();
                return $q.reject(res);
            }
        };
    }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('$loaderInterceptor');
    }]);

// imports above modules.
angular.module('ai.loader', [
    'ai.loader.factory',
    'ai.loader.interceptor'
]);
