angular.module('ai.resolver', [])

    .provider('$routeResolver', function $routeResolver() {

        this.config = (function () {

            var defaults = {};

        }());

        this.route = (function (config) {

            var resolve = function (baseName) {

                    var route = {},
                        area = config.getArea(baseName);

                    route.templateUrl = area.controllers() + baseName + '.html';
                    route.controller = baseName + 'Controller';

                    getDependencies = function ($q, $rootScope, dependencies) {
                        var defer = $q.defer();
                        require(dependencies, function () {
                            defer.resolve();
                            $rootScope.$apply();
                        });

                        return defer.promise;
                    };

                    route.resolve = {
                        load: ['$q', '$rootScope', function ($q, $rootScope) {
                            var dependencies = [config.getControllersDirectory() + baseName + '.js'];
                            return getDependencies($q, $rootScope, dependencies);
                        }]
                    };

                    route.access = 5;
                    return route;

                };


            return {
                resolve: resolve
            };

        }(this.config));

        this.$get = function () {
            return this;
        };

    });