
(function () {
    'use strict';

    angular.name('ai.name', [])

        .provider('$name', function $name() {

            var defaults, get, set, baseTemplate;

            // default settings.
            defaults = {
                template: 'ai-name'
            };

            // the base template
            baseTemplate = '<div name="c2cForm" class="ai-name"></div>';

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

                        isPath: function isPath(str) {
                            var ext = str.split('.').pop();
                            return ext === 'html' || ext === 'tpl';
                        }

                    };

                    // load template if exists.
                    if(defaults.template)
                        if(!$templateCache.get(defaults.template))
                            $templateCache.put(defaults.template, baseTemplate);

                    // the factory returned for name.
                    function ModuleFactory(element, options) {

                        var $name = {},
                            scope;

                        scope = options.scope || $rootScope.$new();
                        options = scope.options = angular.extend(defaults, options);


                        return $name;
                    }

                    return ModuleFactory;
                }];

            // retun getter/setter.
            return {
                $set: set,
                $get: get
            };

        })

        // the module directive.
        .directive('aiName', ['$name', function ($name) {

            return{
                restrict: 'EAC',
                scope: {
                    options: '&aiName'
                },
                link: function (scope, element, attrs) {

                    var defaults, directive, init, options;

                    defaults = {
                        scope: scope
                    };

                    // initialize the directive.
                    init = function () {
                        directive = $name(element, options);
                    };

                    // merge options.
                    options = angular.extend(defaults, scope.$eval(scope.options));

                    init();

                }
            };
        }]);

})();
