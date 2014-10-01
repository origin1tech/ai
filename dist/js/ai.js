
var $app = (function (app) {
    'use strict';

    // initialize the app object.
    app = app || {};

    // set namespace for application.
    app.ns = 'app';

    // prepends base namespace.
    app.generateNs = function (suffix) {
        return app.ns + '.' + suffix;
    };

    // initialize areas object.
    app.areas = {};

    // initialize supported components.
    app.components = {};

    // base path to be prepended to view templates.
    app.viewBase = '';

    // check if module is loaded.
    app.tryModule = function (module) {
        try {
            return angular.module(module);
        } catch(e) {
            return false;
        }
    };

    // empty func to prevent calling undefined.
    app.noop = function () {};

    app.log = function (msg) {
        if(angular.isObject(msg))
            console.log('\n' + JSON.stringify(msg, null, 4) + '\n');
        else
            console.log(msg);
    };

    // shims

    function isBoolean(value) {
        return (value === true || value === false || value && typeof value == 'object' &&
            toString.call(value) == '[object Boolean]') || false;
    }
    angular.isBoolean = angular.isBoolean || isBoolean;

    /**
     * Area class
     * @description - accessible only within the app namespace.
     * @class
     * @param {string} name - the name of the area.
     * @param {object} options - initialization options.
     * @returns {Area}
     * @constructor
     */
    function Area(name, options) {

        var self = this;
        this.name = name;
        this.routes = undefined;
        this.module = null;
        this.access = 0;
        this.components = [];
        this.dependencies = [];
        this.actions = {};
        this.inactive = false;

        // area component registration.
        this.register = {
            controller: function(name, component) {
                self.components.push([name, component, 'controller']);
            },
            directive: function(name, component) {
                self.components.push([name, component, 'directive']);
            },
            factory: function(name, component) {
                self.components.push([name, component, 'factory']);
            },
            service: function(name, component) {
                self.components.push([name, component, 'service']);
            },
            filter: function(name, component) {
                self.components.push([name, component, 'filter']);
            }
        };

        // function was passed set it to init.
        if(angular.isFunction(options))
            options = { init: options };

        // extend the area.
        angular.extend(this, options);

        return this;
    }

    // expose Area, Route publicly.
    app.Area = Area;

    Object.defineProperty(app.areas, 'register', {
        enumerable: false,
        value: function (name, options) {
            if(!app.areas[name]){
                app.areas[name] = new Area(name, options);
            } else {
                app.areas[name] = angular.extend(app.areas[name], options);
            }
            return app.areas[name];
        }
    });

    Object.defineProperty(app.areas, 'get', {
        enumerable: false,
        value: function (name) {
            if(!name)
                return app.areas;
            return app.areas[name];
        }
    });

    /**
     * Register application Routes
     * @private
     * @param {object} area - the module/area to register routes for.
     * @param {object} config - the original area configuration.
     */
    function registerRoutes(area, config) {
        area.config(['$routeProvider', function ($routeProvider) {
            angular.forEach(config.routes, function (v,k) {
                if(k === 'otherwise'){
                    $routeProvider.otherwise(v);
                } else {
                    v.area = config;
                    $routeProvider.when(k, v);
                }
            });
        }]);
    }

    /**
     * Register application Areas.
     * @description - register Areas as dependency with the application at init.
     * @private
     */
    function registerAreas(modules) {
        angular.forEach(app.areas, function (v) {
            var area;
            if(!v.name) return;
            // check for manual init or simple register
            if(v.init){
                area = v.init(); // init must return module.
            } else {
                v.ns = app.generateNs(v.name);
                area = angular.module(v.ns, v.dependencies);
            }
            // update ns, may have changed.
            v.ns = area.name;
            modules.push(v.ns);
            if(app.config && app.tryModule(app.config.routeModule))
                registerRoutes(area, v);
        });
    }

    /**
     * Register area components.
     * @description - registers components for a give area.
     * @private
     */
    function registerComponents() {
        // register area components.
        angular.forEach(app.areas, function (v){
            angular.forEach(v.components, function (v) {
                var type = v[2] || undefined;
                if(type && app.components[type]){
                    app.components[type].apply(null, v);
                } else {
                    throw new Error('Unable to register component of type ' + type);
                }
            });
        });
    }

    /**
     * Initializes app.
     * @description - registers areas as dependencies of application.
     * @param {array} modules - the base modules for primary module.
     * @param {object} config - application configuration settings.
     * @param {object|string} pkg - additional value to expose to application.
     */
    app.init = function init(modules, config, pkg) {

        var _app, defaults;

        defaults = {
            modules: [],
            routeModule: 'ngRoute',
            defaultRoute: '/',              // set to false to disable default route.
            defaultRouteOptions: {},
            otherwise: '/',
            viewBase: '',
            html5Mode: true
        };

        config = angular.extend(defaults, config, pkg);
        modules = modules || config.modules || [];
        app.ns = config.ns || 'app';
        app.viewBase = config.viewBase;

        // property used for passing in additional package/application object.
        app.pkg = pkg || config.pkg || '';

        // store the configuration.
        app.config = config;

        // register area modules.
        registerAreas(modules);

        // init the main module.
        _app = angular.module(app.ns, modules,


            ['$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
                function ($controllerProvider, $compileProvider, $filterProvider, $provide) {

                    // bind component providers to components.
                    app.components.controller = $controllerProvider.register;
                    app.components.directive = $compileProvider.directive;
                    app.components.factory = $provide.factory;
                    app.components.service = $provide.service;
                    app.components.filter = $filterProvider.register;

                    // register components for each area.
                    registerComponents();

                }])

            .config(['$locationProvider', '$injector', function ($locationProvider, $injector) {

                var html5Mode = { enabled: true, requireBase: false };
                if(angular.isBoolean(config.html5Mode))
                    config.html5Mode = { enabled: config.html5Mode };
                html5Mode = angular.extend(html5Mode, config.html5Mode);

                $locationProvider.html5Mode(html5Mode);

                // handle default route.
                if(app.tryModule(config.routeModule) && config.defaultRoute){
                    $injector.invoke(['$routeProvider', function ($routeProvider) {
                        $routeProvider.when('/', config.routeOptions);
                        if(config.otherwise)
                            $routeProvider.otherwise({redirectTo: config.otherwise});
                    }]);
                }

            }]);



        // merge in primary module.
        angular.extend(app, _app);

        // bootstrap Angular application.
        angular.element(document).ready(function () {
            angular.bootstrap(document, [app.ns]);
        });

    };

    return app;

})($app);


