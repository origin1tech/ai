
angular.module('ai.passport.factory', [])

    .provider('$passport', [function $passport() {

        var defaults, defaultRoles, get, set;

        // NOTE: if roles object keys are numeric roles are ordered
        //       by the numeric keys. if keys are strings the roles
        //       will be sorted by each property's value.
        //       if roles are a simple array of strings a numeric
        //       map will be created based on the order of the
        //       array provided.



        defaults = {


            rootKey:            'Passport',                     // the rootScope property key to set to instance.
            routeKey:           'area',                         // the property within the current router's route object

            401: true,                                          // set to false to not handle 401 status codes.
            403: true,                                          // set to false to not handle 403 status codes.

            rolesKey:           'roles',                        // the key which contains ALL roles.
            userKey:            'user',                         // the object key which contains the user information
                                                                // returned in res.data of successful login.
                                                                // ex: res.data.user (see method $module.login)
            extendKeys:         undefined,                      // array of keys you wish to also track.
                                                                         
            paranoid: false,                                    // when true, fails if access level is missing.
            delimiter:          ',',                            // char to use to separate roles when passing string.

            defaultUrl:         '/',                            // the default path or home page.
            loginUrl:           '/passport/login',              // path to login form.
            resetUrl:           '/passport/reset',              // path to password reset form.
            recoverUrl:         '/passport/recover',            // path to password recovery form.

            loginAction:        'post /api/passport/login',     // endpoint/func used fo r authentication.
            logoutAction:       'get /api/passport/logout',     // endpoint/func used to logout/remove session.
            resetAction:        'post /api/passport/reset',     // endpoint/func used for resetting password.
            recoverAction:      'post /api/passport/recover',   // endpoint/func used for recovering password.
            syncAction:         'get /api/passport/sync',       // syncs app roles and user profile. must return
                                                                // object containing user and/or roles.
                                                                // ex: { user: user, roles: roles }

            onLoginSuccess:     '/',                            // path or func on success.
            onLoginFailed:      '/passport/login',              // path or func when login fails.
            onRecoverSuccess:   '/passport/login',              // path or func when recovery is success.
            onRecoverFailed:    '/passport/recover',            // path or func when recover fails.
            onUnauthenticated:  '/passport/login',              // path or func when unauthenticated.
            onUnauthorized:     '/passport/login',              // path or func when unauthorized.
            onSyncSuccess:      undefined,                      // func called when successfully synchronized w/ server.

            welcomeText:        'Welcome ',                     // prefix string to identity.
            welcomeParams:      [ 'firstName' ]                 // array of user properties which make up the
                                                                // user's identity or full name, properties are
                                                                // separated by a space.
        };

        defaultRoles = {
            0: '*',
            1: 'user',
            2: 'manager',
            3: 'admin',
            4: 'superadmin'
            //'*': 0,
            //'user': 1,
            //'manager': 2,
            //'admin': 3,
            //'superadmin': 4
        };

        set = function set (key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend({}, defaults, obj);
        };

        get = ['$rootScope', '$location', '$http', '$route', '$q', function get($rootScope, $location, $http, $route, $q) {

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

            function tryParseFloat(val) {
                try {
                    if(isNaN(val))
                        return val;
                    return parseFloat(val);
                } catch(ex) {
                    return val;
                }
            }

            //normalize roles in format:
            // { 0: 'role_name', 1: 'role_name' }
            function normalizeRoles(roles) {
                var obj = {};
                if(angular.isArray(roles)){
                    if(!roles.length)
                        throw new Error('Fatal error normalizing passport roles, received empty array.');
                    angular.forEach(roles, function (v, k){
                        obj[k] = v;
                    });
                }

                else if(angular.isObject(roles) && !angular.isFunction(roles)) {
                    var keys = Object.keys(roles),
                        stringKeys,
                        values;
                    if(!keys.length)
                        throw new Error('Fatal error normalizing passport roles, object has no keys.');
                    stringKeys = tryParseFloat(keys[0]);
                    stringKeys = typeof stringKeys === 'string';
                    obj = roles;
                    if(stringKeys){
                        obj = {};
                        values = keys.map(function (k) {
                            k = tryParseFloat(k);
                            return roles[k];
                        });
                        if(!values.length)
                            throw new Error('Fatal error normalizing passport roles, object has no values.');
                        angular.forEach(values, function (v) {
                            var parsedVal = tryParseFloat(v);
                            var val;
                            angular.forEach(roles, function (v, k) {
                                if(val) return;
                                if(parsedVal === v)
                                    val = k;
                            });
                            if(!val)
                                throw new Error('Fatal error normalizing security roles, no matching key for value ' +
                                    parsedVal);
                            obj[parsedVal] = val;
                        });
                    }
                }

                else {
                    throw new Error('Fatal error normalizing security roles, the format is invalid.');
                }
                return obj;
            }

            // Passport factory module.
            function ModuleFactory() {

                if(this.instance)
                    return instance;

                var $module = {};

                // extends module with custom keys.
                function extendModule(keys, obj){
                    angular.forEach(keys, function (k) {
                        if(obj[k])
                            $module[k] = obj[k];
                    });
                }
               

                // ensure the user proptery
                // is undefined when passport
                // class is initialized.
                $module.user = undefined;

                $module.findByNotation = function findByNotation(obj, prop) {
                    if(!obj || !prop)
                        return undefined;
                    var props = prop.split('.');
                    while (props.length && obj) {
                        var comp = props.shift(),
                            match;
                        match = new RegExp('(.+)\\[([0-9]*)\\]', 'i').exec(comp);
                        if ((match !== null) && (match.length === 3)) {
                            var arrayData = { arrName: match[1], arrIndex: match[2] };
                            if (obj[arrayData.arrName] !== undefined) {
                                obj = obj[arrayData.arrName][arrayData.arrIndex];
                            } else {
                                obj = undefined;
                            }
                        } else {
                            obj = obj[comp];
                        }
                    }
                    return obj;
                };

                // set passport options.
                $module.set = function set(key, value) {

                    var options;

                    if(!key && !value) {
                        options = {};
                    } else {
                        if(angular.isObject(key)){
                            options = key;
                            value = undefined;
                        } else {
                            options = {};
                            options[key] = value;
                        }
                    }

                    // don't merge levels override instead.
                    options.roles = options.roles || defaultRoles;

                    // merge the options.
                    $module.options = angular.extend({}, defaults, $module.options, options);

                    // set levels and roles.
                    $module.roles = normalizeRoles(options.roles);
                };

                // login passport credentials.
                $module.login = function login(data) {
                    var url = urlToObject($module.options.loginAction);
                    function onFailed(res) {
                        if(angular.isFunction($module.options.onLoginFailed)) {
                            $module.options.onLoginFailed.call($module, res);
                        } else {
                            $location.path($module.options.onLoginFailed);
                        }
                    }
                    $http[url.method](url.path, data)
                        .then(function (res) {
                            $module.user = $module.findByNotation(res.data, $module.options.userKey);
                            var roles = $module.findByNotation(res.data, $module.options.rolesKey);
                            if(!$module.user)
                                throw new Error('Fatal error passport failed to set "user" on login.');
                            if(roles)
                                $module.roles = normalizeRoles(roles);
                            delete $module.user._roles;
                            if($module.options.extendKeys)
                                extendModule($module.options.extendKeys, res.data);
                            if(angular.isFunction($module.options.onLoginSuccess)) {
                                $module.options.onLoginSuccess.call($module, res, $module.user);
                            } else {
                                $location.path($module.options.onLoginSuccess);
                            }
                        }, onFailed);
                };

                // logout passport.
                $module.logout = function logout() {
                    function done() {
                        $module.user = undefined;
                        $location.path($module.options.loginUrl);
                        $route.reload();
                    }
                    if(angular.isFunction($module.options.logoutAction)){
                        $module.options.logoutAction.call($module);
                    } else {
                        var url = urlToObject($module.options.logoutAction);
                        $http[url.method](url.path).then(function (res) {
                            if(res)
                                done();
                        });
                    }
                };

                // recover passport
                $module.recover = function recover() {
                    if(angular.isFunction($module.options.recoverAction)){
                        $module.options.recoverAction.call($module);
                    } else {
                        var url = urlToObject($module.options.recoverAction);
                        $http[url.method](url.path).then(function (res){
                            if(angular.isFunction($module.options.onRecoverSuccess)) {
                                $module.options.onRecoverSuccess.call($module, res);
                            } else {
                                $location.path($module.options.onRecoverSuccess);
                            }
                        }, function () {
                            if(angular.isFunction($module.options.onRecoverFailed)) {
                                $module.options.onRecoverFailed.call($module, res);
                            } else {
                                $location.path($module.options.onRecoverFailed);
                            }
                        });
                    }
                };

                // reset passport password.
                $module.reset = function reset() {

                };

                // sync passport with server.
                // checking for session.
                $module.sync = function sync() {
                    function done(obj) {
                        if(obj) {
                            var user = $module.findByNotation(obj, $module.options.userKey);
                            var roles = $module.findByNotation(obj, $module.options.rolesKey);
                            if(user)
                                $module.user = user;
                            if(roles)
                                $module.roles = normalizeRoles(roles);   
                            if($module.options.extendKeys)
                                extendModule($module.options.extendKeys, obj);
                        }
                    }
                    if(!$module.options.syncAction)
                        return done();
                    if(angular.isFunction($module.options.syncAction)){
                        var obj = $module.options.syncAction.call($module);
                        done(obj);
                    } else {
                        var url = urlToObject($module.options.syncAction);
                        if (url.method && url.path) {
                            $http[url.method](url.path).then(function (res) {
                                if(res){
                                    done(res.data);
                                    if(angular.isFunction($module.options.onSyncSuccess))
                                        return $module.options.onSyncSuccess.call($module, res, $module.user);                                                                            
                                }                  
                            }, function (res) {
                                    if(console && console.warn)
                                        console.warn(res.data);
                            });
                        }
                    }
                };

                // expects string.
                $module.hasRole = function hasRole(role) {
                   // var userRoles = $module.userRoles(),
                        //level =
                    //if(!level)
                        //return false;
                    // if public return true
                    //if(level === 0)
                    //    return true;
                    //return passportRoles.indexOf(role) !== -1;
                };

                // expects string or array of strings.
                $module.hasAnyRole = function hasAnyRole(roles) {
                    //var passportRoles = $module.roles || [];
                    // if a string convert to role levels.
                    //if(angular.isString(roles)){
                    //    roles = roles.split($module.options.delimiter);
                    //    roles = rolesToLevels($module.options.roles, roles);
                    //}
                    // if public return true
                    //if(roles.indexOf(0) !== -1)
                    //    return true;
                    //return roles.some(function (v) {
                    //    return passportRoles.indexOf(v) !== -1;
                    //});
                };

                // check if meets the minimum roll required.
                $module.minRole = function minRole(role) {
                    var passportRoles = $module.roles || [],
                        maxRole;
                    if(angular.isString(role))
                        role = $module.options.roles[role] || undefined;
                    // get the passport's maximum role.
                    maxRole = Math.max.apply(Math, passportRoles);
                    return maxRole >= role;
                };

                // check if role is not greater than.
                $module.maxRole = function maxRole(role) {
                    var passportRoles = $module.roles || [],
                        maxRole;
                    if(angular.isString(role))
                        role = $module.options.roles[role] || undefined;
                    // get the passport's maximum role.
                    maxRole = Math.max.apply(Math, passportRoles);
                    return maxRole < role;
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

                // gets the identity name of the authenticated user.
                $module.displayName = function displayName(arr) {
                    var result = '';
                    arr = arr || $module.options.welcomeParams;
                    if(!$module.user)
                        return undefined;
                    angular.forEach(arr, function (v, k){
                        if($module.user[v]){
                            if(k === 0)
                                result += $module.user[v];
                            else
                                result += (' ' + $module.user[v]);
                        }
                    });
                    return result;
                };

                // returns welcome text and displayName or text only.
                $module.welcome = function welcome(textOnly) {
                    if(textOnly)
                        return $module.options.welcomeText;
                    return $module.options.welcomeText + ' ' + $module.displayName();
                };

                // return roles array from user object.
                $module.userRoles = function userRoles() {
                    if(!$module.user || !$module.user[$module.options.rolesKey])
                        return [0];
                    return $module.user[$module.options.rolesKey];
                };

                // navigate to path.
                $module.goto = function goto(path) {
                    if(path)
                        $location.path(path);
                }

                // set initial options
                $module.set();

                // sync with server.
                $module.sync();

                $rootScope[$module.options.rootKey] = $module;

                // return for chaining.
                return $module;

            }

            ModuleFactory.instance = undefined;

            // return new instance of Passport.
            return new ModuleFactory();

        }];

        return {
            $get: get,
            $set: set
        };

    }]);

// intercepts 401 and 403 errors.
angular.module('ai.passport.interceptor', [])
    .factory('$passportInterceptor', ['$q', '$injector', function ($q, $injector) {
        return {
            responseError: function(res) {
                 //get passport here to prevent circ dependency.
                var passport = $injector.get('$passport');
                // handle unauthenticated response
                if (res.status === 401 && passport.options['401'])
                    passport.unauthenticated();
                // handle unauthorized.
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
            if(next && next.$$route)
                route = next.$$route;
            access = $passport.findByNotation(route, $passport.routeKey);
            // when paranoid all routes must contain
            // an access key containing roles otherwise
            // direct to unauthorized.
            if($passport.options.paranoid && access === undefined){
                return $passport.unauthorized();
            }
            if(access !== undefined){
                authorized = $passport.hasAnyRole('*');
                if(!authorized){
                    $passport.unauthorized();
                }
            }
        });
    }]);

// imports above modules.
angular.module('ai.passport', [
    'ai.passport.factory',
    'ai.passport.interceptor',
    'ai.passport.route'
]);