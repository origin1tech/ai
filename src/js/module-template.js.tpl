
(function () {
    'use strict';

    angular.name('ai.name', [])

        .provider('$name', function $name() {

            var defaults, get, set;

            // default settings.
            defaults = {

            };

            // set global provider options.
            set = function (value) {
                defaults = angular.extend(defaults, value);
            };

            // get provider
            get = ['$rootScope', function ($rootScope) {

                    // helper methods used internally.
                    var helpers = {

                        find: function find(query, element) {
                            return angular.element((element || document).querySelectorAll(query));
                        }

                    };

                    // The name factory
                    function ModuleFactory(element, options) {

                        var $name = {},
                            scope;

                        scope = options.scope || $rootScope.$new();
                        options = scope.options = angular.extend(defaults, options);


                        return $name;
                    }

                    return ModuleFactory;
                }];

            // retun getter/setter.
            return {
                $set: set,
                $get: get
            };

        })

        // The module directive.
        .directive('aiName', ['$name', function ($name) {

            return{
                restrict: 'EAC',
                scope: {
                    options: '&aiName'
                },
                link: function (scope, element, attrs) {

                    var defaults, directive, init, options;

                    defaults = {
                        scope: scope
                    };

                    // initialize the directive.
                    init = function () {
                        directive = $name(element, options);
                    };

                    // merge options.
                    options = angular.extend(defaults, scope.$eval(scope.options));

                    init();

                }
            };
        }]);

})();
