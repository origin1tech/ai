'use strict';

var loader = angular.module('ai.module.loader', []);

loader.config([ '$httpProvider', function ($httpProvider) {

    $httpProvider.interceptors.push('LoaderFactory');

}]);


loader.factory('LoaderFactory', ['$q', '$rootScope', '$injector', function ($q, $rootScope, $injector) {

    $rootScope.loading = false;
    var http = null;

    return {

        'request': function (config) {

            $rootScope.loading = true;
            return config || $q.when(config);

        },

        'requestError': function (rejection) {

          http = $rootScope.http || $injector.get('$http');

            if (http.pendingRequests.length < 1) {
                $rootScope.loading = false;
            }

            //if (canRecover(rejection)) {
            //    return responseOrNewPromise
            //}

            return $q.reject(rejection);

        },

        'response': function (response) {

          http = $rootScope.http || $injector.get('$http');

            if (http.pendingRequests.length < 1) {
                $rootScope.loading = false;
            }

            return response || $q.when(response);

        },

        'responseError': function (rejection) {

          http = $rootScope.http || $injector.get('$http');

            if (http.pendingRequests.length < 1) {
                $rootScope.loading = false;
            }

            //if (canRecover(rejection)) {
            //    return responseOrNewPromise
            //}

            return $q.reject(rejection);

        }

    }

}]);
