angular.module('ai.click2call', [])

    .run(['$templateCache', function ($templateCache) {
        var template = '<form name="c2cForm" class="ai-click2call" novalidate ng-submit="call(c2cForm, model)">' +
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
        $templateCache.put('click2call.tpl.html', template);
    }])

    .provider('$click2call', function $click2call() {

        var defaults, get, set;

        // default settings.
        defaults = {
            gvid: undefined,
            template: 'ai-click2call',
            message: 'O.K we\'re calling to connect you! Be just a sec...'
        };

        // set global provider options.
        set = function (value) {
            defaults = angular.extend(defaults, value);
        };

        // get provider
        get = ['$rootScope', '$templateCache', '$http', '$q', '$compile',
            function ($rootScope, $templateCache, $http, $q, $compile) {

                var helpers = {

                    // finds html element by query.
                    find: function find(query, element) {
                        return angular.element((element || document).querySelectorAll(query));
                    },

                    // helper function to load template
                    fetch: function fetch(template) {
                        return $q.when($templateCache.get(template) || $http.get(template))
                            .then(function (res) {
                                if (angular.isObject(res)) {
                                    $templateCache.put(template, res.data);
                                    return res.data;
                                }
                                return res;
                            });
                    }
                };

                // Click2Call Factory
                function ModuleFactory(element, options) {

                    var $module = {},
                        scope;

                    scope = options.scope || $rootScope.$new();
                    options = scope.options = angular.extend(defaults, options);

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
            restrict: 'EAC',
            scope: {
                options: '&aiClick2call'
            },
            link: function (scope, element) {

                var defaults, directive, init, options;

                defaults = {
                    scope: scope
                };

                // initialize the directive.
                init = function () {
                    directive = $click2call(element, options);
                };

                // merge options.
                options = angular.extend(defaults, scope.$eval(scope.options));

                init();

            }
        };
    }]);
