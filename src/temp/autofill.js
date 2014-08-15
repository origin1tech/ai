'use strict';

var autofill = angular.module('ai.validate.autofill', []);

autofill.directive("aiValidateAutofill", [ 'AiHelpers', function (AiHelpers) {

    return {
        restrict: 'A',
        priority: -1,
        link: function (scope, element, attrs) {

            var tag, formName, angularForm, form, isForm,
                options, defaults, parse, inputs;

            /* placeholder of inputs that should be processed */
            inputs = [];

            /* callback: can be used to callback final submit function.
            *  types:   array of element types. can be simple tagName like "input"
            *           or can be type e.g. input[type="text"]
            */
            defaults = {
                callback: null,
                types: ['input', 'select', 'textarea']
            };

            /* merge options */
            options = attrs.aiValidateAutofill ? angular.extend(defaults, attrs.aiValidateAutofill) : defaults;

            isForm = false;
            tag = element[0].tagName.toLowerCase();

            /* check if this is a field or is form */
            if(tag === 'form'){
                form = element|| null;
                isForm = true;
                inputs = element[0].querySelectorAll(options.types.join(','));
            } else {
                form =  AiHelpers.findParent(element, 'form') || null;
                inputs.push(element[0]);
            }

            /* get the name of the form */
            formName = form.prop('name');

            /* set the form in scope */
            angularForm = scope[formName] || null;

            /* form && name is required */
            if(!form || !angularForm)
                return;

            /* add listener */
            form[0].addEventListener('submit', function (e){ parse(e); });

            /* parse the input for autofill */
            parse = function(e) {

                angular.forEach(inputs, function(input) {

                    var attrs = input.attributes,
                        ngAttr = attrs['ng-model'] || attrs['data-ng-model'] || null,
                        modelValue,
                        inputValue,
                        ngModel,
                        property;

                    /* can't do anything without ngModel just return */
                    if(!ngAttr)
                        return;

                    /* get the property name from ngModel */
                    property = ngAttr.value.split('.').pop();
                    modelValue = scope.$eval(ngAttr.value);
                    inputValue = input.value && input.value.length > 0 ? input.value : null;
                    ngModel = angularForm[property] || null;

                    /* must be able to access the model */
                    if(!ngModel)
                        return;

                    if(inputValue && (inputValue !== modelValue)){

                        /* placeholder for element pristine */
                        var isPristine = false;

                        /* check if pristine */
                        if(ngModel.$pristine)
                            isPristine = true;

                        /* check the model and set to original pristine state */
                        ngModel.$setViewValue(inputValue);
                        ngModel.$setPristine(isPristine);

                    }

                });

                /* if trigger is callback function */
                if(angular.isFunction(options.callback))
                    options.trigger(e);

            };

        }

    }

}]);