angular.module('ai.widget', [])

.provider('$widget', function $widget() {

    var defaults = {
            nicescroll: {
                horizrailenabled: false         // disables horizontal scroll bar.
            },
            decimal: {
                places: 2                       // default decimal places.
            },
            redactor: {
                focus: true,
                plugins: ['fullscreen']
            },
            case: {
                casing: 'first',
                event: 'blur'
            },
            compare: {
                compareTo: undefined,           // the html name attribute of the element or form scope property to compare to.
                requireValue: true,             // should always be true, rare cases where you may need it to be false.
                                                // throws false when values are empty/undefined.
                dataType: 'string',             // options are string, date, time, datetime, integer
                precision: 'minutes'            // only valid when evaluating time when dataType is time or datetime.
                                                // valid options 'minutes', 'seconds', 'milliseconds'
            }
        },
        get, set;

    set = function (key, options) {
        if(angular.isObject(key)){
            options = key;
            key = undefined;
            defaults = angular.extend(defaults, options);
        } else {
            defaults[key] = angular.extend(defaults[key], options);
        }
    };

    get = [ function () {

        // factory allows for globally
        // setting widget options.
        function ModuleFactory(key, options) {
            options = options || {};
            if(!defaults[key]) return options;
            options = angular.extend(defaults[key], options);
            return options;
        }
        return ModuleFactory;

    }];

    return {
        $get: get,
        $set: set
    };


})

// simple directive to prevent default
// on click, for use as attribute/class only.
.directive('aiPrevent',[ function() {
    return {
        restrict: 'AC',
        link: function(scope, element, attrs) {
            if(attrs.ngClick){
                element.on('click', function(e){
                    e.preventDefault();
                });
            }
        }
    };
}])

.directive('aiNicescroll', ['$widget', '$timeout', function($widget, $timeout) {

    return {
        restrict: 'AC',
        link: function(scope, element, attrs) {

            var defaults, options, $directive;

            console.assert(window.NiceScroll, 'ai-nicescroll requires the NiceScroll library ' +
                'see: http://areaaperta.com/nicescroll');

            defaults = angular.copy($widget('nicescroll'));

            function init() {
                $timeout(function () {
                    $directive = element.niceScroll(options);
                },0);
            }

            options = attrs.aiNicescroll || attrs.options;
            options = angular.extend(defaults, scope.$eval(options));
            init();
        }
    };
}])

