angular.module('ai.nicescroll', [])
  
    .directive('aiNicescroll', [function() {          

        return {
            restrict: 'EAC',
            scope: {
                options: '&aiNicescroll'
            },
            link: function(scope, element) {

                var defaults, init, plugin;

                console.assert(window.NiceScroll, 'ai-nicescroll requires the NiceScroll library ' +
                    'see: http://areaaperta.com/nicescroll/');

                defaults = {
                    horizrailenabled: false
                };
                init = function init() {
                    plugin = element.niceScroll(scope.options);
                };
                scope.options = angular.extend(defaults, scope.$eval(scope.options));
                init();
            }
        };
    }]);