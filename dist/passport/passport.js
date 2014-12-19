
angular.module('ai.passport.factory', [])

    .provider('$passport', function $passport() {

        var defaults, get, set;

        defaults = {
            levels: {
                0: '*',
                1: 'user',
                2: 'manager',
                3: 'admin',
                4: 'superadmin'
            },

            401: true,                                          // set to false to not handle 401 status codes.
            403: true,                                          // set to false to not handle 403 status codes.
            paranoid: false,                                     // when true, fails if access level is missing.
            delimiter: ',',                                     // char to use to separate roles when passing string.

            // passport paths.
            defaultUrl: '/',                                    // the default path or home page.
            loginUrl: '/login',                                 // path to login form.
            resetUrl: '/passport/reset',                        // path to password reset form.
            recoverUrl: '/passport/recover',                    // path to password recovery form.

            // passport actions
            loginAction:  'post /api/passport/login',           // endpoint/func used fo r authentication.
            logoutAction: '/api/passport/logout',               // endpoint/func used to logout/remove session.
            resetAction:  'post /api/passport/reset',           // endpoint/func used for resetting password.
            recoverAction:'post /api/passport/recover',         // endpoint/func used for recovering password.

            // success fail actions.
            onLoginSuccess: '/',                                // path or func on success.
            onLoginFailed: '/login',                            // path or func when login fails.
            onUnauthenticated: '/login',                        // path or func when unauthenticated.
            onUnauthorized: '/login'                            // path or func when unauthorized.
        };

        set = function (options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$rootScope', '$location', '$http', function ($rootScope, $location, $http) {

            var instance;

            // nomralize url to method/path object.
            function urlToObject(url) {
                var parts = url.split(' '),
                    obj = { method: 'get' };
                obj.path =  parts[0];
                if(parts.length > 1){
                    obj.method = parts[0];
                    obj.path = parts[1];
                }
                return obj;
            }

            function rolesToLevels(source, roles){
                var arr = [];
                source = source || [];
                angular.forEach(roles, function (v) {
                    if(source[v] !== undefined)
                        arr.push(source[v]);
                });
                return arr;
            }

            // reverse the levels map setting role values as keys.
            function reverseMap(levels) {
                var obj = {};
                angular.forEach(levels, function (v,k) {
                    obj[v] = parseFloat(k);
                });
                return obj;
            }

            function ModuleFactory(options) {

                var $module = {};

                function setOptions(options) {

                    // ensure valid object.
                    options = options || {};

                    // override options map if exists.
                    defaults.levels = options.levels || defaults.levels;

                    // merge the options.
                    $module.options = angular.extend(defaults, options);

                    // normalize/reverse levels map
                    $module.options.roles = reverseMap($module.options.levels);
                }

                // login passport credentials.
                $module.login = function login(data) {
                    var url = urlToObject($module.options.loginAction);
                    $http[url.method](url.path, data)
                        .then(function (res) {
                            // set to authenticated and merge in passport profile.
                            angular.extend(self, res.data);
                            if(angular.isFunction($module.options.onLoginSuccess)) {
                                $module.options.onLoginSuccess.call(this, res);
                            } else {
                                $location.path($module.options.onLoginSuccess);
                            }
                        }, function (res) {
                            if(angular.isFunction($module.options.onLoginFailed)) {
                                $module.options.onLoginFailed.call(this, res);
                            } else {
                                $location.path($module.options.onLoginFailed);
                            }
                        });
                };

                $module.logout = function logout() {
                    var self = $module;
                    if(angular.isFunction($module.options.logoutAction)){
                        $module.options.logoutAction.call(this);
                    } else {
                        var url = urlToObject($module.options.logoutAction);
                        $http[url.method](url.path)
                            .then(function () {
                                // reset passport instance to default.
                                instance = new ModuleFactory();
                                $rootScope.Passport = instance;
                                $location.path($module.options.defaultUrl);
                            });
                    }
                };

                $module.recover = function recover() {

                };

                $module.reset = function reset() {

                };

                // expects string.
                $module.hasRole = function hasRole(role) {
                    var passportRoles = $module.roles || [];
                    // if string convert to role level.
                    if(angular.isString(role))
                        role = $module.options.roles[role] || undefined;
                    // if public return true
                    if(role === 0)
                        return true;
                    return passportRoles.indexOf(role) !== -1;
                };

                // expects string or array of strings.
                $module.hasAnyRole = function hasAnyRole(roles) {
                    var passportRoles = $module.roles || [];
                    // if a string convert to role levels.
                    if(angular.isString(roles)){
                        roles = roles.split($module.options.delimiter);
                        roles = rolesToLevels($module.options.roles, roles);
                    }
                    // if public return true
                    if(roles.indexOf(0) !== -1)
                        return true;
                    return roles.some(function (v) {
                        return passportRoles.indexOf(v) !== -1;
                    });
                };

                // check if meets the minimum roll required.
                $module.minRole = function requiresRole(role) {
                    var passportRoles = $module.roles || [],
                        maxRole;
                    if(angular.isString(role))
                        role = $module.options.roles[role] || undefined;
                    // get the passport's maximum role.
                    maxRole = Math.max.apply(Math, passportRoles);
                    return maxRole >= role;
                };

                // check if role is not greater than.
                $module.maxRole = function requiresRole(role) {
                    var passportRoles = $module.roles || [],
                        maxRole;
                    if(angular.isString(role))
                        role = $module.options.roles[role] || undefined;
                    // get the passport's maximum role.
                    maxRole = Math.max.apply(Math, passportRoles);
                    return maxRole < role;
                };

                // reinit passport
                $module.init = function init(options) {
                    setOptions(options);
                };

                // unauthorized handler.
                $module.unauthenticated = function unauthenticated() {
                    var action = $module.options.onUnauthenticated;

                    // if func call pass context.
                    if(angular.isFunction(action))
                        return action.call($module);

                    // default to the login url.
                    $location.path(action || $module.options.loginUrl);

                };

                // unauthorized handler.
                $module.unauthorized = function unauthorized() {
                    var action = $module.options.onUnauthorized;
                    // if func call pass context.
                    if(angular.isFunction(action))
                        return action.call($module);
                    // default to the login url.
                    $location.path(action || $module.options.loginUrl);
                };

                setOptions(options);

                return $module;

            }

            function getInstance() {
                if(!instance)
                    return new ModuleFactory();
                return instance;
            }

            return getInstance();
           
        }];

        return {
            $get: get,
            $set: set
        };

    });

