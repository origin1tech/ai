angular.module('ai.widget', [])

.provider('$widget', function $widget() {

    var defaults = {
            number: {
                defaultValue: undefined,        // default value if initialized undefined.
                places: 2,                      // default decimal places.
                event: 'blur'                   // event that triggers formatting.
            },
            case: {
                casing: 'first',
                event: 'blur'
            },
            compare: {
                defaultValue: undefined,        // the default value when undefined.
                compareTo: undefined,           // the html name attribute of the element or form scope property to compare to.
                dataType: 'string',             // options are string, date, time, datetime, integer
                precision: 'minutes'            // only valid when evaluating time when dataType is time or datetime.
                                                // valid options 'minutes', 'seconds', 'milliseconds'
            },
            lazyload: {
                src: undefined,                 // placeholder option.
                parent: 'head',                 // the parent element where the script should be insert into.
                position: 'append'              // either append, prepend or integer to insert script at.
            }
        },
        get, set;

    set = function set(key, options) {
        if(angular.isObject(key)){
            options = key;
            key = undefined;
            defaults = angular.extend(defaults, options);
        } else {
            defaults[key] = angular.extend(defaults[key], options);
        }
    };

    get = [ function get() {

        // factory allows for globally
        // setting widget options.
        function ModuleFactory(key, options) {
            options = options || {};
            if(!defaults[key]) return options;
            options = angular.extend({}, defaults[key], options);
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

// ensures handling decimal values.
.directive('aiNumber', [ '$widget', '$helpers', '$timeout', function($widget, $helpers, $timeout) {
    return {
        restrict: 'AC',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel) {

            var defaults, options, _attrs, lastVal;

            defaults = angular.copy($widget('number'));
            _attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

            function parseVal(val){
                val = $helpers.tryParseFloat(val);
                if(val)
                    val = val.toFixed(options.places);
                return val;
            }

            // format and set value.
            function format(val) {
                if(val !== undefined)  {
                    val = parseVal(val);
                    if(!val)
                        val = parseVal(lastVal);
                }
                if(val === undefined)
                    val = options.defaultValue !== undefined ? options.defaultValue : '';
                element.val(val);
                ngModel.$modelValue = val;
                lastVal = val;
            }

            function init() {

                // bind event call apply
                // format the value.
                // use simple event binding instead
                // of adding watchers etc.
                element.unbind(options.event);
                element.on(options.event, function (e) {
                    scope.$apply(function () {
                        format(e.target.value);
                    });
                });

                // use timeout make sure dom is ready.
                $timeout(function () {
                    var val = element.val();
                    if(!val)
                        if(options.defaultValue !== undefined)
                            val = options.defaultValue;
                    format(val);
                }, 0);
            }

            options = attrs.aiNumber|| attrs.aiNumberOptions;
            options = angular.extend(defaults, _attrs, scope.$eval(options));

            init();
        }
    };
}])

.directive('aiCase', ['$timeout', '$widget', '$helpers', function($timeout, $widget, $helpers) {

  return {
    restrict: 'AC',
    require: '?ngModel',
    link: function(scope, element, attrs, ngModel) {

      var defaults, options, casing, _attrs;

      defaults = angular.copy($widget('case'));
      options = {};
      _attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

      function getCase(val) {
        if (!val) return;

        if (casing === 'title')
          return val.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          });
        else if (casing === 'first' || casing === 'captitalize')
          return val.charAt(0).toUpperCase() + val.slice(1);
        else if (casing === 'camel') {
          return val.toLowerCase().replace(/-(.)/g, function(match, group1) {
            return group1.toUpperCase();
          });
        } else if (casing === 'pascal')
          return val.replace(/\w+/g, function(w) {
            return w[0].toUpperCase() + w.slice(1).toLowerCase();
          });
        else if (casing === 'lower')
          return val.toLowerCase();
        else if (casing === 'upper')
          return val.toUpperCase();
        else return val;
      }

      function applyCase(e) {

        scope.$apply(function() {
          var val = element.val(),
            cased = getCase(val);
          if (ngModel) {
            ngModel.$setViewValue(cased);
            element.val(cased);
          } else {
            element.val(getCase(val));
          }
        });

      }

      function init() {

        casing = options.casing;

        element.on(options.event, function(e) {
          applyCase(e);
        });

        element.on('keyup', function(e) {
          var code = e.which || e.keyCode;
          if (code === 13) {
            /* prevent default or submit could happen
            prior to apply case updates model */
            e.preventDefault();
            applyCase(e);
          }
        });

        $timeout(function() {
          applyCase();
        }, 100);

      }

      var tmpOpt = attrs.aiCase || attrs.aiCaseOptions;
      if (angular.isString(tmpOpt))
        options.casing = tmpOpt;
      if (angular.isObject(tmpOpt))
        options = scope.$eval(tmpOpt);
      options = angular.extend(defaults, _attrs, options);

      init();

    }

  };

}])

.directive('aiCompare', [ '$widget', '$helpers', function ($widget, $helpers) {

    function checkMoment() {
        try{
            var m = moment();
            return true;
        } catch(ex) {
            return false;
        }
    }

    function isNumber(val) {
        return !isNaN(parseInt(val,10)) && (parseFloat(val,10) === parseInt(val,10));
    }

    return {
        restrict: 'AC',
        require: '^ngModel',
        link: function (scope, element, attrs, ngModel) {

            var defaults, options, formElem, form, momentLoaded,
                ngModelCompare, _attrs;

            // check moment is loaded for datetime compares.
            momentLoaded = checkMoment();
            defaults = angular.copy($widget('compare'));

            _attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

            function validate(value) {

                var valid;

                if(!ngModelCompare.$viewValue || !ngModel.$viewValue){

                    valid = options.defaultValue || '';

                } else {

                    if(options.dataType === 'string') {

                        valid = ngModelCompare.$viewValue === value;

                    } else if(options.dataType === 'integer'){

                        if(!isNumber(ngModelCompare.$viewValue) || !isNumber(ngModel.$viewValue)){
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

            var tmpOpt = attrs.aiCompare || attrs.aiCompareOptions;
            if(angular.isString(tmpOpt) && tmpOpt.indexOf('{') === -1)
                tmpOpt = { compareTo: tmpOpt };
            else
                tmpOpt = scope.$eval(tmpOpt);

            options = angular.extend({}, defaults, _attrs, tmpOpt);

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
                if(ts.toString() === _ts){
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

    // capitalize a string.
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

            var placeholder, isNative;

            function init() {

                var label = '<label>{{NAME}}</label>',
                    ts = new Date().getTime(),
                    prev;

                placeholder = capitalize(placeholder);

                if(!isNative && placeholder)
                    element.attr('placeholder', placeholder);

                // since angular doesn't support .index()
                // set attr so we can find it when iterating.
                element.attr('_ts_', ts);
                prev = prevSibling(element, ts);

                // test if dot notation model name.
                if(placeholder.indexOf('.') !== -1){
                    placeholder = placeholder.split('.');
                    placeholder = placeholder[1] ? placeholder[1] : placeholder[0];
                }

                if(!placeholderSupported() && prev) {
                    label = label.replace('{{NAME}}', placeholder);
                    label = angular.element(label);
                    prev.element[prev.method](label);
                }

            }

            isNative = element.attr('placeholder');
            placeholder = element.attr('placeholder') ||  attrs.aiPlaceholder || attrs.ngModel;

            init();

        }
    };
}])

.directive('aiLazyload', [ '$widget', '$helpers', '$rootScope', function($widget, $helpers, $rootScope) {
    return {
        restrict: 'EA',
        scope: false,
        link: function(scope, elem, attrs) {

            var script, scripts, defaults, options, parentElem, childElem;

            defaults = angular.copy($widget('lazyload'));
            options = $helpers.parseAttrs(Object.keys(defaults), attrs);
            options = angular.extend({}, defaults, options);

            // the parent element where
            // scripts will be inserted.
            parentElem = $helpers.findElement(options.parent)[0];

            if(!parentElem || !parentElem.appendChild)
                return console.error('Cannot lazy load script using parent ' + options.parent +
                                      '. Ensure the dom element exists.');

            // get all scripts in element.
            scripts = $helpers.findElement('script', document[options.parent]) || [];

            if(options.position === 'prepend')
                options.position = 0;

            // insert at this position wihtin children.
            childElem = angular.isNumber(options.position) ? scripts[options.position] : undefined;

            // if no scripts in element just use append.
            if(!scripts.length || childElem === undefined)
                options.position = 'append';

            // create script element
            script = document.createElement('script');

            // check if inline or
            // is external file.
            if(undefined === options.src){
                script.text = elem.text();
            } else {
                script.src = options.src;
            }

            // add the script to parent.
            if(childElem)
                parentElem.insertBefore(script, childElem);
            else
                parentElem.appendChild(script);

            // remove original element
            elem.remove();

            function removeScript() {
                if(script && parentElem.contains(script))
                    parentElem.removeChild(script);
            }

            // remove script on route change, prevents dups.
            $rootScope.$on('$routeChangeSuccess', removeScript);

            // remove lazy loaded script on destroy.
            scope.$on('destroy', removeScript);

        }
    };
}]);
