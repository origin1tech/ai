angular.module('ai.tab', [])
.provider('$tab', function $tab() {

    var defaults = {

        }, get, set;

    set = function set(key, value) {
        if(arguments.length === 2)
           defaults[key] = value;
        if(arguments.length === 1 && angular.isObject(key))
            defaults = angular.extend(defaults, key);
    };

    get = [function () {

        function ModuleFactory(element, options){

            var $module = {},
                scope;

            options = options || {};
            $module.scope = scope = options.scope || $rootScope.$new();
            $module.options = scope.options = options = angular.extend(angular.copy(defaults), options);



            return $module;
        }

        return ModuleFactory;

    }];

    return {
        $get: get,
        $set: set
    };

})
.directive('aiTab', ['$tab', function ($tab) {

    return {
        restrict: 'AC',
        scope: true,
        link: function (scope, element, attrs) {

            var defaults, options, $module;
            defaults = {
                scope: scope
            };

            function init() {
                $module = $tab(element, options);
            }

            options = scope.$eval(attrs.aiTab || attrs.options);
            options = angular.extend(defaults, options);

            init();

        }
    };

}]);