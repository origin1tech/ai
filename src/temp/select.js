var select = angular.module('ai.widget.select', []);

select.directive('aiSelect', [ '$http', '$q', '$compile', '$timeout', function ($http, $q, $compile, $timeout) {

    return {
        restrict: 'A',
        scope: {
            options: '&aiSelect'
        },
        //template: '<select ng-model="model" ng-change="selectChange"></select>',
        require: '^ngModel',
        link: function (scope, element, attrs, ngModel) {

            var defaults, init, buildTemplate, normalize, trim, filterValues;

            /*
             * defaultSelect: if true adds default "please select" as first value in select. (default: true)
             * defaultSelectText: text for default select options (default: 'Please Select')
             * multiple: if true allows multiple selections. (default: false)
             * source: can be array of objects or http url. if url is mapped to config.url (default: null).
             * config: source if url is mapped to config.url config is passed to http promise all angular http config options supported. (default: method, url, cache).
             * text: the property to use for the text value displayed in the select list. (default: 'text')
             * value: the value property to bind to when selection is made (default: 'value')
             * onChange: when an item is selected the function is called passing selected, event.
             * onChangeDefault: when true sets value to defaultSelect after change.
             */
            defaults = {
                defaultSelect: true,
                defaultSelectText: 'Please Select',
                source: [],
                config: {
                    method: 'get',
                    url: null,
                    cache: true
                },
                text: 'text',
                value: 'value',
                groupBy: null,
                filter: null,
                appendText: false,
                onChange: null,
                onChangeDefault: false,
                onError: null
            };

            buildTemplate = function buildTemplate(options) {

                var template, text, value;

                text = '{{item.' + options.text + '}}';
                value = '{{item.' + options.value + '}}';

                if(scope.options.appendText)
                    text += scope.options.appendText;

                template = '';

                if(options.defaultSelect)
                    template += '<option value="">' + options.defaultSelectText + '</option>';

                template += '<option ng-repeat="item in options.source" value="' + value + '">' + text + '</option>';

                return template;

            };

            normalize = function normalize(source) {

                if(!angular.isArray(source)) return false;

                var first = source[0],
                    arr = [];

                if(!angular.isObject(first)){

                    /* make sure we set properties to defaults we are normalizing to */
                    scope.options.text = 'text';
                    scope.options.value = 'value';

                    /* if not an object and is simple array of strings normalize to object */
                    angular.forEach(source, function (item) {
                        arr.push({ text: item, value: item });
                    });

                    scope.options.source = arr;

                }

                return true;

            };

            trim = function trim() {
                var children = element.children();
                angular.forEach(children, function(child) {
                    child = angular.element(child);
                    var val = child.val(),
                        isUndefined = val.indexOf('?') !== -1;
                    if(!child.text() || isUndefined)  {
                        child.remove();
                    }
                });
            };

            filterValues = function filterValues() {
                var filter = scope.options.filter;
                if(filter){
                    scope.options.source.filter(function(item) {
                        return item[filter.property] !== filter.value;
                    });
                }
            };

            init = function init () {

                /* can't build without source */
                if(!scope.options || !scope.options.source) return;

                //filterValues();

                /* normalize data */
                if(angular.isString(scope.options.source)) {

                    scope.options.config.url = scope.options.source;
                    $http(scope.options.config).then(
                        function(result){
                            if(normalize(result.data) === false)
                                return false;
                            scope.options.source = result.data || [];
                            applyTemplate();
                        },
                        function (result){
                            /* return the error to callback or just console log */
                            if(scope.options.onError) {
                                scope.options.onError(result);
                            } else {
                                console.log('ai-select encountered an unrecoverable error.');
                            }
                        }
                    );

                } else {

                    if(normalize(scope.options.source) === false) return false;
                    applyTemplate();

                }

                function applyTemplate() {

                    /* get the template */
                    var template = angular.element(buildTemplate(scope.options));

                    element.empty();
                    element.off('change');
                    element.unbind('change');

                    element.on('focus', function (){
                        trim();
                    });

                    element.on('change', function (e) {
                        var selected =  scope.options.source.filter(function (item){
                            return item.id === element.val();
                        })[0] || undefined;
                        scope.$apply(function() {
                            if(scope.options.onChangeDefault && scope.options.defaultSelect)
                                element.val('');
                            if(scope.options.onChange && angular.isFunction(scope.options.onChange))
                                scope.options.onChange(selected, e);
                        });
                        trim();
                    });


                    element.after($compile(template)(scope));

                    $timeout(function () {

                        var exists, selected;
                        exists = scope.options.source.filter(function(item) {
                            return item[scope.options.value] === ngModel.$modelValue;
                        })[0] || null;

                        selected = exists ? ngModel.$modelValue : '';
                        element.val(selected);

                        /* hack to make sure we don't
                           end up with empty options.
                         */
                         trim();
                    });
                }

            };

            scope.trim = trim;

            scope.$watch(attrs.aiSelect, function (newVal, oldVal) {

                if(newVal === oldVal) return;
                scope.options = angular.extend(defaults, scope.options, scope.$eval(newVal));
                init();
            });

            /* merge options */
            scope.options = angular.extend(defaults, scope.$eval(scope.options));

            init();

        }

    }

}]);