// intercepts 401 and 403 errors.
angular.module('ai.passport.interceptor', [])
    .factory('$passportInterceptor', ['$q', '$injector', function ($q, $injector) {
        return {
            responseError: function(res) {
                // get passport here to prevent circ dependency.
                var passport = $injector.get('$passport');
                // handle unauthenticated response
                if (res.status === 401 && passport.options['401'])
                    passport.unauthenticated();
                if(res.status === 403 && passport.options['403'])
                    passport.unauthorized();
                return $q.reject(res);
            }
        };
    }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('$passportInterceptor');
    }]);

// handles intercepting route when
// required permissions are not met.
angular.module('ai.passport.route', [])
    .run(['$rootScope', '$location', '$passport', function ($rootScope, $location, $passport) {
        $rootScope.$on('$routeChangeStart', function (event, next) {
            var area = {},
                route = {},
                access,
                authorized;
            if(next && next.$$route){
                route = next.$$route;
                if(route.area)
                    area = route.area;
            }
            access = route.access || area.access;
            // when paranoid is true require access params
            // if undefined call unauthorized.
            // when paranoid is false unauthorized is not called
            // when access is undefined.
            if($passport.options.paranoid && access === undefined)
                return $passport.unauthorized();
            if(access !== undefined){
                authorized = $passport.hasAnyRole('*');
                if(!authorized)
                    $passport.unauthorized();
            }
        });
    }]);

// imports above modules.
angular.module('ai.passport', [
    'ai.passport.factory',
    'ai.passport.interceptor',
    'ai.passport.route'
]);