(function () {
    'use strict';

    angular.module('ai.click2call', [])

        .provider('$click2call', function $click2call() {

            var defaults, get, set, baseTemplate;

            // default settings.
            defaults = {
                gvid: undefined,
                template: 'ai-click2call',
                message: 'O.K we\'re calling to connect you! Be just a sec...'
            };

            // the base template,
            // you may define custom templates as well.
            baseTemplate = '<form name="c2cForm" class="ai-click2call" novalidate ng-submit="call(c2cForm, model)">' +
                '<div class="form-group">' +
                '<input class="form-control" name="name" type="text" ng-model="model.name" ' +
                'placeholder="Name (optional)" />' +
                '</div>' +
                '<div class="form-group">' +
                '<input class="form-control" name="number" type="text" ng-model="model.number" ' +
                'placeholder="Number (7605551212)" required/>' +
                '<span class="ai-click2call-error" ' +
                'ng-show="c2cForm.name.$error.required || (c2cForm.$dirty && c2cForm.$invalid)">' +
                'Your number is required.</span>' +
                '</div>' +
                '<p>' +
                '<button class="btn btn-primary btn-block" type="submit">' +
                'Call Now</button>' +
                '</p>' +
                '<p class="ai-click2call-message" ng-show="model.calling" ng-bind="model.message"></p>'+
                '</form>';

            // set global provider options.
            set = function (value) {
                defaults = angular.extend(defaults, value);
            };

            // get provider
            get = ['$rootScope', '$templateCache', '$http', '$q', '$compile',
                function ($rootScope, $templateCache, $http, $q, $compile) {

                    var helpers = {

                        /**
                         * Finds element using provided query.
                         * @param {string} query - the path to find.
                         * @param {string} element - the element root path.
                         * @returns {element}
                         */
                        find: function find(query, element) {
                            return angular.element((element || document).querySelectorAll(query));
                        },

                        /**
                         * Fetches and/or stores template from $templateCache.
                         * @param {string} template - the markup or path to the template.
                         * @returns {string}
                         */
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

                        /**
                         * Validates if string has HTML contents.
                         * @private
                         * @param {string} str - the string to validate.
                         * @returns {boolean}
                         */
                        isHtml: function isHtml(str) {
                            var expStr = '<(br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|wbr|' +
                                    '!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|' +
                                    'button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|' +
                                    'div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|' +
                                    'h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|' +
                                    'noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|' +
                                    'small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|' +
                                    'title|tr|track|tt|u|ul|var|video).*?<\/2>',
                                regex = new RegExp(expStr);
                            return regex.test(str);
                        },

                        /**
                         * Tests string path to verify that its extension is either html or tpl.
                         * @param {string} str - the path to validate.
                         * @returns {boolean}
                         */
                        isPath: function isPath(str) {
                            var ext = str.split('.').pop();
                            return ext === 'html' || ext === 'tpl';
                        }

                    };

                    // load template if exists.
                    if(defaults.template)
                        if(!$templateCache.get(defaults.template))
                            $templateCache.put(defaults.template, baseTemplate);

                    /**
                     * Factory that builds the provider.
                     * @param {element} element - the element which to apply the module.
                     * @param {object} config - module configuration options.
                     * @returns {object}
                     * @constructor
                     */
                    function ModuleFactory(element, config) {

                        var $module = {},
                            options,
                            scope;

                        scope = options.scope || $rootScope.$new();
                        options = scope.options = angular.extend(defaults, options);

                        scope.model = {
                            message: options.message
                        };

                        // add iframe & submit.
                        function call(buttonId, cidNumber, cidName) {

                            var iframe = document.createElement('iframe'),
                                doc, form, input;

                            iframe.style.width = 0;
                            iframe.style.height = 0;
                            iframe.style.border = 0;
                            document.body.appendChild(iframe);

                            if(iframe.contentDocument)
                                doc = iframe.contentDocument;
                            else if(iframe.contentWindow)
                                doc = iframe.contentWindow.document;
                            else if(iframe.document)
                                doc = iframe.document;
                            if(doc === null)
                                throw new Error('Document not initialized');

                            doc.open(); doc.write('');doc.close();

                            form = doc.createElement('form');

                            form.method='post';
                            form.action='https://clients4.google.com/voice/embed/webButtonConnect';

                            input = doc.createElement('input');
                            input.type='text';
                            input.name='buttonId';
                            input.value= '' + buttonId;
                            form.appendChild(input);

                            input = doc.createElement('input');
                            input.type='text';
                            input.name='callerNumber';
                            input.value= '' + cidNumber;
                            form.appendChild(input);

                            input = doc.createElement('input');
                            input.type='text';
                            input.name='name';
                            input.value= '' + cidName;
                            form.appendChild(input);

                            input = doc.createElement('input');
                            input.type='text';
                            input.name='showCallerNumber';
                            input.value= '1';
                            form.appendChild(input);

                            doc.body.appendChild(form);

                            form.submit();

                        }

                        // add call event to scope.
                        scope.call = $module.call = function (form, model) {
                            if(!model || !model.number) return alert('Oops you forgot your number!');
                            if(!form.$valid) return;
                            model.number = model.number.replace(/\D/g, '');
                            model.calling = true;
                            if(model.number.length < 10)
                                return alert('Oops that doesn\'t look like enough numbers.');
                            if(model.number.charAt(0) !== '1')
                                model.number = '1' + model.number;
                            call(options.gvid, model.number, model.name || 'Unknown');
                        };

                        // append the template.
                        helpers.fetch(options.template).then(function (template) {
                            template = $compile(template)(scope);
                            element.append(template);
                        });

                        return $module;
                    }

                    return ModuleFactory;
                }];

            // retun getter/setter.
            return {
                $set: set,
                $get: get
            };

        })
        .directive('aiClick2call', ['$click2call', function ($click2call) {

            return{
                restrict: 'EAC',
                scope: {
                    options: '&aiClick2call'
                },
                link: function (scope, element, attrs) {

                    var defaults, directive, init, options;

                    defaults = {
                        scope: scope
                    };

                    // initialize the directive.
                    init = function () {
                        directive = $click2call(element, options);
                    };

                    // merge options.
                    options = angular.extend(defaults, scope.$eval(scope.options));

                    init();

                }
            };
        }]);

})();


