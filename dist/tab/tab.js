angular.module('ai.tab', ['ai.helpers'])
.provider('$tab', function $tab() {

    var defaults = {

        }, get, set;

    set = function set(key, value) {
        var obj = key;
        if(arguments.length > 1){
            obj = {};
            obj[key] = value;
        }
        defaults = angular.extend(defaults, obj);
    };

    get = [ '$helpers', function get($helpers) {

        function ModuleFactory(element, options, attrs){

            var $module = {},
                scope;

            if(attrs)
                attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

            options = options || {};
            $module.scope = scope = options.scope || $rootScope.$new();
            $module.options = scope.options = options = angular.extend({}, defaults, attrs, options);


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
                $module = $tab(element, options, attrs);
            }

            options = scope.$eval(attrs.aiTab || attrs.aiTabOptions);
            options = angular.extend(defaults, options);

            init();

        }
    };

}]);