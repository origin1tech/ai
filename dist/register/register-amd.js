define([], function () {
    'use strict';

    // initialize the app object.
    app = app || {};

    // set namespace for application.
    app.ns = 'app';

    // prepends base namespace.
    app.createNamespace = function (suffix) {
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

    // simple wrappers for common
    // console functions. can be overridden.
    app.log = console.log;
    app.warn = console.warn;
    app.error = console.error;
    app.assert = console.assert;

    function isBoolean(value) {
        return (value === true || value === false || value && typeof value === 'object' &&
            toString.call(value) === '[object Boolean]') || false;
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
            },
            routes: function (routes){
                if(angular.isObject(routes))
                    return console.warn('Routes must be an object.');
                angular.forEach(routes, function () {
                    registerRoutes(self.module, self, true);
                });
            }

        };

        // function was passed set it to init.
        if(angular.isFunction(options))
            options = { init: options };

        // extend the area.
        angular.extend(this, options);

        return this;
    }

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
     * @param {object} routesOnly - when true route area is not set.
     */
    function registerRoutes(area, config, routesOnly) {
        area.config(['$routeProvider', function ($routeProvider) {
            angular.forEach(config.routes, function (v,k) {
                if(k === 'otherwise'){
                    $routeProvider.otherwise(v);
                } else {
                    if(!routesOnly)
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
                v.ns = app.createNamespace(v.name);
                area = angular.module(v.ns, v.dependencies);
            }
            // update ns, may have changed.
            v.module = area;
            v.ns = area.name;
            modules.push(v.ns);
            if(app.options && app.tryModule(app.options.routeModule))
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
     * @param {function} cb - callback upon bootstrapping.
     */
    app.init = function init(modules, config, cb) {

        var self = this,
            defaults = {
                modules: [],                        // modules to initialize with.
                routeModule: 'ngRoute',             // the routing module.
                routeHelpers: true,                 // if true route helpers are bound app.goto, area.goto
                defaultRoute: '/',                  // set to false to disable default route.
                defaultRouteOptions: {},            // sets default route options.
                otherwise: '/',                     // default otherwise which defaults to root of site.
                viewBase: '',                       // path if views require a prefixed base path.
                html5Mode: true                     // html routing mode whether to use # hash in routes.
            },
            _app, options;

        // enable passing callback as second param.
        if(angular.isFunction(config)){
            cb = config;
            config = {};
        }

        // store the configuration options.
        app.options = options = angular.extend(defaults, config);
        modules = modules || config.modules || [];
        app.ns = config.ns || 'app';
        app.viewBase = config.viewBase;

        // property used for passing in additional package/application object.
        app.settings = config.settings || {};

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

            .config(['$locationProvider', '$injector',function ($locationProvider, $injector) {

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

            }])
            .run(['$location', function ($location) {

                // add location to global app variable.
                app.location = $location;

                // if routing is enabled and
                // helpers set to true enable.
                if(app.options.routeModule && app.options.routeHelpers){
                    app.goto = function (path, type) {
                        type = type || 'path';
                        if(type === 'postback')
                            window.location.href = path;
                        else
                            $location[type](path);
                    };
                }
            }]);



        // merge in primary module.
        angular.extend(app, _app);

        // bootstrap Angular application.
        angular.element(document).ready(function () {
            angular.bootstrap(document, [app.ns]);
            // callback if supplied.
            if(cb) cb.call(self, app);
        });

    };

    return app;
});