(function () {
    'use strict';
    /**
     * Ai Module
     * @description - imports all Ai modules as dependencies.
     */
    angular.module('ai', [

        /* PROVIDERS
         *****************************************/

    /**
     * Google Voice Click2Call
     * @description - Includes directive for connecting client to Google Voice number.
     */
        'ai.click2call',

    /**
     * Storage service.
     * @description - saves values to local storage with cookie fallback.
     */
        'ai.storage',

    /**
     * Transition Navigator
     * @description - Navigates between ng-views using CSS3 transitions.
     */
        'ai.viewer',

        /* Directives
         *****************************************/

    /**
     * Nicescroll Directive
     * @description - Ports nicescroll to an Angular directive.
     * @see http://areaaperta.com/nicescroll/
     */
        'ai.nicescroll'

    ]);
})();


(function () {
    'use strict';

    angular.module('ai.nicescroll', [])

        .directive('aiNicescroll', [function() {

            return {
                restrict: 'EAC',
                scope: {
                    options: '&aiNicescroll'
                },
                link: function(scope, element) {

                    var defaults, init, plugin;

                    console.assert(window.NiceScroll, 'ai-nicescroll requires the NiceScroll library ' +
                        'see: http://areaaperta.com/nicescroll/');

                    defaults = {
                        horizrailenabled: false
                    };
                    init = function init() {
                        plugin = element.niceScroll(scope.options);
                    };
                    scope.options = angular.extend(defaults, scope.$eval(scope.options));
                    init();
                }
            };
        }]);

})();


