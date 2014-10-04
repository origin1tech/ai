(function () {
    'use strict';

    angular.module('ai.autoform', [])

        .provider('$autoform', function $autoform() {

            var defaults = {
                    prefix: '',                 // value to prepend to models.
                    labels: false              // when true labels are created.
                },
                get, set;

            set = function (options) {
                defaults = angular.extend(defaults, options);
            };

            get = ['$rootScope', '$compile', function ($rootScope, $compile) {

                function buildAttributes(attributes) {
                    var result = '';
                    angular.forEach(attributes, function (v, k) {
                        result += (k + '="' + v + '"');
                    });
                    return result;
                }

                function AutoformFactory(element, options) {

                    var $module = {},
                        template = '',
                        scope;

                    scope = options.scope || $rootScope.$new();
                    options = scope.options = angular.extend(defaults, options);

                    angular.forEach(options.model, function (v, k) {

                        var config = options.config[k] || {},
                            labelStr = k.charAt(0).toUpperCase() + k.slice(1),
                            attributes,
                            name,
                            ngModel,
                            type;

                        if(config){

                            type = config.type || 'text';
                            attributes = buildAttributes(config.attributes);
                            ngModel = options.prefix ? ' ng-model="' + options.prefix + '.' + k + '" ': ' ng-model="' + k + '" ';
                            ngModel = config.model === false ? '' : ngModel;
                            name = config.attributes && config.attributes.name ? '' : ' name="' + k + '" ';

                            if(type !== 'radio' && type !== 'checkbox')
                                template += '<div class="form-group">';
                            else
                                template += '<div class="' + type + '">';

                            if(config.label){
                                if(type !== 'radio' && type !== 'checkbox')
                                    template += '<label>' + labelStr + '</label>';
                                else
                                    template += '<label>';
                            }


                            if(type === 'select' || type === 'textarea'){

                                if(type === 'textarea'){
                                    template += '<textarea' + name + ngModel + 'class="form-control"></textarea>';
                                } else {
                                    scope.items = config.items;
                                    var opt = angular.isObject(config.data) ? 'key as value for (key, value) in list' : 'item.' + config.value + ' as item.' + config.text + ' for item in items',
                                        select = '<select' + name + ngModel + 'class="form-control"' + attributes + '>' +
                                            '<option ng-options="' + opt + '"></option>' +
                                            '</select>';

                                    template +=  select;
                                }

                            } else {

                                if(type === 'checkbox' || type === 'radio'){
                                    template += '<input' + name + ngModel + 'type="' + type + '"' + attributes + '/> ' + labelStr + '</label>' ;
                                } else {
                                    template += '<input' + name + ngModel + 'type="' + type + '" class="form-control"' + attributes + '/>';
                                }

                            }

                            if(config.help)
                                template += '<p class="help-block">' + config.help + '</p>';
                            template += '</div>';
                        }

                    });

                    template += '<div class="form-buttons">' +
                        '<button type="submit" class="btn btn-primary">Submit</button>' +
                        '</div>';

                    template = $compile(template)(scope);

                    element.empty().html(template);


                    return $module;

                }

                return AutoformFactory;

            }];

            return {
                $get: get,
                $set: set
            };

        })

        .directive('aiAutoform', ['$rootScope', '$autoform', function($rootScope, $autoform) {
            console.log('auto form')
            return {
                //restrict: 'AC',
                scope: {
                    options: '&aiAutoform',
                    model: '=ngModel'
                },
               // priority: -1,
                link: function (scope, element, attrs) {

                    var defaults, options, $module;

                    defaults = {
                        scope: scope
                    };

                    function init() {

                        // model may be passed in options or via ngModel.
                        options.model = options.model || scope.model;

                        // create the directive.
                        $module = $autoform(element, options)
                    }

                    options = angular.extend(defaults, scope.$eval(scope.options));

                    init();

                }

            }

        }]);

})();
