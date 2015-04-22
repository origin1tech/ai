angular.module('ai.router', [])

.provider('$router', ['$routeProvider', function $router($routeProvider) {

    var defaults, get, set, routes, when, otherwise;

    defaults = {
        caseInsensitiveMatch: false
    };

    // object of application routes.
    routes = {};

    // Angular 1.4 Source.
    // methods used for "merge"
    // from angular source
    // see: https://github.com/angular/angular.js/blob/b6afe1b208d7b49cca3695b2bdd1c7b7c2ff635d/src/Angular.js#L326


    // sets $$hashKey.
    function setHashKey(obj, h) {
        if (h) {
            obj.$$hashKey = h;
        } else {
            delete obj.$$hashKey;
        }
    }

    // base for .extend & .merge
    function baseExtend(dst, objs, deep) {
        var h = dst.$$hashKey;

        for (var i = 0, ii = objs.length; i < ii; ++i) {
            var obj = objs[i];
            if (!angular.isObject(obj) && !angular.isFunction(obj)) continue;
            var keys = Object.keys(obj);
            for (var j = 0, jj = keys.length; j < jj; j++) {
                var key = keys[j];
                var src = obj[key];

                if (deep && angular.isObject(src)) {
                    if (!angular.isObject(dst[key])) dst[key] = angular.isArray(src) ? [] : {};
                    baseExtend(dst[key], [src], true);
                } else {
                    dst[key] = src;
                }
            }
        }

        setHashKey(dst, h);
        return dst;
    }

    // merge function case base.
    function merge(dst) {
        return baseExtend(dst, slice.call(arguments, 1), true);
    }

        // ensure merge is defined.
    if(!angular.merge)
        angular.merge  = merge;

    // inherit parent object.
    function inherit(parent, extra) {
        return angular.extend(Object.create(parent), extra);
    }

    function pathRegExp(path, opts) {
        var insensitive = opts.caseInsensitiveMatch,
            ret = {
                originalPath: path,
                regexp: path
            },
            keys = ret.keys = [];

        path = path
            .replace(/([().])/g, '\\$1')
            .replace(/(\/)?:(\w+)([\?\*])?/g, function(_, slash, key, option) {
                var optional = option === '?' ? option : null;
                var star = option === '*' ? option : null;
                keys.push({ name: key, optional: !!optional });
                slash = slash || '';
                return '' +
                    (optional ? '' : slash) +
                    '(?:' +
                    (optional ? slash : '') +
                    (star && '(.+?)' || '([^/]+)') +
                    (optional || '') +
                    ')' +
                    (optional || '');
            })
            .replace(/([\/$\*])/g, '\\$1');

        ret.regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');
        return ret;
    }

    // updates defaults globaly.
    set = function set(key, value) {
        var obj = key;
        if(arguments.length > 1){
            obj = {};
            obj[key] = value;
        }
        defaults = angular.extend({}, defaults, obj);
    };

    // adds route to collection
    when = function when(path, route) {
        //copy original route object to preserve params inherited from proto chain
        var routeCopy = angular.copy(route);
        if (angular.isUndefined(routeCopy.reloadOnSearch)) {
            routeCopy.reloadOnSearch = true;
        }
        if (angular.isUndefined(routeCopy.caseInsensitiveMatch)) {
            routeCopy.caseInsensitiveMatch = defaults.caseInsensitiveMatch;
        }
        routes[path] = angular.extend(
            routeCopy,
            path && pathRegExp(path, routeCopy)
        );

        // create redirection for trailing slashes
        if (path) {
            var redirectPath = (path[path.length - 1] == '/') ?
                path.substr(0, path.length - 1) :
                path + '/';

            routes[redirectPath] = angular.extend(
                {redirectTo: path},
                pathRegExp(redirectPath, routeCopy)
            );
        }

        return this;
    };

    // fallback when route not found.
    otherwise = function(params) {
        if (typeof params === 'string') {
            params = {redirectTo: params};
        }
        when(null, params);
        return this;
    };

    get = ['$location', '$routeParams', '$q', '$injector', '$templateRequest', '$sce',
        function get($rootScope, $location, $routeParams, $q, $injector, $templateRequest, $sce) {

        var forceReload = false,
            preparedRoute,
            preparedRouteIsUpdateOnly,
            $route;

            function switchRouteMatcher(on, route) {
                var keys = route.keys,
                    params = {};

                if (!route.regexp) return null;

                var m = route.regexp.exec(on);
                if (!m) return null;

                for (var i = 1, len = m.length; i < len; ++i) {
                    var key = keys[i - 1];

                    var val = m[i];

                    if (key && val) {
                        params[key.name] = val;
                    }
                }
                return params;
            }

            function parseRoute() {
                // Match a route
                var params, match;
                angular.forEach(routes, function(route, path) {
                    if (!match && (params = switchRouteMatcher($location.path(), route))) {
                        match = inherit(route, {
                            params: angular.extend({}, $location.search(), params),
                            pathParams: params});
                        match.$$route = route;
                    }
                });
                // No route matched; fallback to "otherwise" route
                return match || routes[null] && inherit(routes[null], {params: {}, pathParams:{}});
            }

            function interpolate(string, params) {
                var result = [];
                angular.forEach((string || '').split(':'), function(segment, i) {
                    if (i === 0) {
                        result.push(segment);
                    } else {
                        var segmentMatch = segment.match(/(\w+)(?:[?*])?(.*)/);
                        var key = segmentMatch[1];
                        result.push(params[key]);
                        result.push(segmentMatch[2] || '');
                        delete params[key];
                    }
                });
                return result.join('');
            }

            function prepareRoute($locationEvent) {
                var lastRoute = $route.current;
                preparedRoute = parseRoute();
                preparedRouteIsUpdateOnly = preparedRoute && lastRoute && preparedRoute.$$route === lastRoute.$$route &&
                angular.equals(preparedRoute.pathParams, lastRoute.pathParams) &&
                !preparedRoute.reloadOnSearch && !forceReload;

                if (!preparedRouteIsUpdateOnly && (lastRoute || preparedRoute)) {
                    if ($rootScope.$broadcast('$routeChangeStart', preparedRoute, lastRoute).defaultPrevented) {
                        if ($locationEvent) {
                            $locationEvent.preventDefault();
                        }
                    }
                }
            }

            function commitRoute() {
                var lastRoute = $route.current;
                var nextRoute = preparedRoute;

                if (preparedRouteIsUpdateOnly) {
                    lastRoute.params = nextRoute.params;
                    angular.copy(lastRoute.params, $routeParams);
                    $rootScope.$broadcast('$routeUpdate', lastRoute);
                } else if (nextRoute || lastRoute) {
                    forceReload = false;
                    $route.current = nextRoute;
                    if (nextRoute) {
                        if (nextRoute.redirectTo) {
                            if (angular.isString(nextRoute.redirectTo)) {
                                $location.path(interpolate(nextRoute.redirectTo, nextRoute.params)).search(nextRoute.params)
                                    .replace();
                            } else {
                                $location.url(nextRoute.redirectTo(nextRoute.pathParams, $location.path(), $location.search()))
                                    .replace();
                            }
                        }
                    }
                    $q.when(nextRoute).
                        then(function() {
                            if (nextRoute) {
                                var locals = angular.extend({}, nextRoute.resolve),
                                    template, templateUrl;

                                angular.forEach(locals, function(value, key) {
                                    locals[key] = angular.isString(value) ?
                                        $injector.get(value) : $injector.invoke(value, null, null, key);
                                });

                                if (angular.isDefined(template = nextRoute.template)) {
                                    if (angular.isFunction(template)) {
                                        template = template(nextRoute.params);
                                    }
                                } else if (angular.isDefined(templateUrl = nextRoute.templateUrl)) {
                                    if (angular.isFunction(templateUrl)) {
                                        templateUrl = templateUrl(nextRoute.params);
                                    }
                                    templateUrl = $sce.getTrustedResourceUrl(templateUrl);
                                    if (angular.isDefined(templateUrl)) {
                                        nextRoute.loadedTemplateUrl = templateUrl;
                                        template = $templateRequest(templateUrl);
                                    }
                                }
                                if (angular.isDefined(template)) {
                                    locals['$template'] = template;
                                }
                                return $q.all(locals);
                            }
                        }).
                        // after route change
                        then(function(locals) {
                            if (nextRoute == $route.current) {
                                if (nextRoute) {
                                    nextRoute.locals = locals;
                                    angular.copy(nextRoute.params, $routeParams);
                                }
                                $rootScope.$broadcast('$routeChangeSuccess', nextRoute, lastRoute);
                            }
                        }, function(error) {
                            if (nextRoute == $route.current) {
                                $rootScope.$broadcast('$routeChangeError', nextRoute, lastRoute, error);
                            }
                        });
                }
            }


            // $route object.
            $route = {

                routes: routes,

                reload: function() {
                    forceReload = true;
                    $rootScope.$evalAsync(function() {
                        prepareRoute();
                        commitRoute();
                    });
                },

                updateParams: function(newParams) {
                    if (this.current && this.current.$$route) {
                        newParams = angular.extend({}, this.current.params, newParams);
                        $location.path(interpolate(this.current.$$route.originalPath, newParams));
                        // interpolate modifies newParams, only query params are left
                        $location.search(newParams);
                    } else {
                        throw $routeMinErr('norout', 'Tried updating route when with no current route');
                    }
                }
            };

        // prepare route when location changes.
        $rootScope.$on('$locationChangeStart', prepareRoute);

        // commit route when location has changed.
        $rootScope.$on('$locationChangeSuccess', commitRoute);

        return $route;

    }];

    return {
        $get: get,
        $set: set,
        when: when,
        otherwise: otherwise
    };

}]);