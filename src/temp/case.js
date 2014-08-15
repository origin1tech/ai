
var typecase = angular.module('ai.widget.case', []);

typecase.directive('aiCase', [function () {

    /* 
    * Handles string casing.
    * ai-options: { casing: 'title', target: '#my-target' }
    */

    return {

        restrict: 'A',
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {

            if (!attrs.aiCaseOptions && !attrs.aiCase) return;

            var options = scope.$eval(attrs.aiCaseOptions) || {},
                casing = options.casing || attrs.aiCase || null,
                getCase,
                applyCase;


            if (!element || !casing) return;

            options.event = 'blur';

            getCase = function getCase(val) {

                if (!val) return;

                if (casing === 'title')
                    return val.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });

                else if (casing === 'first')
                    return val.charAt(0).toUpperCase() + val.slice(1);

                else if (casing === 'camel') {
                    return val.toLowerCase().replace(/-(.)/g, function (match, group1) {
                        return group1.toUpperCase();
                    });
                }

                else if (casing === 'pascal')
                    return val.replace(/\w+/g, function (w) { return w[0].toUpperCase() + w.slice(1).toLowerCase(); });

                else if (casing === 'lower')
                    return val.toLowerCase();

                else if (casing === 'upper')
                    return val.toUpperCase();

                else return val;
            };

            applyCase = function applyCase(e){
                scope.$apply(function () {
                    var _target = $(e.target),
                         val = _target.val(),
                         cased = getCase(val);
                    if (ngModel) {
                        ngModel.$setViewValue(cased);
                    }
                    _target.val(getCase(val));
                });
            };

            element.on(options.event, function (e) {
                applyCase(e);
            });

            element.on('keyup', function (e) {
                var code = e.which || e.keyCode;
                if(code === 13){
                    /* prevent default or submit could happen prior to apply case updates model */
                    e.preventDefault();
                    applyCase(e);
                }
            });

            angular.element(document).ready(function () {

                element.each(function (idx, elem) {
                    elem = $(elem);
                    elem.val(getCase(elem.val()));
                });

            });

        }

    };

}]);
