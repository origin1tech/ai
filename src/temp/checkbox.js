var check = angular.module('ai.widget.check', []);

check.directive('aiCheck', [ '$compile', '$timeout', function ($compile, $timeout) {

    /*
     * type: can be 'font' or 'image'
     * on: 'class on or image on'
     * off: 'class off or image off'
     * parentTrigger: true if parent true will trigger change state.
     */

    return {

        restrict: 'A',
        scope: true,
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {

            var options, defaults, init, initializing,
                changeState, template, changingState, disabled;

            initializing = false;
            changingState = false;
            disabled = false;

            defaults = {
                type: 'font',
                on: 'fa fa-check-square-o',
                off: 'fa fa-square-o',
                cssClass: 'ai-check',
                cssClassActive: 'active',
                template: '<span ng-click="changeState()"></span>',
                fontTemplate: '<i ng-class="source"></i>',
                imageTemplate: '<img ng-src="source" />',
                parentTrigger: true,
                onClick: null
            };

            scope.changeState = function changeState (setProp, suppressModel) {

                if(disabled) return;

                changingState = true;

                setProp = setProp || false;

                var state = scope.state;
                scope.state =! scope.state;

                template.removeClass(options.cssClassActive);

                if(state === true){
                    scope.source = options.off;
                } else {
                    scope.source = options.on;
                    template.addClass(options.cssClassActive);
                }

                if(ngModel && !suppressModel)
                    ngModel.$setViewValue(scope.state);

                if(setProp)
                    element.prop('checked', scope.state);

                if(options.onClick)
                    options.onClick(scope.state, scope.source);

                changingState = false;

            };

            scope.$watch(attrs.ngModel, function (newVal, oldVal) {
                disabled = scope.$eval(attrs.ngDisabled);
                if(disabled)
                    element.parent().addClass('disabled');
                else
                    element.parent().removeClass('disabled');
                if(newVal !== undefined && newVal !== null) {
                    if((newVal !== scope.state) && !changingState)  {
                        scope.changeState(newVal, true);
                    }
                }
            });

            scope.$watch(attrs.aiCheck, function (newVal, oldVal) {
                if(newVal === oldVal) return;
                options = angular.extend({}, defaults, scope.$eval(newVal));
                init();
            },true);


            init = function init() {

                if(initializing) return;
                initializing = true;

                if(options.type !== 'font' && options.type !== 'image') return;

                /* hide the original element */
                var innerTemplate,
                    disabled,
                    initVal;

                /* cloned element should be hidden */
                element.css({ display: 'none'});

                disabled = scope.$eval(attrs.ngDisabled);

                if(disabled)
                    element.parent().addClass('disabled');
                else
                    element.parent().removeClass('disabled');

                if(!template) {

                    /* set the template */
                    template = angular.element(options.template);


                    /* add class if provided */
                    if(options.cssClass) template.addClass(options.class);

                    /* set the inner template which shows the checked/unchecked states */
                    innerTemplate = options.type === 'font' ?
                        angular.element(options.fontTemplate) :
                        angular.element(options.imageTemplate);

                    /* add the inner template to main template */
                    template.append(innerTemplate);

                }

                if(options.parentTrigger){
                    var parent = element.parent();
                    parent.on('click', function (e) {
                        var target =  e.target.tagName.toLowerCase();
                        if(target !== 'i' && target !== 'img' && target !== 'input') {
                            e.preventDefault();
                            scope.$apply(function () {
                                scope.changeState(true);
                            });
                        }
                    });
                }

                /* make sure we have an active class */
                options.cssClassActive = options.cssClassActive || 'active';

                $timeout(function () {

                    /* get the initial value */
                    initVal = element.prop('checked') || false;

                    /* iff initial value set to on val */
                    scope.state = initVal;

                    scope.source = initVal ? options.on : options.off;

                    if(options.cssClass)
                        template.addClass(options.cssClass);

                    if(scope.state)
                        template.addClass(options.cssClassActive);

                    /* compile the template and add it */
                    element.after($compile(template)(scope));



                    initializing = false;

                });

            };

            options = angular.extend({}, defaults, scope.$eval(attrs.aiCheck));

            init();

        }
    }

}]);