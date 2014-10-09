angular.module('ai.passport', [])

    .provider('$passport', function $passport() {

        var defaults, get, set;

        defaults = {
            map: {
                0: '*',
                1: 'user',
                2: 'manager',
                3: 'admin',
                4: 'superadmin'
            },
            defaultUrl: '/',
            loginUrl: '/api/passport/login',
            logoutUrl: '/api/passport/logout',
            resetUrl: '/api/passport/reset',
            recoverUrl: '/api/passport/recover',
            onSuccess: undefined,
            onFailed: undefined,
            onForbidden: undefined,
            onError: undefined
        };

        set = function (options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$rootScope', '$location', function ($rootScope, $location) {

            var instance, onSuccess, onFailed,
                onForbidden, onError;

            function ModuleFactory(options) {

                options = options || {};

                // override options map if exists.
                defaults.map = options.map || defaults.map;

                // merge the options.
                this.options = angular.extend(defaults, options);

                return this;

            }

            // base methods.
            ModuleFactory.prototype.login = function login() {

            };

            ModuleFactory.prototype.logout = function login() {

            };

            ModuleFactory.prototype.recover = function recover() {

            };

            ModuleFactory.prototype.reset = function reset() {

            };

            ModuleFactory.prototype.hasRole = function hasRole() {

            };

            ModuleFactory.prototype.hasAnyRole = function hasAnyRole() {

            };

            // get the Passport singleton instance.
            function getInstance() {
                if(!instance) {
                    instance = new ModuleFactory();
                    ModuleFactory.constructor = null;
                }
                return instance;
            }

            return getInstance();

        }];

        return {
            $get: get,
            $set: set
        };

    })

    // create factory for the interceptor.
    .factory('passportInterceptor', ['$q', '$location', '$passport', function ($q, $location, $passport) {
        return {
            responseError: function(resp) {
                var status = resp.status || 500;
                switch (status){
                    case 401:
                        // send to login page.
                        break;
                    case 403:
                        // send to forbidden page.
                        break;
                }
                return $q.reject(resp);
            }
        }
    }])

    // push the interceptor.
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('passportInterceptor');
    }]);
