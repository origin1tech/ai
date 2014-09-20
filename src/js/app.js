
var $app = (function (app) {
    'use strict';

    // initialize the app object.
    app = app || {};

    // set namespace for application.
    app.ns = 'app';

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
        this.ns = app.ns + '.' + name;
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

        // extend the area.
        angular.extend(this, options);

        return this;
    }

    // expose Area, Route publicly.
    app.Area = Area;

    Object.defineProperty(app.areas, 'register', {
        enumerable: false,
        value: function (name, options) {
            if(!app.areas[name])
                app.areas[name] = new Area(name, options);
            else
                app.areas[name] = angular.extend(app.areas[name], options);
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
     * @rivate
     * @param {Area} area - the Area to register routes for.
     */
    function registerRoutes(area) {
        area.config(['$routeProvider', function ($routeProvider) {
            angular.forEach(area.routes, function (v,k) {
                v.access = v.access !== undefined ? v.access : area.access;
                $routeProvider.when(k, v);
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
            // check for manual init
            if(v.init){
                // set module to object
                area = v.init(v.ns, v.dependencies);
                area.module = area;
            } else {
                area = angular.module(v.ns, v.dependencies);
                area.module = area;
            }
            // update ns, may have changed.
            v.ns = area.module.name;
            modules.push(v.ns);
            registerRoutes(area);
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
     * @description - registeres areas as dependencies of application.
     * @param {array} modules - the base modules for primary module.
     * @param {object} config - application configuration settings.
     */
    app.init = function init(modules, config) {

        var _app, defaults;

        defaults = {
            ns: app.ns,
            modules: [],
            routes: false,
            refreshPath: false,
            viewBase: ''
        };

        config = angular.extend(defaults, config);
        modules = modules || config.modules || [];
        app.ns = config.ns;
        app.viewBase = config.viewBase;

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
