(function(window, document, undefined) {
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
                 * @param {object} options - module configuration options.
                 * @returns {object}
                 * @constructor
                 */
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
            link: function (scope, element, attrs) {

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

angular.module('ai.nicescroll', [])

    .directive('aiNicescroll', [function() {

        return {
            restrict: 'EAC',
            scope: {
                options: '&aiNicescroll'
            },
            link: function(scope, element) {

                var defaults, init, plugin;

                console.assert(window.NiceScroll, 'ai-nicescroll requires the NiceScroll library ' +
                    'see: http://areaaperta.com/nicescroll/');

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

angular.module('ai.viewer', [])

    .provider('$viewer', function $viewer() {

        var defaults = {
                view: '<div ng-view />',
                animate: 'slide'
            },
            get, set;

        set = function (options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$rootScope', '$compile', '$location', function ($rootScope, $compile, $location) {

            var prevRoutes = [],
                initialized = false,
                state;

            // store previous route set in/out state.
            $rootScope.$on('$routeChangeStart', function (event, next, current) {

                var prevRoute = prevRoutes.slice(0).pop(),
                    route = next.$$route.originalPath;

                current = current || {
                    $$route: '/'
                };

                if(initialized) {
                    if(route === prevRoute) {
                        state = 'back';
                        prevRoutes.pop();
                    } else {
                        state = 'forward';
                        prevRoutes.push(current.$$route.originalPath);
                    }
                } else {
                    initialized = true;
                }

            });

            function ModuleFactory(element, options) {

                var $module = {},
                    view,
                    scope;

                scope = options.scope || $rootScope.$new();
                options = scope.options = angular.extend(defaults, options);

                view = angular.element(scope.options.view);
                view.addClass('ai-viewer-view');

                // only add ng-class state if animate is enabled.
                if(scope.options.animate)
                    view.attr('ng-class', 'state');

                view = $compile(view)(scope);

                element.addClass('ai-viewer');
                element.append(view);

                // gets previous view.
                $module.getView = function () {
                    return angular.element(document.querySelectorAll('.ai-viewer-view')[0]);
                };

                // gets current state.
                $module.getState = function () {
                    return state;
                };

                $module.forward = function (path) {
                    $location.path(path);
                };

                $module.backward = function (path) {
                    // push route view will see as return path or backward.
                    prevRoutes.push(path);
                    $location.path(path);
                };

                return $module;
            }
            return ModuleFactory;

        }];

        return {
            $get: get,
            $set: set
        };

    })

    .directive('aiViewer', ['$rootScope', '$viewer', function($rootScope, $viewer) {

        return {
            restrict: 'EA',
            scope: {
                options: '&aiViewer'
            },
            link: function(scope, element) {

                var defaults, init, options, $module;

                defaults = {
                    scope: scope
                };

                init = function init() {

                    $module = $viewer(element, options);

                    // listen for route change and update state when animation is enabled.
                    $rootScope.$on('$routeChangeSuccess', function () {

                        var state = $module.getState(),
                            prevView = $module.getView();

                        if(state && scope.options.animate) {
                            // check for previously rendered views.
                            if(prevView)
                                prevView.removeClass(state === 'forward' ? 'back' : 'forward').addClass(state);
                        }

                        scope.state = state;

                    });

                };

                options = angular.extend(defaults, scope.$eval(scope.options));

                init();
            }
        };

    }]);


angular.module('ai.passport.factory', [])

    .provider('$passport', function $passport() {

        var defaults, get, set;

        defaults = {
            levels: {
                0: '*',
                1: 'user',
                2: 'manager',
                3: 'admin',
                4: 'superadmin'
            },

            401: true,                                          // set to false to not handle 401 status codes.
            403: true,                                          // set to false to not handle 403 status codes.
            paranoid: true,                                     // when true, fails if access level is missing.
            splitChar: ',',                                     // char to use to separate roles when passing string.

            // passport paths.
            defaultUrl: '/',                                    // the default path or home page.
            loginUrl: '/login',                                 // path to login form.
            resetUrl: '/passport/reset',                        // path to password reset form.
            recoverUrl: '/passport/recover',                    // path to password recovery form.

            // passport actions
            loginAction:  'post /api/passport/login',           // endpoint/func used fo r authentication.
            logoutAction: '/api/passport/logout',               // endpoint/func used to logout/remove session.
            resetAction:  'post /api/passport/reset',           // endpoint/func used for resetting password.
            recoverAction:'post /api/passport/recover',         // endpoint/func used for recovering password.

            // success fail actions.
            onLoginSuccess: '/',                                // path or func on success.
            onLoginFailed: '/login',                            // path or func when login fails.
            onUnauthenticated: '/login',                        // path or func when unauthenticated.
            onUnauthorized: '/login'                            // path or func when unauthorized.
        };

        set = function (options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$rootScope', '$location', '$http', function ($rootScope, $location, $http) {

            var instance, onSuccess, onFailed,
                onForbidden, onError;

            // nomralize url to method/path object.
            function urlToObject(url) {
                var parts = url.split(' '),
                    obj = { method: 'get' };
                obj.path =  parts[0];
                if(parts.length > 1){
                    obj.method = parts[0];
                    obj.path = parts[1];
                }
                return obj;
            }

            function rolesToLevels(source, roles){
                var arr = [];
                source = source || [];
                angular.forEach(roles, function (v) {
                    if(source[v] !== undefined)
                        arr.push(source[v]);
                });
                return arr;
            }

            // reverse the levels map setting role values as keys.
            function reverseMap(levels) {
                var obj = {};
                angular.forEach(levels, function (v,k) {
                    obj[v] = parseFloat(k);
                });
                return obj;
            }

            function ModuleFactory(options) {

                var roleMap = {};

                // ensure valid object.
                options = options || {};

                // override options map if exists.
                defaults.levels = options.levels || defaults.levels;

                // merge the options.
                this.options = angular.extend(defaults, options);

                // normalize/reverse levels map
                this.options.roles = reverseMap(this.options.levels);
            }

            // login passport credentials.
            ModuleFactory.prototype.login = function login(data) {
                var url = urlToObject(this.options.loginAction),
                    self = this;
                $http[url.method](url.path, data)
                    .then(function (res) {
                        // set to authenticated and merge in passport profile.
                        angular.extend(self, res.data);
                        if(angular.isFunction(self.options.onLoginSuccess)) {
                           self.options.onLoginSuccess.call(this, res);
                        } else {
                            $location.path(self.options.onLoginSuccess);
                        }
                    }, function (res) {
                        if(angular.isFunction(self.options.onLoginFailed)) {
                            self.options.onLoginFailed.call(this, res);
                        } else {
                            $location.path(self.options.onLoginFailed);
                        }
                    });
            };

            ModuleFactory.prototype.logout = function logout() {
                var self = this;
                if(angular.isFunction(this.options.logoutAction)){
                    this.options.logoutAction.call(this);
                } else {
                    var url = urlToObject(this.options.logoutAction);
                    $http[url.method](url.path)
                        .then(function () {
                            // reset passport instance to default.
                            $rootScope.passport = { authenticated: false };
                            instance = new ModuleFactory();
                            $rootScope.Passport = instance;
                            $location.path(self.options.defaultUrl);
                        });
                }
            };

            ModuleFactory.prototype.recover = function recover() {

            };

            ModuleFactory.prototype.reset = function reset() {

            };

            // expects string.
            ModuleFactory.prototype.hasRole = function hasRole(role) {
                var passportRoles = this.roles || [];
                // if string convert to role level.
                if(angular.isString(role))
                    role = this.options.roles[role] || undefined;
                // if public return true
                if(role === 0)
                    return true;
                return passportRoles.indexOf(role) !== -1;
            };

            // expects string or array of strings.
            ModuleFactory.prototype.hasAnyRole = function hasAnyRole(roles) {
                var passportRoles = this.roles || [];
                // if a string convert to role levels.
                if(angular.isString(roles)){
                    roles = roles.split(',');
                    roles = rolesToLevels(this.options.roles, roles);
                }
                // if public return true
                if(roles.indexOf(0) !== -1)
                    return true;
                return roles.some(function (v) {
                    return passportRoles.indexOf(v) !== -1;
                });
            };

            // check if meets the minimum roll required.
            ModuleFactory.prototype.minRole = function requiresRole(role) {
                var passportRoles = this.roles || [],
                    maxRole;
                if(angular.isString(role))
                    role = this.options.roles[role] || undefined;
                // get the passport's maximum role.
                maxRole = Math.max.apply(Math, passportRoles);
                return maxRole >= role;
            };

            // check if role is not greater than.
            ModuleFactory.prototype.maxRole = function requiresRole(role) {
                var passportRoles = this.roles || [],
                    maxRole;
                if(angular.isString(role))
                    role = this.options.roles[role] || undefined;
                // get the passport's maximum role.
                maxRole = Math.max.apply(Math, passportRoles);
                return maxRole < role;
            };

            // reinit passport
            ModuleFactory.prototype.init = function init(options) {
                instance = new ModuleFactory(options);
            };

            // unauthorized handler.
            ModuleFactory.prototype.unauthorized = function unauthorized() {
                var action = this.options.onUnauthorized;
                if(action !== undefined){
                    // action defined check if path
                    // or is function. if func call pass context.
                    if(angular.isFunction(action))
                        return action.call(this);
                    else
                        $location.path(action);
                } else {
                    // default to the login url.
                    $location.path(this.options.loginUrl);
                }
            };

            // make sure we have a singleton.
            function getInstance() {
                if(!instance){
                    instance = new ModuleFactory();
                    $rootScope.Passport = instance;
                }
                return instance;
            }

            return getInstance();

        }];

        return {
            $get: get,
            $set: set
        };

    });

// intercepts 401 and 403 errors.
angular.module('ai.passport.interceptor', [])
    .factory('passportInterceptor', ['$q', '$injector', function ($q, $injector) {
        return {
            response: function(res){
                // get passport here to prevent circ dependency.
                var passport = $injector.get('$passport');
                if (res.status === 401 && $passport.options['401']) {
                }
                if(res.status === 403 && $passport.options['403']){
                }
                return res || $q.when(res);
            },
            responseError: function(res) {
                // get passport here to prevent circ dependency.
                var passport = $injector.get('$passport');
                if (res.status === 401 && $passport.options['401']) {
                }
                if(res.status === 403 && $passport.options['403']){
                }
                return $q.reject(res);
            }
        };
    }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('passportInterceptor');
    }]);

// handles intercepting route when
// required permissions are not met.
angular.module('ai.passport.route', [])
    .run(['$rootScope', '$location', '$passport', function ($rootScope, $location, $passport) {
        $rootScope.$on('$routeChangeStart', function (event, next) {
            var area = {},
                route = {},
                access,
                authorized;
            if(next && next.$$route){
                route = next.$$route;
                if(route.area)
                    area = route.area;
            }
            access = route.access || area.access;
            // when paranoid is true require access params
            // if undefined call unauthorized.
            // when paranoid is false unauthorize is not called
            // when access is undefined.
            if($passport.options.paranoid && access === undefined)
                return $passport.unauthorized();
            if(access !== undefined){
                authorized = $passport.hasAnyRole('*');
                if(!authorized)
                    $passport.unauthorized();
            }
        });
    }]);

// imports above modules.
angular.module('ai.passport', [
    'ai.passport.factory',
    'ai.passport.interceptor',
    'ai.passport.route'
]);
angular.module('ai.storage', [])

    .provider('$storage', function $storage() {

        var defaults = {
            ns: 'app',              // the namespace for saving cookie/localStorage keys.
            cookiePath: '/',        // the path for storing cookies.
            cookieExpiry: 30        // the time in minutes for which cookies expires.
        }, get, set;


        /**
         * Checks if cookies or localStorage are supported.
         * @private
         * @param {boolean} [cookie] - when true checks for cookie support otherwise checks localStorage.
         * @returns {boolean}
         */
        function supports(cookie) {
            if(!cookie)
                return ('localStorage' in window && window.localStorage !== null);
            else
                return navigator.cookieEnabled || ("cookie" in document && (document.cookie.length > 0 ||
                    (document.cookie = "test").indexOf.call(document.cookie, "test") > -1));
        }

        /**
         * Get element by property name.
         * @private
         * @param {object} obj - the object to parse.
         * @param {array} keys - array of keys to filter by.
         * @param {*} [def] - default value if not found.
         * @param {number} [ctr] - internal counter for looping.
         * @returns {*}
         */
        function getByProperty(obj, keys, def, ctr) {
            if (!keys) return def;
            def = def || null;
            ctr = ctr || 0;
            var len = keys.length;
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    if (p === keys[ctr]) {
                        if ((len - 1) > ctr && angular.isObject(obj[p])) {
                            ctr += 1;
                            return getByProperty(obj[p], keys, def, ctr) || def;
                        }
                        else {
                            return obj[p] || def;
                        }
                    }
                }
            }
            return def;
        }

        /**
         * Sets provider defaults.
         * @param {object} options - the options to be merged with defaults.
         */
        set = function (options) {
            defaults = angular.extend(defaults, options);
        };

        /**
         * Angular get method for returning factory.
         * @type {*[]}
         */
        get = [ function () {

            function StorageFactory(options) {

                var $module = {},
                    ns, cookie, nsLen,
                    cookieSupport, storageSupport;

                // extend defaults with supplied options.
                options = angular.extend(defaults, options);

                // set the namespace.
                ns = options.ns + '.';

                // get the namespace length.
                nsLen = ns.length;

                storageSupport = supports();
                cookieSupport = supports(true);

                // make sure either cookies or local storage are supported.
                if (!storageSupport && !cookieSupport)
                    return new Error('Storage Factory requires localStorage browser support or cookies must be enabled.');

                /**
                 * Get list of storage keys.
                 * @memberof StorageFactory
                 * @private
                 * @returns {array}
                 */
                function storageKeys() {

                    if (!storageSupport)
                        return new Error('Keys can only be obtained when localStorage is available.');
                    var keys = [];
                    for (var key in localStorage) {
                        if(localStorage.hasOwnProperty(key)) {
                            if (key.substr(0, nsLen) === ns) {
                                try {
                                    keys.push(key.substr(nsLen));
                                } catch (e) {
                                    return e;
                                }
                            }
                        }
                    }
                    return keys;
                }

                /**
                 * Set storage value.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the key to set.
                 * @param {*} value - the value to set.
                 */
                function setStorage(key, value) {
                    if (!storageSupport)
                        return setCookie(key, value);
                    if (typeof value === undefined)
                        value = null;
                    try {
                        if (angular.isObject(value) || angular.isArray(value))
                            value = angular.toJson(value);
                        localStorage.setItem(ns + key, value);
                    } catch (e) {
                        return setCookie(key, value);
                    }
                }

                /**
                 * Get storate by key
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the storage key to lookup.
                 * @param {string} [property] - the property name to find.
                 * @returns {*}
                 */
                function getStorage(key, property) {
                    var item;
                    if(property)
                        return getProperty(key, property);
                    if (!storageSupport)
                        return getCookie(key);
                    item = localStorage.getItem(ns + key);
                    if (!item)
                        return null;
                    if (item.charAt(0) === "{" || item.charAt(0) === "[")
                        return angular.fromJson(item);
                    return item;
                }

                /**
                 * Get object property.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the storage key.
                 * @param {string} property - the property to lookup.
                 * @returns {*}
                 */
                function getProperty(key, property) {
                    var item, isObject;
                    if(!storageSupport)
                        return new Error('Cannot get by property, localStorage must be enabled.');
                    item = getStorage(key);
                    isObject = angular.isObject(item) || false;
                    if (item) {
                        if (isObject)
                            return getByProperty(item, property);
                        else
                            return item;
                    } else {
                        return new Error('Invalid operation, storage item must be an object.');
                    }
                }

                /**
                 * Delete storage item.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key
                 * @returns {boolean}
                 */
                function deleteStorage (key) {
                    if (!storageSupport)
                        return deleteCookie(key);
                    try {
                        localStorage.removeItem(ns + key);
                    } catch (e) {
                        return deleteCookie(key);
                    }
                }

                /**
                 * Clear all storage CAUTION!!
                 * @memberof StorageFactory
                 * @private
                 */
                function clearStorage () {

                    if (!storageSupport)
                        return clearCookie();

                    for (var key in localStorage) {
                        if(localStorage.hasOwnProperty(key)) {
                            if (key.substr(0, nsLen) === ns) {
                                try {
                                    deleteStorage(key.substr(nsLen));
                                } catch (e) {
                                    return clearCookie();
                                }
                            }
                        }
                    }
                }


                /**
                 * Set a cookie.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the key to set.
                 * @param {*} value - the value to set.
                 */
                function setCookie (key, value) {

                    if (typeof value === undefined) return false;

                    if (!cookieSupport)
                        return new Error('Cookies are not supported by this browser.');
                    try {
                        var expiry = '',
                            expiryDate = new Date();
                        if (value === null) {
                            cookie.expiry = -1;
                            value = '';
                        }
                        if (cookie.expiry) {
                            expiryDate.setTime(expiryDate.getTime() + (options.cookieExpiry * 24 * 60 * 60 * 1000));
                            expiry = "; expires=" + expiryDate.toGMTString();
                        }
                        if (!!key)
                            document.cookie = ns + key + "=" + encodeURIComponent(value) + expiry + "; path=" +
                                options.cookiePath;
                    } catch (e) {
                        throw e;
                    }
                }


                /**
                 * Get a cookie by key.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the key to find.
                 * @returns {*}
                 */
                function getCookie (key) {

                    if (!cookieSupport)
                        return new Error('Cookies are not supported by this browser.');
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var ck = cookies[i];
                        while (ck.charAt(0) === ' ')
                            ck = ck.substring(1, ck.length);
                        if (ck.indexOf(ns + key + '=') === 0)
                            return decodeURIComponent(ck.substring(ns.length + key.length + 1, ck.length));
                    }
                    return null;
                }

                /**
                 * Delete a cookie by key.
                 * @memberof StorageFactory
                 * @private
                 * @param key
                 */
                function deleteCookie(key) {
                    setCookie(key, null);
                }

                /**
                 * Clear all cookies CAUTION!!
                 * @memberof StorageFactory
                 * @private
                 */
                function clearCookie() {
                    var ck = null,
                        cookies = document.cookie.split(';'),
                        key;
                    for (var i = 0; i < cookies.length; i++) {
                        ck = cookies[i];
                        while (ck.charAt(0) === ' ')
                            ck = ck.substring(1, ck.length);
                        key = ck.substring(nsLen, ck.indexOf('='));
                        return deleteCookie(key);
                    }
                }

                //check for browser support
                $module.supports =  {
                    localStorage: supports(),
                    cookies: supports(true)
                };

                // storage methods.
                $module.get = getStorage;
                $module.set = setStorage;
                $module.delete = deleteStorage;
                $module.clear = clearStorage;
                $module.storage = {
                    keys: storageKeys,
                    supported: storageSupport
                };
                $module.cookie = {
                    get: getCookie,
                    set: setCookie,
                    'delete': deleteCookie,
                    clear: clearCookie,
                    supported: cookieSupport
                };

                return $module;

            }

            return StorageFactory;

        }];

        return {
            $set: set,
            $get: get
        };

    });

})(window, document);