(function () {
    'use strict';

    angular.module('ai.storage', [])

        .provider('$storage', function $storage() {

            var defaults = {
                ns: 'app',              // the namespace for saving cookie/localStorage keys.
                cookiePath: '/',        // the path for storing cookies.
                cookieExpiry: 30        // the time in minutes for which cookies expires.
            }, get, set;


            /**
             * Checks if cookies or localStorage are supported.
             * @private
             * @param {boolean} [cookie] - when true checks for cookie support otherwise checks localStorage.
             * @returns {boolean}
             */
            function supports(cookie) {
                if(!cookie)
                    return ('localStorage' in window && window.localStorage !== null);
                else
                    return navigator.cookieEnabled || ("cookie" in document && (document.cookie.length > 0 ||
                        (document.cookie = "test").indexOf.call(document.cookie, "test") > -1));
            }

            /**
             * Get element by property name.
             * @private
             * @param {object} obj - the object to parse.
             * @param {array} keys - array of keys to filter by.
             * @param {*} [def] - default value if not found.
             * @param {number} [ctr] - internal counter for looping.
             * @returns {*}
             */
            function getByProperty(obj, keys, def, ctr) {
                if (!keys) return def;
                def = def || null;
                ctr = ctr || 0;
                var len = keys.length;
                for (var p in obj) {
                    if (obj.hasOwnProperty(p)) {
                        if (p === keys[ctr]) {
                            if ((len - 1) > ctr && angular.isObject(obj[p])) {
                                ctr += 1;
                                return getByProperty(obj[p], keys, def, ctr) || def;
                            }
                            else {
                                return obj[p] || def;
                            }
                        }
                    }
                }
                return def;
            }

            /**
             * Sets provider defaults.
             * @param {object} options - the options to be merged with defaults.
             */
            set = function (options) {
                defaults = angular.extend(defaults, options);
            };

            /**
             * Angular get method for returning factory.
             * @type {*[]}
             */
            get = [ function () {

                function StorageFactory(options) {

                    var $module = {},
                        ns, cookie, nsLen,
                        cookieSupport, storageSupport;

                    // extend defaults with supplied options.
                    options = angular.extend(defaults, options);

                    // set the namespace.
                    ns = options.ns + '.';

                    // get the namespace length.
                    nsLen = ns.length;

                    storageSupport = supports();
                    cookieSupport = supports(true);

                    // make sure either cookies or local storage are supported.
                    if (!storageSupport && !cookieSupport)
                        return new Error('Storage Factory requires localStorage browser support or cookies must be enabled.');

                    /**
                     * Get list of storage keys.
                     * @memberof StorageFactory
                     * @private
                     * @returns {array}
                     */
                    function storageKeys() {

                        if (!storageSupport)
                            return new Error('Keys can only be obtained when localStorage is available.');
                        var keys = [];
                        for (var key in localStorage) {
                            if(localStorage.hasOwnProperty(key)) {
                                if (key.substr(0, nsLen) === ns) {
                                    try {
                                        keys.push(key.substr(nsLen));
                                    } catch (e) {
                                        return e;
                                    }
                                }
                            }
                        }
                        return keys;
                    }

                    /**
                     * Set storage value.
                     * @memberof StorageFactory
                     * @private
                     * @param {string} key - the key to set.
                     * @param {*} value - the value to set.
                     */
                    function setStorage(key, value) {
                        if (!storageSupport)
                            return setCookie(key, value);
                        if (typeof value === undefined)
                            value = null;
                        try {
                            if (angular.isObject(value) || angular.isArray(value))
                                value = angular.toJson(value);
                            localStorage.setItem(ns + key, value);
                        } catch (e) {
                            return setCookie(key, value);
                        }
                    }

                    /**
                     * Get storate by key
                     * @memberof StorageFactory
                     * @private
                     * @param {string} key - the storage key to lookup.
                     * @param {string} [property] - the property name to find.
                     * @returns {*}
                     */
                    function getStorage(key, property) {
                        var item;
                        if(property)
                            return getProperty(key, property);
                        if (!storageSupport)
                            return getCookie(key);
                        item = localStorage.getItem(ns + key);
                        if (!item)
                            return null;
                        if (item.charAt(0) === "{" || item.charAt(0) === "[")
                            return angular.fromJson(item);
                        return item;
                    }

                    /**
                     * Get object property.
                     * @memberof StorageFactory
                     * @private
                     * @param {string} key - the storage key.
                     * @param {string} property - the property to lookup.
                     * @returns {*}
                     */
                    function getProperty(key, property) {
                        var item, isObject;
                        if(!storageSupport)
                            return new Error('Cannot get by property, localStorage must be enabled.');
                        item = getStorage(key);
                        isObject = angular.isObject(item) || false;
                        if (item) {
                            if (isObject)
                                return getByProperty(item, property);
                            else
                                return item;
                        } else {
                            return new Error('Invalid operation, storage item must be an object.');
                        }
                    }

                    /**
                     * Delete storage item.
                     * @memberof StorageFactory
                     * @private
                     * @param {string} key
                     * @returns {boolean}
                     */
                    function deleteStorage (key) {
                        if (!storageSupport)
                            return deleteCookie(key);
                        try {
                            localStorage.removeItem(ns + key);
                        } catch (e) {
                            return deleteCookie(key);
                        }
                    }

                    /**
                     * Clear all storage CAUTION!!
                     * @memberof StorageFactory
                     * @private
                     */
                    function clearStorage () {

                        if (!storageSupport)
                            return clearCookie();

                        for (var key in localStorage) {
                            if(localStorage.hasOwnProperty(key)) {
                                if (key.substr(0, nsLen) === ns) {
                                    try {
                                        deleteStorage(key.substr(nsLen));
                                    } catch (e) {
                                        return clearCookie();
                                    }
                                }
                            }
                        }
                    }


                    /**
                     * Set a cookie.
                     * @memberof StorageFactory
                     * @private
                     * @param {string} key - the key to set.
                     * @param {*} value - the value to set.
                     */
                    function setCookie (key, value) {

                        if (typeof value === undefined) return false;

                        if (!cookieSupport)
                            return new Error('Cookies are not supported by this browser.');
                        try {
                            var expiry = '',
                                expiryDate = new Date();
                            if (value === null) {
                                cookie.expiry = -1;
                                value = '';
                            }
                            if (cookie.expiry) {
                                expiryDate.setTime(expiryDate.getTime() + (options.cookieExpiry * 24 * 60 * 60 * 1000));
                                expiry = "; expires=" + expiryDate.toGMTString();
                            }
                            if (!!key)
                                document.cookie = ns + key + "=" + encodeURIComponent(value) + expiry + "; path=" +
                                    options.cookiePath;
                        } catch (e) {
                            throw e;
                        }
                    }


                    /**
                     * Get a cookie by key.
                     * @memberof StorageFactory
                     * @private
                     * @param {string} key - the key to find.
                     * @returns {*}
                     */
                    function getCookie (key) {

                        if (!cookieSupport)
                            return new Error('Cookies are not supported by this browser.');
                        var cookies = document.cookie.split(';');
                        for (var i = 0; i < cookies.length; i++) {
                            var ck = cookies[i];
                            while (ck.charAt(0) === ' ')
                                ck = ck.substring(1, ck.length);
                            if (ck.indexOf(ns + key + '=') === 0)
                                return decodeURIComponent(ck.substring(ns.length + key.length + 1, ck.length));
                        }
                        return null;
                    }

                    /**
                     * Delete a cookie by key.
                     * @memberof StorageFactory
                     * @private
                     * @param key
                     */
                    function deleteCookie(key) {
                        setCookie(key, null);
                    }

                    /**
                     * Clear all cookies CAUTION!!
                     * @memberof StorageFactory
                     * @private
                     */
                    function clearCookie() {
                        var ck = null,
                            cookies = document.cookie.split(';'),
                            key;
                        for (var i = 0; i < cookies.length; i++) {
                            ck = cookies[i];
                            while (ck.charAt(0) === ' ')
                                ck = ck.substring(1, ck.length);
                            key = ck.substring(nsLen, ck.indexOf('='));
                            return deleteCookie(key);
                        }
                    }

                    //check for browser support
                    $module.supports =  {
                        localStorage: supports(),
                        cookies: supports(true)
                    };

                    // storage methods.
                    $module.get = getStorage;
                    $module.set = setStorage;
                    $module.delete = deleteStorage;
                    $module.clear = clearStorage;
                    $module.storage = {
                        keys: storageKeys,
                        supported: storageSupport
                    };
                    $module.cookie = {
                        get: getCookie,
                        set: setCookie,
                        'delete': deleteCookie,
                        clear: clearCookie,
                        supported: cookieSupport
                    };

                    return $module;

                }

                return StorageFactory;

            }];

            return {
                $set: set,
                $get: get
            };

        });

})();





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

