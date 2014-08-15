
var colorpicker = angular.module('ai.widget.colorpicker', []);

colorpicker.run([function () {

    if(typeof $.fn.colorpicker === undefined)
        throw new Error('ai-colorpicker requires bootstrap colorpicker please see: http://mjolnic.github.io/bootstrap-colorpicker/');

}]);

colorpicker.directive('aiColorpicker', [ '$timeout', function ($timeout) {

    /*

     NOTE: the following methods are available. use on create to get reference in your scope.

     .colorpicker('show') - Show the color picker
     .colorpicker('update') - Refreshes the widget colors (this is done automatically)
     .colorpicker('hide') - Hide the color picker
     .colorpicker('disable') - Disable the color picker.
     .colorpicker('enable') - Enable the color picker.
     .colorpicker('place') - Updates the color picker's position relative to the element
     .colorpicker('destroy') - Destroys the colorpicker widget and unbind all .colorpicker events from the element and component
     .colorpicker('setValue', value) - Set a new value for the color picker (also for the input or component value). Triggers 'changeColor' event.


     NOTE: in the event object the property color has several methods see below

     .setColor(value) - Set a new color. The value is parsed and tries to do a quess on the format.
     .setHue(value) - Set the HUE with a value between 0 and 1.
     .setSaturation(value) - Set the saturation with a value between 0 and 1.
     .setLightness(value) - Set the lightness with a value between 0 and 1.
     .setAlpha(value) - Set the transparency with a value between 0 and 1.
     .toRGB() - Returns a hash with red, green, blue and alpha.
     .toHex() - Returns a string with HEX format for the current color.
     .toHSL()-  Returns a hash with HSLA values.

     NOTE: the following events can be listened to. all events return the event and target element.

     onCreate - when the picker is created.
     onShow - when the picker is shown.
     onHide - when picker is hidden.
     onDisable - when picker is disabled.
     onEnable - when picker is enabled.
     onChange - when picker color changes.
     onDestroy - when picker is destroyed.

     */

    return {

        restrict: 'A',
        scope: {
            options: '&aiColorpicker'
        },
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {

            var target, defaults, init, attachEvents;

            defaults = {

                /* options */
                format: false,
                color: false,
                container: false,
                horizontal: false,
                component: '.add-on, .input-group-addon',
                input: 'input',
                addon: false,  // when true assumes addon is used and attaches plugin to parent div.

                /* events */
                onCreate: null,
                onShow: null,
                onHide: null,
                onDisable: null,
                onEnable: null,
                onChange: null,
                onDestroy: null

            };


            attachEvents = function attachEvents() {

                if(!target) return;

                var options = scope.options;

                target.on('changeColor', function (e) {
                    scope.$apply(function () {
                        if(ngModel)
                            ngModel.$setViewValue(e.color.toHex());
                        if(options.onChange)
                            options.onChange(e, target);

                    });
                });

                if(options.onCreate)
                    target.on('create', function (e) {
                        scope.$apply(function () {
                           options.onCreate(e, target);
                        });
                    });

                if(options.onShow)
                    target.on('showPicker', function (e) {
                        scope.$apply(function () {
                            options.onShow(e, target);
                        });
                    });

                if(options.onHide)
                    target.on('hidePicker', function (e) {
                        scope.$apply(function () {
                            options.onHide(e, target);
                        });
                    });

                if(options.onDisable)
                    target.on('disable', function (e) {
                        scope.$apply(function () {
                            options.onDisable(e, target);
                        });
                    });

                if(options.onEnable)
                    target.on('enable', function (e) {
                        scope.$apply(function () {
                            options.onEnable(e, target);
                        });
                    });

                if(options.onDestroy)
                    target.on('destroy', function (e) {
                        scope.$apply(function () {
                            options.onDestroy(e, target);
                        });
                    });

            };

            init = function init() {

                var parent = element.parent();

                if(target)
                    target.colorpicker('destroy');

                target = element;
                if(scope.options.addon)
                    target = parent;

                $timeout(function () {

                    attachEvents();

                    target.colorpicker(scope.options);
                });

            };

            scope.options = angular.extend({}, defaults, scope.$eval(scope.options));

            init();

        }
    };

}]);
