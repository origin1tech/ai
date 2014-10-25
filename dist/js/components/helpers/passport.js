
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
            paranoid: true,                                     // when true, fails if access level is missing.
            splitChar: ',',                                     // char to use to separate roles when passing string.

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

            var instance, onSuccess, onFailed,
                onForbidden, onError;

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

                var roleMap = {};

                // ensure valid object.
                options = options || {};

                // override options map if exists.
                defaults.levels = options.levels || defaults.levels;

                // merge the options.
                this.options = angular.extend(defaults, options);

                // normalize/reverse levels map
                this.options.roles = reverseMap(this.options.levels);
            }

            // login passport credentials.
            ModuleFactory.prototype.login = function login(data) {
                var url = urlToObject(this.options.loginAction),
                    self = this;
                $http[url.method](url.path, data)
                    .then(function (res) {
                        // set to authenticated and merge in passport profile.
                        angular.extend(self, res.data);
                        if(angular.isFunction(self.options.onLoginSuccess)) {
                           self.options.onLoginSuccess.call(this, res);
                        } else {
                            $location.path(self.options.onLoginSuccess);
                        }
                    }, function (res) {
                        if(angular.isFunction(self.options.onLoginFailed)) {
                            self.options.onLoginFailed.call(this, res);
                        } else {
                            $location.path(self.options.onLoginFailed);
                        }
                    });
            };

            ModuleFactory.prototype.logout = function logout() {
                var self = this;
                if(angular.isFunction(this.options.logoutAction)){
                    this.options.logoutAction.call(this);
                } else {
                    var url = urlToObject(this.options.logoutAction);
                    $http[url.method](url.path)
                        .then(function () {
                            // reset passport instance to default.
                            $rootScope.passport = { authenticated: false };
                            instance = new ModuleFactory();
                            $rootScope.Passport = instance;
                            $location.path(self.options.defaultUrl);
                        });
                }
            };

            ModuleFactory.prototype.recover = function recover() {

            };

            ModuleFactory.prototype.reset = function reset() {

            };

            // expects string.
            ModuleFactory.prototype.hasRole = function hasRole(role) {
                var passportRoles = this.roles || [];
                // if string convert to role level.
                if(angular.isString(role))
                    role = this.options.roles[role] || undefined;
                // if public return true
                if(role === 0)
                    return true;
                return passportRoles.indexOf(role) !== -1;
            };

            // expects string or array of strings.
            ModuleFactory.prototype.hasAnyRole = function hasAnyRole(roles) {
                var passportRoles = this.roles || [];
                // if a string convert to role levels.
                if(angular.isString(roles)){
                    roles = roles.split(',');
                    roles = rolesToLevels(this.options.roles, roles);
                }
                // if public return true
                if(roles.indexOf(0) !== -1)
                    return true;
                return roles.some(function (v) {
                    return passportRoles.indexOf(v) !== -1;
                });
            };

            // check if meets the minimum roll required.
            ModuleFactory.prototype.minRole = function requiresRole(role) {
                var passportRoles = this.roles || [],
                    maxRole;
                if(angular.isString(role))
                    role = this.options.roles[role] || undefined;
                // get the passport's maximum role.
                maxRole = Math.max.apply(Math, passportRoles);
                return maxRole >= role;
            };

            // check if role is not greater than.
            ModuleFactory.prototype.maxRole = function requiresRole(role) {
                var passportRoles = this.roles || [],
                    maxRole;
                if(angular.isString(role))
                    role = this.options.roles[role] || undefined;
                // get the passport's maximum role.
                maxRole = Math.max.apply(Math, passportRoles);
                return maxRole < role;
            };

            // reinit passport
            ModuleFactory.prototype.init = function init(options) {
                instance = new ModuleFactory(options);
            };

            // unauthorized handler.
            ModuleFactory.prototype.unauthorized = function unauthorized() {
                var action = this.options.onUnauthorized;
                if(action !== undefined){
                    // action defined check if path
                    // or is function. if func call pass context.
                    if(angular.isFunction(action))
                        return action.call(this);
                    else
                        $location.path(action);
                } else {
                    // default to the login url.
                    $location.path(this.options.loginUrl);
                }
            };

            // make sure we have a singleton.
            function getInstance() {
                if(!instance){
                    instance = new ModuleFactory();
                    $rootScope.Passport = instance;
                }
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
    .factory('passportInterceptor', ['$q', '$injector', function ($q, $injector) {
        return {
            response: function(res){
                // get passport here to prevent circ dependency.
                var passport = $injector.get('$passport');
                if (res.status === 401 && $passport.options['401']) {
                }
                if(res.status === 403 && $passport.options['403']){
                }
                return res || $q.when(res);
            },
            responseError: function(res) {
                // get passport here to prevent circ dependency.
                var passport = $injector.get('$passport');
                if (res.status === 401 && $passport.options['401']) {
                }
                if(res.status === 403 && $passport.options['403']){
                }
                return $q.reject(res);
            }
        };
    }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('passportInterceptor');
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
            // when paranoid is false unauthorize is not called
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