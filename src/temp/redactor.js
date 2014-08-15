var redactor = angular.module('ai.widget.redactor', []);

redactor.directive('aiRedactor', [ function () {


    return {
        restrict: 'A',
        scope: true,
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {

            var defaults, options, init;

            defaults = {
                focus: true,
                plugins: ['fullscreen']
            };

            init = function () {

                element = $(element);

                element.redactor(scope.options);

            };

            scope.options = angular.extend({}, defaults, scope.options);

            init();
        }

    }

}]);
