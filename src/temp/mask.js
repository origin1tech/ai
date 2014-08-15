var mask = angular.module('ai.widget.mask', []);

mask.run(function () {
    if (typeof ($.fn.inputmask) === 'undefined')
        throw new Error('ai-mask requires jQuery inputmask which could not be found. See https://github.com/RobinHerbots/jquery.inputmask.');
});

mask.directive('aiMask', [ '$timeout', function ($timeout) {

    return {
        restrict: 'A',
        require: '^ngModel',
        link: function (scope, element, attrs, ngModel) {

            var rebind = false
              , plugin
              , defaults
              , options;

            function setValue(e) {
                var val = element.inputmask('unmaskedvalue')
                  , complete = element.inputmask('isComplete');
                scope.$apply(function () {
                    if (!complete) val = '';
                    ngModel.$setViewValue(val);
                });
            }

            function rebindValue(newVal) {
                plugin.unbind(".inputmask");
                plugin.inputmask(options);
                rebind = false;
            }

            defaults = {
                oncomplete: setValue,
                onincomplete: setValue,
                clearIncomplete: true
            };

            scope.$watch(attrs.ngModel, function (newVal, oldVal) {
                //if (newVal === oldVal || !newVal || rebind) return;
                if (plugin) {
                    rebind = true;
                    rebindValue(newVal);
                }               
            });

            function init() {

                $timeout(function () {
                    plugin = element.inputmask(options);
                });               
            }

            options = angular.extend({}, defaults, scope.$eval(attrs.aiMask));

            init();

        }

    }  
    

}]);
