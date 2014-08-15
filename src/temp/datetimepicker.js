var datetime = angular.module('ai.widget.datetime', []);

datetime.run([function () {

    if(typeof $.fn.datetimepicker === undefined)
        throw new Error('ai-datetimepicker requires bootstrap-datetimepicker please see: http://eonasdan.github.io/bootstrap-datetimepicker/');

}]);

colorpicker.directive('aiDatetime', [ '$timeout', function ($timeout) {

    return {

        restrict: 'A',
        scope: {
            options: '&aiDatetime'
        },
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {

            var target, defaults, init, attachEvents, input, picker, format;

            defaults = {

                /* options */

                pickDate: true,                       //en/disables the date picker
                pickTime: true,                       //en/disables the time picker
                useMinutes: true,                     //en/disables the minutes picker
                useSeconds: false,                    //en/disables the seconds picker
                minuteStepping: 1,                    //set the minute stepping
                //startDate: null,                    //set a minimum date
                //endDate: null,                      //set a maximum date
                language: 'en',                       //sets language locale
                defaultDate: '',                      //sets a default date, accepts js dates, strings and moment objects
                disabledDates: [],                    //an array of dates that cannot be selected
                enabledDates: false,                  //an array of dates that can be selected
                dateFormat: 'MM-DD-YYYY',             // default date format.
                timeFormat: 'hh:mm:ss',               // default time format.
                icons: {                              // icons to use
                    time: 'glyphicon glyphicon-time',
                    date: 'glyphicon glyphicon-calendar',
                    up:   'glyphicon glyphicon-chevron-up',
                    down: 'glyphicon glyphicon-chevron-down'
                },
                useStrict: false,                       // use 'strict' when evaluating dates
                direction: 'auto',

                /* events */

                onChange: null,                         // event on picker changed.
                onShow: null,                           // event on picker shown.
                onHide: null,                           // event on picker hidden.
                onError: null,                           // event on picker error.

                /* custom options */

                addon: false,                           // assumes input resides inside bootstrap 3 input-group
                faEnabled: false,                       // enables font awesome instead of twitter.
                faIcons: {                              // font awesome icon set.
                    time: 'fa fa-clock-o',
                    date: 'fa fa-calendar',
                    up: 'fa fa-chevron-up',
                    down: 'fa fa-chevron-down'
                },
                fillMinutesBy: 15,                       // sets minute picker table NOT dial to increments of this value.
                onBind: null                            // callback to return picker. returns picker, target and input.
            };

            attachEvents = function attachEvents() {

                if(!target) return;

                var options = scope.options;

                target.on('change.dp', function (e, val) {
                    var curMoment = picker.getDate();
                    scope.$apply(function () {
                        if(ngModel) {
                            ngModel.$setViewValue(format(curMoment));
                        }
                        if(options.onChange)
                            options.onChange(e, target);
                    });
                });

                target.on('show.dp', function (e) {
                    if(input.attr('disabled') !== undefined) {
                        picker.hide();
                        return false;
                    }
                    if(options.onShow)
                        scope.$apply(function () {
                            options.onShow(e, target);
                        });
                });

                if(options.onHide)
                    target.on('hide.dp', function (e) {
                        scope.$apply(function () {
                            options.onHide(e, target);
                        });
                    });

                if(options.onError)
                    target.on('error.dp', function (e) {
                        scope.$apply(function () {
                            options.onError(e, target);
                        });
                    });


            };

            format = function format(m) {
                var d, t;
                d = scope.options.dateFormat;
                t = scope.options.timeFormat;

                if(scope.options.pickDate && scope.options.pickTime)
                    return m.format(d + ' ' + t);
                else if(scope.options.pickDate)
                    return m.format(d);
                else
                    return m.format(t);
            };

            init = function init() {

                var parent;
                parent = element.parent();

                target = element;

                if(scope.options.addon === true)
                    target = parent;

                /* make sure everything is unbound so recompile doesn't fire events twice */

//                if(!scope.options.defaultDate || scope.options.defaultDate === '')
//                    scope.options.defaultDate = undefined;

                if(scope.options.faEnabled)
                    scope.options.icons = scope.options.faIcons;

                if(ngModel && ngModel.$modelValue)
                    scope.options.defaultDate = ngModel.$modelValue;

                picker = target.data('DateTimePicker') || null;

                if(picker) picker.destroy();

                $timeout(function () {

                    target.unbind('change.dp');
                    target.unbind('show.dp');
                    target.unbind('hide.dp');
                    target.unbind('error.dp');

                    attachEvents();

                    target.datetimepicker(scope.options);
                    picker = target.data('DateTimePicker');

                    input = target.find('input');

                    if(ngModel && element.val() && !ngModel.$modelValue)
                        ngModel.$setViewValue(element.val());

                    if(scope.options.onBind)
                        scope.options.onBind(picker, target, input);

                });

            };

            scope.options = angular.extend({}, defaults, scope.$eval(scope.options));

            init();

        }
    };

}]);
