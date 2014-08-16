angular.module('ai.nicescroll', [])
    .run([function () {
        if(!window.NiceScroll)
            throw new Error('ai-nicescroll requires the NiceScroll library see: http://areaaperta.com/nicescroll/');
    }])
    .directive('aiNicescroll', [function() {
        return {
            restrict: 'AC',
            scope: {
                options: '&aiNicescroll'
            },
            link: function(scope, element) {
                var defaults, init, plugin;
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