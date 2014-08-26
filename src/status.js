angular.module('ai.status', [])

    .provider('$status', function $status() {

        var defaults = {
                codes: {                            // enabled status codes.
                    400: false,
                    401: false,
                    403: false,
                    404: '/shared/404.html',
                    500: false
                },
                extension: '.html'                  // extension used by your views.
            },
            get, set;

        set = function (options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$httpProvider', '$q', '$injector', function ($httpProvider, $q, $injector) {

            function StatusFactory(options) {

                var $module = {},
                    $http;

                options = angular.extend(defaults, options);
                $http = $http || $injector.get('$http');

                $module.responseError = function (resp) {

                    var status = resp.status.toString(),
                        statusKeys = Object.keys(options.codes),
                        isView = resp.config.url.indexOf(options.extension) !== -1;

                    console.log(resp);

                    if(options.codes[status] && statusKeys.indexOf(status.toString()) !== -1 && isView){
                        var defer = $q.defer();
                        resp.status = 200;
                        $http.get(options.codes[status])
                            .then(function (result) {
                                resp.data = result.data;
                                defer.resolve(resp);
                            }, function () {
                                defer.reject(resp);
                            });
                        return defer.promise;
                    } else {
                        return $q.reject(resp);
                    }
                };
                return $module;
            }

            $httpProvider.interceptors.push(StatusFactory);

            return StatusFactory;

        }];

        return {
            $get: get,
            $set: set
        };

    });