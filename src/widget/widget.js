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
                mask: {
                    oncomplete: undefined,
                    onincomplete: undefined,
                    clearIncomplete: true
                },
                case: {
                    event: 'blur'
                },
                compare: {
                    compareTo: 'compare',           // the html name attribute of the element or form scope property to compare to.
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

    .directive('aiNicescroll', ['$widget', function($widget) {

        return {
            restrict: 'AC',
            link: function(scope, element, attrs) {
                var defaults, options, directive;

                console.assert(window.NiceScroll, 'ai-nicescroll requires the NiceScroll library ' +
                    'see: http://areaaperta.com/nicescroll');

                defaults = $widget('nicescroll');

                function init() {
                    if(window.NiceScroll){
                        angular.element(document).ready(function () {
                            directive = element.niceScroll(options);
                        });
                    }
                }
                options = angular.extend(defaults, scope.$eval(attrs.aiNicescroll));
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

                defaults = $widget('decimal');
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
                options = angular.extend(defaults, scope.$eval(attrs.aiDecimal));
                init();
            }
        };
    }])

    // Angular wrapper for using Redactor.
    .directive('aiRedactor', [ '$widget', function ($widget) {
        return {
            restrict: 'AC',
            require: '?ngModel',
            link: function (scope, element, attrs, ngModel) {
                var defaults, options, directive;

                console.assert(window.jQuery && (typeof ($.fn.redactor) !== 'undefined'), 'ai-redactor requires the ' +
                    'jQuery redactor plugin. see: http://imperavi.com/redactor.');
                function init() {
                    directive = element.redactor(options);
                }
                options =  angular.extend({}, defaults, attrs.aiRedactor);
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

                defaults = $widget('case');
                options = { casing: 'first'};

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

                if(angular.isString(attrs.aiCase))
                    options.casing = attrs.aiCase;
                else
                    options = scope.$eval(attrs.aiCase);

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
                defaults = $widget('compare');

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

                }

                function init() {

                    formElem = element[0].form;

                    /* can't continue without the form */
                    if(!formElem) return;

                    form = scope[formElem.name] || undefined;
                    ngModelCompare = form[options.compareTo] || options.compareTo || undefined;

                    /* must have valid form in scope */
                    if(!form || !options.compareTo || !ngModelCompare) return;

                    if(/^(date|time|datetime)$/.test(options.dataType) && !momentLoaded)
                        return console.warn('ai-compare requires moment.js, see http://momentjs.com/.');

                    ngModel.$formatters.unshift(validate);
                    ngModel.$parsers.unshift(validate);

                }

                scope.$watch(attrs.aiCompare, function (newValue, oldValue) {
                    if(newValue === oldValue) return;
                    options = angular.extend(options, scope.$eval(newValue));
                    init();
                }, true);

                scope.options = options = angular.extend(defaults, scope.$eval(attrs.aiCompare));

                init();

            }
        };
    }]);
