angular.module('ai.resolver', []);

//    .provider('$routeResolver', function $routeResolver() {
//
//        this.config = (function () {
//
//            var defaults = {
//                    views: '/views',
//                    controllers: '/controllers'
//                },
//                areas = {};
//
//            function createArea(name, obj) {
//                if(areas[name]) throw new Error('Duplicate area ' + name + ' detected.');
//                areas[name] = angular.extend(defaults, obj);
//            }
//
//            function updateArea(name, key, value){
//                if(areas[name] && areas[name][key]){
//                    areas[name][key] = value;
//                }
//            }
//
//            function getArea(name) {
//                return areas[name] || undefined;
//            }
//
//            return {
//                createArea: createArea,
//                updateArea: updateArea,
//                getArea: getArea
//            };
//
//        }());
//
//        this.route = (function (config) {
//
//            var resolve = function (baseName) {
//
//                    var route = {},
//                        area = config.getArea(baseName);
//
//                    route.templateUrl = area.controllers() + baseName + '.html';
//                    route.controller = baseName + 'Controller';
//
//                    route.resolve = {
//                        load: ['$q', '$rootScope', function ($q, $rootScope) {
//                            var dependencies = [config.getControllersDirectory() + baseName + '.js'];
//                            return getDependencies($q, $rootScope, dependencies);
//                        }]
//                    };
//
//                    route.access = 5;
//
//                    return route;
//                },
//
//                getDependencies = function ($q, $rootScope, dependencies) {
//                    var defer = $q.defer();
//                    require(dependencies, function () {
//                        defer.resolve();
//                        $rootScope.$apply();
//                    });
//
//                    return defer.promise;
//                };
//
//            return {
//                resolve: resolve
//            };
//
//        }(this.config));
//
//        this.$get = function ($routeProvider, $locationProvider, $controllerProvider, $compileProvider,
//                              $filterProvider, $provide) {
//            return this;
//        };
//
//    });