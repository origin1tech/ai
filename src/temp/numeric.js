var numeric = angular.module('ai.widget.numeric', []);

/* allows for trailing zeros for input */

numeric.directive('aiNumeric', function() {

    return {
        restrict: 'A',
        scope: true,
        require: '^ngModel',
        link: function(scope, element, attrs, ngModel) {

            var init, format, formatted, regex;

            regex = new RegExp('^[0-9]+\.\d{2}$');
            formatted = false;

            format = function (val) {
                 if(val !== undefined && !regex.test(val))  {
                    val = parseFloat(val).toFixed(2);
                    element.val(val);
                    ngModel.$setViewValue(val);
                }
            };

            scope.$watch(attrs.ngModel, function (newVal, oldVal) {
                if(newVal === undefined) formatted = false;
                if(newVal !== undefined && !regex.test(newVal) && !formatted){
                    format(newVal);
                    formatted = true;
                }
            });

            init = function init() {

                element.unbind('blur');

                element.on('blur', function (e) {
                    scope.$apply(function () {
                         format(e.target.value);
                    });
                });

                format();

            };



            init();
        }
    };
});