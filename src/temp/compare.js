'use strict';

var compare = angular.module('ai.validate.compare', []);

compare.directive('aiCompare', [ function () {

	function checkMoment() {
		try{
			var m = moment();
			return true;
		} catch(ex) {
			return false;
		}
	}

	function isInteger(val) {
		return !isNaN(parseInt(val,10)) && (parseFloat(val,10) == parseInt(val,10));
	}

    return {

        restrict: 'A',
        require: '^ngModel',
        link: function (scope, element, attrs, ngModel) {

            var formElem, init, form, options, momentLoaded,
                validate, defaults, ngModelCompare;

	        defaults = {
		        compareTo: 'compare',           // the html name attribute of the element or form scope property to compare to.
		        requireValue: true,             // should always be true, rare cases where you may need it to be false.
		                                        // throws false when values are empty/undefined.
		        dataType: 'integer',            // options are string, date, time, datetime, integer
		        precision: 'minutes'            // only valid when evaluating time when dataType is time or datetime.
		                                        // valid options 'minutes', 'seconds', 'milliseconds'
	        };

	        /* checks if moment is loaded */
	        momentLoaded = checkMoment();

	        validate = function (value) {

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

	        };

            init = function init() {

	            formElem = formElem = element[0].form;

                /* can't continue without the form */
                if(!formElem) return;

                form = scope[formElem.name] || undefined;
	            ngModelCompare = form[options.compareTo] || options.compareTo || undefined;

                /* must have valid form in scope */
                if(!form || !options.compareTo || !ngModelCompare) return;

	            if(/^(date|time|datetime)$/.test(options.dataType) && !momentLoaded) return;

	            ngModel.$formatters.unshift(validate);
                ngModel.$parsers.unshift(validate);

            };

            scope.$watch(attrs.aiCompare, function (newValue, oldValue) {
                if(newValue === oldValue) return;
                options = angular.extend(options, scope.$eval(newValue));
                 init();
            }, true);

	        options = angular.extend(defaults, scope.$eval(attrs.aiCompare));

            init();

        }
    };


}]);