// ensures handling decimal values.
.directive('aiDecimal', [ '$widget', function($widget) {
    return {
        restrict: 'AC',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel) {

            var defaults, options, format, formatted, regex;

            defaults = angular.copy($widget('decimal'));
            regex = new RegExp('^[0-9]+\.\d{2}$');
            formatted = false;
            format = function (val) {
                if(val !== undefined && !regex.test(val))  {
                    val = parseFloat(val).toFixed(options.places);
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
            function init() {
                element.unbind('blur');
                element.on('blur', function (e) {
                    scope.$apply(function () {
                        format(e.target.value);
                    });
                });
                format();
            }
            options = attrs.aiDecimal || attrs.options;
            options = angular.extend(defaults, scope.$eval(options));
            init();
        }
    };
}])

// Angular wrapper for using Redactor.
.directive('aiRedactor', [ '$widget', function ($widget) {
    return {
        restrict: 'AC',
        scope: true,
        require: '?ngModel',
        link: function (scope, element, attrs) {
            var defaults, options, $directive;

            defaults = angular.copy($widget('redactor'));

            console.assert(window.jQuery && (typeof ($.fn.redactor) !== 'undefined'), 'ai-redactor requires the ' +
                'jQuery redactor plugin. see: http://imperavi.com/redactor.');

            function init() {
                $directive = element.redactor(options);
            }
            options = attrs.aiRedactor || attrs.options;
            options =  angular.extend(defaults, scope.$eval(options));

            init();
        }
    };
}])

.directive('aiCase', [ '$timeout', '$widget', function ($timeout, $widget) {

    return {
        restrict: 'AC',
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {

            var defaults, options, casing;

            defaults = angular.copy($widget('case'));
            options = {};

            function getCase(val) {
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
            }

           function applyCase(e){

               scope.$apply(function () {
                   var val = element.val(),
                       cased = getCase(val);
                   if (ngModel) {
                       ngModel.$modelValue = cased;
                   } else {
                       element.val(getCase(val));
                   }
               });

            }

            function init() {

                casing = options.casing;

                element.on(options.event, function (e) {
                    applyCase(e);
                });

                element.on('keyup', function (e) {
                    var code = e.which || e.keyCode;
                    if(code === 13){
                        /* prevent default or submit could happen
                        prior to apply case updates model */
                        e.preventDefault();
                        applyCase(e);
                    }
                });

                //angular.element(document).ready(function (e) {
                $timeout(function () {
                    applyCase();
                },100);

               // });
            }

            var tmpOpt = attrs.aiCase || attrs.options;
            if(angular.isString(tmpOpt))
                options.casing = tmpOpt;
            if(angular.isObject(tmpOpt))
                options = scope.$eval(tmpOpt);
            options = angular.extend(defaults, options);

            init();

        }

    };

}])

.directive('aiCompare', [ '$widget', function ($widget) {

    function checkMoment() {
        try{
            var m = moment();
            return true;
        } catch(ex) {
            return false;
        }
    }

    function isInteger(val) {
        return !isNaN(parseInt(val,10)) && (parseFloat(val,10) === parseInt(val,10));
    }

    return {
        restrict: 'AC',
        require: '^ngModel',
        link: function (scope, element, attrs, ngModel) {

            var defaults, options, formElem, form, momentLoaded,
                ngModelCompare;

            // check moment is loaded for datetime compares.
            momentLoaded = checkMoment();
            defaults = angular.copy($widget('compare'));

            function validate(value) {

                var valid;

                if(!ngModelCompare.$viewValue || !ngModel.$viewValue && options.requireValue){

                    valid = false;

                } else {

                    if(options.dataType === 'string') {

                        valid = ngModelCompare.$viewValue === value;

                    } else if(options.dataType === 'integer'){

                        if(!isInteger(ngModelCompare.$viewValue) || !isInteger(ngModel.$viewValue)){
                            valid = false;
                        } else {
                            valid = parseInt(ngModelCompare.$viewValue) === parseInt(value);
                        }

                    } else if(/^(date|time|datetime)$/.test(options.dataType)) {

                        var comp, model, diff, diffMin;

                        comp = ngModelCompare.$viewValue;
                        model = ngModel.$viewValue;

                        if(options.dataType === 'time'){
                            comp = '01/01/1970 ' + comp;
                            model = '01/01/1970 ' + model;
                        }

                        comp = moment(comp);
                        model = moment(model);

                        if(options.dataType === 'date'){

                            diff = model.diff(comp, 'days');
                            valid = diff === 0;

                        } else if(options.dataType === 'time'){

                            diff = model.diff(comp, options.precision);
                            valid = diff === 0;

                        } else if(options.dataType === 'datetime') {

                            diff = model.diff(comp, 'days');
                            diffMin = model.diff(comp, options.precision);
                            valid = (diff === 0) && (diffMin === 0);

                        } else {

                            valid = false;

                        }

                    } else {

                        valid = false;

                    }

                }

                ngModel.$setValidity('compare', valid);
                return valid;
            }

            function init() {

                formElem = element[0].form;

                /* can't continue without the form */
                if(!formElem) return;

                form = scope[formElem.name];
                ngModelCompare = form[options.compareTo] || options.compareTo;

                /* must have valid form in scope */
                if(!form || !options.compareTo || !ngModelCompare) return;

                if(/^(date|time|datetime)$/.test(options.dataType) && !momentLoaded)
                    return console.warn('ai-compare requires moment.js, see http://momentjs.com/.');

                ngModel.$formatters.unshift(validate);
                ngModel.$parsers.unshift(validate);

            }

            var tmpOpt = attrs.aiCompare || attrs.options;
            if(angular.isString(tmpOpt) && tmpOpt.indexOf('{') === -1)
                tmpOpt = { compareTo: tmpOpt };
            else
                tmpOpt = scope.$eval(tmpOpt);

            options = angular.extend({}, defaults, tmpOpt);

            init();

        }
    };
}])

.directive('aiPlaceholder', [ '$widget', function($widget) {

    // get the previous sibling
    // to the current element.
    function prevSibling(elem, ts) {
        try {
            var parents = elem.parent(),
                prevIdx;
            angular.forEach(parents.children(), function (v,k) {
                var child = angular.element(v),
                    _ts = child.attr('_ts_');
                if(ts == _ts){
                    prevIdx = k -1;
                }
            });
            elem.removeAttr('_ts_');
            if(prevIdx < 0)
                return { element: angular.element(elem.parent()), method: 'prepend' };
            return { element: angular.element(parents.children().eq(prevIdx)), method: 'after' };
        } catch(ex) {
            return false;
        }
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // test if placeholder is supported.
    function placeholderSupported() {
        var test = document.createElement('input');
        return ('placeholder' in test);
    }

    return {
        restrict: 'AC',
        link: function(scope, element, attrs) {

            var placeholder;

            function init() {

                var label = '<label>{{NAME}}</label>',
                    ts = new Date().getTime(),
                    childCount = element.parent().children().length,
                    prev;

                // since angular doesn't support .index()
                // set attr so we can find it when iterating.
                element.attr('_ts_', ts);
                prev = prevSibling(element, ts);

                // test if dot notation model name.
                if(placeholder.indexOf('.') !== -1){
                    placeholder = placeholder.split('.');
                    placeholder = placeholder[1] ? placeholder[1] : placeholder[0];
                }
                placeholder = capitalize(placeholder);

                if(!placeholderSupported() && prev) {
                    label = label.replace('{{NAME}}', placeholder);
                    label = angular.element(label);
                    prev.element[prev.method](label);
                }

            }

            placeholder = element.attr('placeholder') ||  attrs.aiPlaceholder || attrs.ngModel;

            init();

        }
    };
}]);
