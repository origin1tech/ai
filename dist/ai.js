(function () {
    'use strict';

angular.module('ai', [

    /* Providers
    *******************************************************************/

    /*
     * Google Voice Click2Call
     * Includes directive for connecting client to Google Voice number.
     */
    'ai.click2call',

    /*
     * Dynamic Route Resolver
     * Dynamically based on convention handles route.
     */
    'ai.resolver',


    /* Directives
    *******************************************************************/

    /*
     * Nicescroll Directive
     * Ports nicescroll to an Angular directive.
     * reference: see: http://areaaperta.com/nicescroll/
     */
    'ai.nicescroll'

]);

angular.module('ai.click2call', [])

.provider('$click2call', function $click2call() {

    var defaults, get, set, baseTemplate;

    // default settings.
    defaults = {
        gvid: undefined,
        template: 'ai-click2call',
        message: 'O.K we\'re calling to connect you! Be just a sec...'
    };

    // the base template,
    // you may define custom templates as well.
    baseTemplate = '<form name="c2cForm" class="ai-click2call" novalidate ng-submit="call(c2cForm, model)">' +
                        '<div class="form-group">' +
                            '<input class="form-control" name="name" type="text" ng-model="model.name" ' +
                            'placeholder="Name (optional)" />' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<input class="form-control" name="number" type="text" ng-model="model.number" ' +
                            'placeholder="Number (7605551212)" required/>' +
                            '<span class="ai-click2call-error" ' +
                            'ng-show="c2cForm.name.$error.required || (c2cForm.$dirty && c2cForm.$invalid)">' +
                            'Your number is required.</span>' +
                        '</div>' +
                        '<p>' +
                            '<button class="btn btn-primary btn-block" type="submit">' +
                            'Call Now</button>' +
                        '</p>' +
                        '<p class="ai-click2call-message" ng-show="model.calling" ng-bind="model.message"></p>'+
                    '</form>';

    // set global provider options.
    set = function (value) {
        defaults = angular.extend(defaults, value);
    };

    // get provider
    get = ['$rootScope', '$templateCache', '$http', '$q', '$compile',
          function ($rootScope, $templateCache, $http, $q, $compile) {

        var helpers = {

            /**
             * Finds element using provided query.
             * @param {string} query - the path to find.
             * @param {string} element - the element root path.
             * @returns {element}
             */
            find: function find(query, element) {
                return angular.element((element || document).querySelectorAll(query));
            },

            /**
             * Fetches and/or stores template from $templateCache.
             * @param {string} template - the markup or path to the template.
             * @returns {string}
             */
            fetch: function fetch(template) {

                return $q.when($templateCache.get(template) || $http.get(template))
                    .then(function (res) {
                        if (angular.isObject(res)) {
                            $templateCache.put(template, res.data);
                            return res.data;
                        }
                        return res;
                    });

            },

            /**
             * Validates if string has HTML contents.
             * @private
             * @param {string} str - the string to validate.
             * @returns {boolean}
             */
            isHtml: function isHtml(str) {
                var expStr = '<(br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|wbr|' +
                        '!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|' +
                        'button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|' +
                        'div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|' +
                        'h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|' +
                        'noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|' +
                        'small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|' +
                        'title|tr|track|tt|u|ul|var|video).*?<\/2>',
                    regex = new RegExp(expStr);
                return regex.test(str);
            },

            /**
             * Tests string path to verify that its extension is either html or tpl.
             * @param {string} str - the path to validate.
             * @returns {boolean}
             */
            isPath: function isPath(str) {
                var ext = str.split('.').pop();
                return ext === 'html' || ext === 'tpl';
            }

        };

        // load template if exists.
        if(defaults.template)
            if(!$templateCache.get(defaults.template))
                $templateCache.put(defaults.template, baseTemplate);

      /**
       * Factory that builds the provider.
       * @param {element} element - the element which to apply the module.
       * @param {object} config - module configuration options.
       * @returns {object}
       * @constructor
       */
        function ModuleFactory(element, config) {

            var $module = {},
                node = element[0].nodeName.toLowerCase(),
                options = $module.$options = angular.extend({}, defaults, config),
                scope = $module.$scope = (options.scope ? options.scope.$new() : $rootScope.$new());

            scope.model = {
                message: options.message
            };

            // add iframe & submit.
            function call(buttonId, cidNumber, cidName) {

                var iframe = document.createElement('iframe'),
                    doc, form, input;

                iframe.style.width = 0;
                iframe.style.height = 0;
                iframe.style.border = 0;
                document.body.appendChild(iframe);

                if(iframe.contentDocument)
                    doc = iframe.contentDocument;
                else if(iframe.contentWindow)
                    doc = iframe.contentWindow.document;
                else if(iframe.document)
                    doc = iframe.document;
                if(doc === null)
                    throw new Error('Document not initialized');

                doc.open(); doc.write('');doc.close();

                form = doc.createElement('form');

                form.method='post';
                form.action='https://clients4.google.com/voice/embed/webButtonConnect';

                input = doc.createElement('input');
                input.type='text';
                input.name='buttonId';
                input.value= '' + buttonId;
                form.appendChild(input);

                input = doc.createElement('input');
                input.type='text';
                input.name='callerNumber';
                input.value= '' + cidNumber;
                form.appendChild(input);

                input = doc.createElement('input');
                input.type='text';
                input.name='name';
                input.value= '' + cidName;
                form.appendChild(input);

                input = doc.createElement('input');
                input.type='text';
                input.name='showCallerNumber';
                input.value= '1';
                form.appendChild(input);

                doc.body.appendChild(form);

                form.submit();

            }

            // add call event to scope.
            scope.call = $module.call = function (form, model) {
                if(!model || !model.number) return alert('Oops you forgot your number!');
                if(!form.$valid) return;
                model.number = model.number.replace(/\D/g, '');
                model.calling = true;
                if(model.number.length < 10)
                    return alert('Oops that doesn\'t look like enough numbers.');
                if(model.number.charAt(0) !== '1')
                    model.number = '1' + model.number;
                call(options.gvid, model.number, model.name || 'Unknown');
            };

            // append the template.
            helpers.fetch(options.template).then(function (template) {
                template = $compile(template)(scope);
                element.append(template);
            });

            return $module;
        }

        return ModuleFactory;
    }];

    // retun getter/setter.
    return {
        $set: set,
        $get: get
    };

})
.directive('aiClick2call', ['$click2call', function ($click2call) {
    return{
        restrict: 'EA',
        scope: {
            options: '&aiClick2call'
        },
        link: function (scope, element, attrs) {
            var defaults, module, options;

            defaults = {
                scope: scope
            };

            // merge options.
            options = angular.extend(defaults, scope.$eval(attrs.aiClick2call));

            // create the directive.
            module = $click2call(element, options);


        }
    };
}]);
angular.module('ai.resolver', [])

    .provider('$routeResolver', function $routeResolver() {

        this.config = (function () {

            var defaults = {
                    views: '/views',
                    controllers: '/controllers'
                },
                areas = {};

            function createArea(name, obj) {
                if(areas[name]) throw new Error('Duplicate area ' + name + ' detected.');
                areas[name] = angular.extend(defaults, obj);
            }

            function updateArea(name, key, value){
                if(areas[name] && areas[name][key]){
                    areas[name][key] = value;
                }
            }

            function getArea(name) {
                return areas[name] || undefined;
            }

            return {
                createArea: createArea,
                updateArea: updateArea,
                getArea: getArea
            };

        }());

        this.route = (function (config) {

            var resolve = function (baseName) {

                    var route = {},
                        area = config.getArea(baseName);

                    route.templateUrl = area.controllers() + baseName + '.html';
                    route.controller = baseName + 'Controller';

                    route.resolve = {
                        load: ['$q', '$rootScope', function ($q, $rootScope) {
                            var dependencies = [config.getControllersDirectory() + baseName + '.js'];
                            return getDependencies($q, $rootScope, dependencies);
                        }]
                    };

                    route.access = 5;

                    return route;
                },

                getDependencies = function ($q, $rootScope, dependencies) {
                    var defer = $q.defer();
                    require(dependencies, function () {
                        defer.resolve();
                        $rootScope.$apply();
                    });

                    return defer.promise;
                };

            return {
                resolve: resolve
            };

        }(this.config));

        this.$get = function ($routeProvider, $locationProvider, $controllerProvider, $compileProvider,
                              $filterProvider, $provide) {
            return this;
        };

    });
angular.module('ai.nicescroll', [])
    .run([function () {
        if(!window.NiceScroll)
            throw new Error('ai-nicescroll requires the NiceScroll library see: http://areaaperta.com/nicescroll/');
    }])
    .directive('aiNicescroll', [function() {
        return {
            restrict: 'AC',
            scope: {
                options: '&aiNicescroll'
            },
            link: function(scope, element, attrs) {
                var defaults, init, plugin;
                defaults = {
                    horizrailenabled: false
                };
                init = function init() {
                    plugin = element.niceScroll(scope.options);
                };
                scope.options = angular.extend(defaults, scope.$eval(scope.options));
                init();
            }
        };
    }]);
})();