'use strict';

var form = angular.module('ai.validate.form', []);

form.controller('AiValidateFormController', ['$scope', '$compile', '$timeout', function ($scope, $compile, $timeout) {

	var findElement, form, hasValidator, getValidator, findSummary, defaultTemplate, tooltipTemplate,
		getExpression, getTitlecase, compileValidator, onDirtyRequireValue, getScrollbarWidth,
		attachEvents, summaryTemplate, resetting, submitting, positionTooltip, initializing;

	summaryTemplate = '<div ai-validate-summary>' +
						'<ul class="ai-validate-summary" ng-show="{{form}}.summary">' +
					        '<li ng-repeat="(expression,message) in {{form}}.validators">{{message}}</li>' +
					    '</ul>' +
					  '</div>';

	tooltipTemplate = '<div class="tooltip">' +
						'<div class="tooltip-inner">{{message}}</div>' +
						'<div class="tooltip-arrow"></div>' +
					  '</div>';

	defaultTemplate = '<span class="ai-validate-message">{{message}}</span>';

	initializing = false;
	
	/* LOCAL METHODS
    ******************************************************/

	findSummary = function findSummary() {

		/* tooltips cannot be used with summary */
		if(form.tooltipEnabled) return;

		var summary, element;
		element = $scope.formElement;
		summary = element[0].querySelectorAll('ai-validate-summary');
		if(!summary.length)
			summary = element[0].querySelectorAll('[ai-validate-summary]');

		summary = summary && summary.length
				? angular.element(summary)
				: undefined;

		if(summary) {
			summaryTemplate = $scope.options.summaryTemplate || summaryTemplate;
			summaryTemplate = summaryTemplate.replace(/{{form}}/g, $scope.formName);
			form.summaryElement = $compile(summaryTemplate)($scope);
			summary.replaceWith(form.summaryElement);
		}

	};
	
	/* use query selector to find */
	findElement = function find(q, element) {
		var elements;
		if(element.querySelectorAll)
			elements = element.querySelectorAll(q);
		else if(!elements || !elements.length && element[0].querySelectorAll)
			elements = element[0].querySelectorAll(q);
		else if(!elements || !elements.length && document)
			elements = document.querySelectorAll(q);
		else
			elements = undefined;
		if(elements)
			return angular.element(elements);
		else
			return undefined;
	};

	getScrollbarWidth = function getScrollbarWidth() {
		var div, width = getScrollbarWidth.width;
		if (width === undefined) {
			div = document.createElement('div');
			div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
			div = div.firstChild;
			document.body.appendChild(div);
			width = getScrollbarWidth.width = div.offsetWidth - div.clientWidth;
			document.body.removeChild(div);
		}
		return width;
	};

	positionTooltip = function positionTooltip(input, tooltip, pos) {

		var tooltipAdj, tooltipFallback;

		/* add additional classes if specified */
		if($scope.options.tooltipClass)
			tooltip.addClass($scope.options.tooltipClass);

		/* used for disabling error border on input */
		input.addClass('ai-validate-tooltip');

		tooltipAdj = $scope.options.tooltipAdj || { top: -2.5, left: 0 };
		tooltipFallback = $scope.options.tooltipFallback || null;

		function calculatePosition(_pos) {

			/*
			* need to look into better way of doing this
			* can't use .is() in jqlite.
			*/
			tooltip.removeClass('top');
			tooltip.removeClass('right');
			tooltip.removeClass('left');
			tooltip.removeClass('bottom');
			tooltip.css({ left: 0, top: 0 });
			tooltip.addClass(_pos);

			var position, tooltipSize, inputSize, inputOffset,
				windowSize, offset, scrollbarWidth;

			tooltipSize = { height: tooltip[0].clientHeight, width: tooltip[0].offsetWidth };
			inputSize = { height: input[0].clientHeight, width: input[0].offsetWidth };
			inputOffset = { top: input[0].offsetTop, left: input[0].offsetLeft };
			scrollbarWidth = getScrollbarWidth();
			windowSize = { width: window.innerWidth - scrollbarWidth, height: window.innerHeight };
			offset = {};

			position = {
				top: function () {
					offset.top = inputOffset.top - tooltipSize.height;
					offset.left = (inputOffset.left + inputSize.width) - (tooltipSize.width /2 + inputSize.width / 2) + tooltipAdj.left;
				},
				right: function () {
					offset.top = (inputSize.height - tooltipSize.height) / 2 + (inputOffset.top + tooltipAdj.top);
					offset.left = (inputOffset.left + inputSize.width);
				},
				bottom: function () {
					offset.top = inputOffset.top + inputSize.height;
					offset.left = (inputOffset.left + inputSize.width) - (tooltipSize.width /2 + inputSize.width / 2) + tooltipAdj.left;
				},
				left: function () {
					offset.top = (inputSize.height - tooltipSize.height) / 2 + (inputOffset.top + tooltipAdj.top);
					offset.left = inputOffset.left - tooltipSize.width;
				}
			};

			/* assign the position and calculate offset */
			position[_pos]();

			/* check overflow */
			if(offset.left < 0)
				if(tooltipFallback && tooltipFallback !== 'left')
					return calculatePosition(tooltipFallback);
				else
					return { top: offset.top, left: offset.left + Math.abs(offset.left) };

			if((offset.left + tooltipSize.width) > windowSize.width)
				if(tooltipFallback && tooltipFallback !== 'right')
					return calculatePosition(tooltipFallback);
				else
					return { top: offset.top, left: offset.left - Math.abs((offset.left + tooltipSize.width) - windowSize.width)};

			if((offset.top + tooltipSize.height) > windowSize.height)
				if(tooltipFallback && tooltipFallback !== 'bottom')
					return calculatePosition(tooltipFallback);
				else
					return { top: offset.top - Math.abs(((offset.top + tooltipSize.height) - windowSize.height)), left: offset.left };

			if((offset.top - tooltipSize.height) < 0)
				if(tooltipFallback && tooltipFallback !== 'top')
					return calculatePosition(tooltipFallback);
				else
					return { top: Math.abs(offset.top - tooltipSize.height), left: offset.left };


			return { top: offset.top, left: offset.left };

		}

		/* store some day for use in window resize */
		tooltip.data({input: input, pos: pos });

		/* add the caclulated position in form of offset to the tooltip */
		tooltip.css(calculatePosition(pos));

	};

	attachEvents = function attachEvents() {

		/* apply scope for form submission */
		if ($scope.options.validateOnSubmit) {
			$scope.formElement.on('submit', function () {
				$scope.$apply(function () {
					$scope.submitForm();
				});
			});
		}

		if ($scope.options.pristineOnReset) {
			$scope.formElement.on('reset', function () {
				$scope.$apply(function () {
					$scope.resetForm();
				});
			});
		}

	};

	hasValidator = function hasValidator(attr) {
		var validators = $scope.options.validators;
		return validators[attr] || undefined;
	};

	getTitlecase = function getTitlecase(str){
		str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
		str = str.replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3');
		str = str.replace(/([A-Z]+)*([A-Z][a-z])/g, "$1 $2");
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	onDirtyRequireValue = function onDirtyRequireValue (name) {

		if(form.submitted) return;

		var input = form[name] || null;
		if(input.$modelValue === undefined){
			input.$invalid = false;
			input.$valid = true;
			input.$setPristine(true);
			return false;
		}
		return true;
	};

	getValidator = function getValidator(name, attr, value) {

		var valMsg, cust, def, origName;

		origName = name;

		/* lookup the validation message expression */
		cust = $scope.options.validatorMessages[name];
		def = $scope.options.validators[attr];

		/* if custom we need to check for the attr */
		if(cust)
			cust = cust[attr] || undefined;

		/* default to the custom validator expression if present */
		valMsg = cust || def;

		/* check if title case is enabled */
		if($scope.options.messageTitlecase)
			name = getTitlecase(name);

		/* check if expression is a function  */
		if(angular.isFunction(valMsg))
			valMsg = valMsg({ attr: attr, value: value }, form);

		/* replace "name" with the normalized field name */
		if(/{{name}}/.test(valMsg))
			valMsg = valMsg.replace(/{{name}}/g, name || '');

		/* replace attribute is passed */
		if(/{{attr}}/.test(valMsg))
			valMsg = valMsg.replace(/{{attr}}/g, attr || '');
		
		/* if a value is passed replace it also */
		if(/{{value}}/.test(valMsg))
			valMsg = valMsg.replace(/{{value}}/g, value || '');

		return valMsg;

	};

	getExpression = function getExpression(name, attr, valMsg, valTemplate) {

		var valExp, valElem, watch, msgTemplate, prefixes, prefixRegex;

		msgTemplate = $scope.options.template || defaultTemplate;

		$scope.options.validatorPrefixes.push('ng');
		prefixes = $scope.options.validatorPrefixes.join('|');
		prefixRegex = new RegExp('(' + prefixes + ')\-', 'gi');

		/* check if tooltips are enabled */
		if(form.tooltipEnabled)
			msgTemplate = tooltipTemplate;


		watch = valTemplate ? false : true;

		valTemplate = valTemplate || '{{form}}.{{name}}.$error.{{attr}}';

		if ($scope.options.validateOnDirty) {

			if(!$scope.options.validateOnDirtyEmpty)
				valTemplate += ' && {{form}}.{{name}}.$dirty && {{form}}.requireValue("' + name + '")';
			else
				valTemplate += ' && {{form}}.{{name}}.$dirty';
		}

		if ($scope.options.validateOnSubmit)
			valTemplate += ' || {{form}}.submitted && {{form}}.{{name}}.$error.{{attr}}';


		//attr = attr.replace('ng-', '');
		attr = attr.replace(prefixRegex, '');

		/* the validation expression used with by default ng-show */
		valExp = valTemplate.replace(/{{form}}/g, $scope.formName).replace(/{{name}}/g, name).replace(/{{attr}}/g, attr);

		/* replace the placeholder with the validation message */
		msgTemplate = msgTemplate.replace(/{{message}}/, valMsg);

		/* add the expression to the new element via template */
		valElem = angular.element(msgTemplate).attr('ng-show', valExp);

		/* just in case we for got to add the required class in the template */
		if(!valElem.hasClass('ai-validate-message'))
			valElem.addClass('ai-validate-message');

		/* add watcher */
		if(watch)
			$scope.watchExpression(valExp, valMsg);

		return valElem;

	};

	compileValidator = function compileValidator(input, valElem, name) {

		var inputGroup = undefined;

		/* need to check parent as bootstrap clobbers positioning be
		 * sure to append after input groups.
		 * to bad we can't use .is() here no joy in jqlite.
		 */
		if(input.parent()){
			var parent = input.parent();
			inputGroup = parent.hasClass('input-group') ||
						 parent.hasClass('input-prepend') ||
				         parent.hasClass('input-append') ||
						 undefined;
		}

		/* check if summary element exists */
		if (form.summaryElement)
			valElem.addClass('ai-summary');

		/* check if generated class exists */
		if (!valElem.hasClass('ai-generated'))
			valElem.addClass('ai-generated');

		if(inputGroup)
			input.parent().after(valElem);
		else
		    input.after(valElem);

		valElem = $compile(valElem)($scope);

		if(form.tooltipEnabled){
		    var pos = $scope.options.template.split(' ').pop() || 'top';		
		    positionTooltip(angular.element(input), valElem, pos);
		    form.validationElements.push(valElem);		   			
		}

	};

	/* SCOPE METHODS
	******************************************************/

	$scope.findElement = findElement;

	$scope.buildExpression = getExpression;

	$scope.init = function init(initForm) {

		if(initializing) return;

		initializing = true;

		/* this resets the form objects. pass true so we don't init twice */
		$scope.reinitForm(true);
		
		/* save ref to form */
		form = form || initForm;

		form.resetForm = $scope.resetForm;
		form.submitForm = $scope.submitForm;
		form.reinitForm = $scope.reinitForm;
		form.validators = {};
		form.inputElements = [];
		form.validationElements = [];

		/* get the form inputs and any existing generated validation messages */
		var inputElements = findElement('input,select,textarea', $scope.formElement);
		form.inputElements = inputElements = inputElements && inputElements.length > 0 ? inputElements : [];

		/* check if tooltip is used */
		form.tooltipEnabled = $scope.options.template && $scope.options.template.indexOf('tooltip') !== -1;

		/* find and compile the summary */
		findSummary();

		/* add validation function to require value on dirty if enabled */
		if(!$scope.options.validateOnDirtyEmpty)
			form.requireValue = onDirtyRequireValue;

		/* nothing to do if no inputs exists */
		if(!inputElements.length) {
			initializing = false;
			return;
		}

		/* attach submit and reset event listeners */
		attachEvents();

	    /* iterate inputElements and inspect attributes */
        angular.forEach(inputElements, function (input) {

			/* convert to ng/jqlite element */
			input = angular.element(input);

			var name, attrs, model, type;

			/* get the input's attributes */
			attrs = input[0].attributes;
			type = input[0].type;

			/* get name, model and type vars */
			name = attrs.name ? attrs.name.value : undefined;

			/* we must have a name to ref. if no element name or is excluded return */
			if(!name || $scope.options.exclude.indexOf(name) !== -1)
				return;

			if (!input.hasClass('ai-validate-input'))
				input.addClass('ai-validate-input');

			/* iterate attributes inspect for validation */
			angular.forEach(attrs, function (attr) {


				var attrName = attr.name || undefined,
					isType = false;

				if(attrName === 'type')	{
					attrName = attr.value;
					isType = true;
				}

				if(attrName && hasValidator(attrName)) {

					/* get the validator expression message for type */
					var valMsg, valElem;

					if(isType)
						valMsg = getValidator(name, attrName, undefined);
					else
						valMsg = getValidator(name, attrName, attr.value);

					/* get the validation element w/ built expression */
					valElem = getExpression(name, attrName, valMsg);

					/* compile the validation message/expression for the input */
					compileValidator(input, valElem, name);

				}

			});

		});

		/* callback when bind is complete maybe should call this bound */
		if($scope.options.onBind) $scope.options.onBind(form, $scope);

		initializing = false;

		if (form.tooltipEnabled) {

		    form.positionTooltips = function positionTooltips() {	 
		        angular.forEach(form.validationElements, function (elem) {
		            var data = elem.data();                    
		            positionTooltip(data.input, elem, data.pos);
		        });	
		    };

			angular.element(window).bind('resize', function () {		
			    form.positionTooltips();
			});
		}

	};

	$scope.watchExpression = function validateSummary(exp, msg) {

		$scope.$watch(
			function () { 
				return $scope.$eval(exp); 
			}, 
			function (newVal, oldVal) {

			/* check if the validation exists */
			var exists = form.validators.hasOwnProperty(exp);

			/* add message if doesn't exist */
			if (!exists && newVal)
				form.validators[exp] = msg;

			/* remmove messages no longer invalid */
			if (exists && !newVal)
				delete form.validators[exp];

			if (Object.keys(form.validators).length === 0) {
				form.summary = false;
			} else {
				if (form.submitted)
					$scope.set.dirty();
				if (form.summaryElement)
					form.summary = true;
			}

		});

	};

	$scope.set = {

		pristine: function (defaults) {

			/* must have form and element */
			if (!form || !$scope.formElement || !form.inputElements.length) return;

			form.summary = false;
			form.submitted = false;

		    /* iterate inputs and set to pristine */
            angular.forEach(form.inputElements, function (input) {
			
                input = angular.element(input);

				var name, formProp;

				/* just in case */
				if(!input[0].attributes || !input[0].attributes.name) return;

				/* get the name attr */
				name = input[0].attributes.name.value || undefined;
				formProp = form[name] || undefined;

				/* should never hit this but just in case */
				if(!name || !formProp)
					throw new Error('Form property could not be found or has an invalid name attribute. Cannot set pristine.');

	            if(defaults) {
		            if(angular.isObject(defaults)) {
			            if(defaults[formProp.$name]) {
				            var val = defaults[formProp.$name];
				            formProp.$setViewValue(val);
				            input.val(val);
			            } else {
				            formProp.$setViewValue(undefined);
				            input.val(undefined);
			            }
		            } else {
			            formProp.$setViewValue(undefined);
			            input.val(undefined);
		            }
	            }

	            formProp.$setPristine(true);
	            formProp.$dirty = false;
	            input.addClass('ng-pristine').removeClass('ng-dirty');


			});

			/* timeout important to fix issue where form re-evals when setting form defaults */
			$timeout(function () {
				form.$dirty = false;
				form.$setPristine(true);
				form.submitted = false;
				resetting = false;
			});

		},

		dirty: function () {

			/* must have form and element */
			if (!form || !$scope.formElement || !form.inputElements.length) return;

			/* iterate inputs and set to pristine */
			angular.forEach(form.inputElements, function (input) {

			    input = angular.element(input);

				var name, formProp;

			    /* just in case */
				if (!input[0].attributes || !input[0].attributes.name) return;

				/* get the name attr */
				name = input[0].attributes.name.value || undefined;
				formProp = form[name] || undefined;

				/* should never hit this but just in case */
				if(!name || !formProp)
					throw new Error('Form property could not be found or has an invalid name attribute. Cannot set pristine.');


				formProp.$setPristine(false);
				formProp.$dirty = true;
				input.removeClass('ng-pristine').addClass('ng-dirty');

			});

			form.$pristine = false;
			form.$setDirty(true);
			submitting = false;

		}

	};

	/* resets the form back to its pristine state */
	$scope.resetForm = function (defaults) {
		defaults = defaults || false;
		if(resetting) return;
		resetting = true;
		$scope.set.pristine(defaults);
	};

	/*
	* forces form to $dirty to trigger any invalid elements
	* can pass true to also trigger the jquery event
	*/
	$scope.submitForm = function submit(trigger) {
		if(submitting) return;
		submitting = true;
		form.submitted = true;
		if(trigger === true)
			$scope.formElement.submitForm();
		$scope.set.dirty();

	};

	/* destroys all validation objects */
	$scope.destroyForm = function destroyForm() {
		$scope.removeValidations();
		delete $scope.formName;
		delete $scope.formElement;
		delete form.validators;
		delete form.inputElements;
		delete form.validationElements;
	};

	/* removes all generated validation messages */
	$scope.removeValidations = function removeValidations(elements) {
		elements = elements || findElement('.ai-validate-message.ai-generated', $scope.formElement[0]);
		if(elements && elements.length)
			elements.remove();
	};

	/* destroys then reinitializes the form validation */
	$scope.reinitForm = function reinitForm(suppressInit) {
		suppressInit = suppressInit || false;
		$scope.removeValidations();
		if(form){
			//delete form.validators;
//			delete form.inputElements;
//			delete form.validationElements;
			form.validators = {};
			form.inputElements = [];
			form.validationElements = [];
		}
		if(!suppressInit)
			$scope.init();
	};

}]);

form.directive("aiValidateForm", [function () {

	var validators;

	validators = {
		'required': '{{name}} is required.',
		'minlength': '{{name}} must be at least {{value}} characters in length.',
		'maxlength': '{{name}} must not exceed {{value}} characters in length.',
		'ng-required': '{{name}} is required.',
		'ng-minlength': '{{name}} must be at least {{value}} characters in length.',
		'ng-maxlength': '{{name}} must not exceed {{value}} characters in length.',
		'min': '{{name}} must be at least {{value}}.',
		'max': '{{name}} must must not exceed {{value}}.',
		'ng-pattern': '{{name}} must match the pattern {{value}}.',
		'email': '{{name}} must be a valid email address.',
		'tel': '{{name}} must be a valid phone number.',
		'url': '{{name}} must be a valid url web address.',
		'date': '{{name}} must be a valid date.',
		'time': '{{name}} must be a valid time.',
		'datetime': '{{name}} must be a valid date/time value.',
		'ai-compare': '{{name}} must be equal to compare field.'
	};

	return {
		restrict: 'A',
		controller: 'AiValidateFormController',
		compile: function (tElement, tAttrs) {

		    var inputs = tElement[0].querySelectorAll('input,textarea,select');

		    if (inputs && inputs.length) {		   
			    angular.forEach(inputs, function (input) {
			        input = angular.element(input);		
			        var attrs = input[0].attributes,   		
						name,
						model;
					if(!attrs['name']){
						model = attrs['ng-model'] || attrs['data-ng-model'] || undefined;
						name = model ? model.value.split('.').pop() : null;
						if(name){
							input.attr('name', name);
						}
					}
				});
		    }


			return function (scope, element, attrs) {

				var form, formName, defaults;

				defaults = {

					exclude: [],                                                        // array of name attributes to exclude from mapping.
					template: '<span class="ai-validate-message">{{message}}</span>',   // the template to use for ai-validation-message. can be html string,
																						// 'tooltip top' where "top" is the bootstrap position
																						// of the tooltip. positions ('top', 'right', 'bottom', 'left')
					tooltipClass: 'animated fadeIn',                                    // the additional classes to add. if null no classes are added.
					tooltipAdj: { top: -2.5, left: 0 },                                 // there are cases where a slight adjustment is needed when using tooltips. This adjusts the adjusted position offset.
					tooltipFallback: 'top',                                             // when tooltip gets pushed off screen fallback to this position. if that doesn't work sorry - bout - ur - luck!
																						// default leverages animate.css see http://daneden.github.io/animate.css/

					validators: validators,                                             // the validation message defaults to add validation for (merges with default validators).
					validatorMessages: {},                                              // custom validation messages
					validatorPrefixes: ['ai'],                                          // validation expressions for angular by default strip "ng" from the expression,
																						// hence if you have custom validators you may need this to be stripped as well.
																						// for example if you have a directive "myValidator" which in markup would be my-validator

					validateOnDirty: true,                                              // validation is throw when message is dirty but invalid.
					validateOnSubmit: true,                                             // throw validation on form submission.
					validateOnDirtyEmpty: true,                                         // when validate on dirty is true then dirt validation events fire even if model value is undefined/null.
					pristineOnReset: true,                                              // when form is reset return to pristine state.

					messageTitlecase: true,                                             // when validation messages are show convert to title case (useful when ng-model properties are lower case).
					novalidate: true,                                                   // when true adds html5 novalidate tag.
					onBind: null                                                        // callback called after the form is initialized returns the form object.

				};

				formName = element.attr('name') || null;

				/* if not form name create one or throw error when multiple */
				if(!formName)
					throw new Error('Form name is invalid or missing. Please use name="some_value" to name your form.');

				/* set primary scope variables */
				//scope.form = scope[formName] || null;
				form = scope[formName] || undefined;

				if(!form)
					throw new Error('Scope does not contain the requested form.');

				/* save some vars to the scope */
				scope.formElement = element;
				scope.formName = formName;
				scope.parentScope = scope.$parent;

				/* extend our options */
				scope.options = angular.extend(defaults, scope.$eval(attrs.aiValidateForm));

				if(scope.options.novalidate)
					element.attr('novalidate', '');

				/* watch options for changes */
				scope.$watch('options', function (newVal, oldVal) {
					if(newVal === oldVal) return;
					/* merge the options */
					scope.options = angular.extend(scope.options, newVal);
				}, true);

				/* initialize the form */
				scope.init(form);


			}

		}

	}
	
}]);

form.directive("aiValidateMessage", [function () {

	return {
		restrict: "AE",
		require: '?aiValidateForm',
		link: function (scope, element, attrs, ctrl) {

			var input;

			/* ngShow requried to show/hide val msgs return if not present */
			if(!attrs.ngShow) return;

			/* if validate for find element and add class */
			if(attrs.aiValidateMessage){
				input = scope.findElement('[name="' + attrs.aiValidateMessage + '"]', document);
				if(input)
					input.addClass('ai-validate-input');
			}

			/* make sure the element has the ai-validate-message class */
			if (!element.hasClass('ai-validate-message'))
				element.addClass('ai-validate-message');

			/* watch expression for summary */
			scope.watchExpression(attrs.ngShow,  element.text());

  		    /* add watcher for manual validation errors so
			* summary/local message are properly updated */
			scope.$watch(function () {
				var form = scope[scope.formName];
				return form.summaryElement;
			}, function (newVal, oldVal) {
				if (newVal)
					element.addClass('ai-summary');
				else
					element.removeClass('ai-summary');
			});

		}

	}

}]);


