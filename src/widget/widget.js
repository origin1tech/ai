var prevent = angular.module('ai.misc', []);

prevent.directive('aiPreventDefault', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            if(attrs.ngClick){

                element.on('click', function(e){
                    e.preventDefault();
                });

            }
        }
    };
});