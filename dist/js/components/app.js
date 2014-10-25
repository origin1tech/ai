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