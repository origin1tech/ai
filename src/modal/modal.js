angular.module('ai.modal', [])

.provider('$modal', function $modal() {

    var defaults = {

            title: 'Dialog',                      // the default template's title.
            template: 'ai-modal.html',            // a custom template string.
            content: null,                        // the default template's text or html body.
            locals: {},                           // locals that are passed to scope.

            show: false,                          // show the modal on init.
            container: 'body',                    // the html container to attach the modal to.
            animation: false,                     // true, comma separated string, false or object { in: 'fadeIn', out: 'fadeOut' } (default: true which is equal to > 'fadeInDownBig,fadeOutUpBig')
            backdropAnimation: true,              // true, comma separated string, false or object { in: 'fadeIn', out: 'fadeOut' } (default: true which is equal to > 'fadeIn,fadeOut')
            backdrop: true,                       // when true on backdrop click modal is closed static to disable backdrop click event.
            backdropCss: 'rgba(51,51,51,0.7)',    // adds 'background:' css style, can use url, rgba, solid color.
            keyboard: true,                       // when true esc closed modal if backdrop is not equal to 'static'
            header: true,                         // whether to show the default template's header.
            footer: true,                         // whether to show the default template's footer.

            /* default template options */
            closeIcon: '&times;',                 // the text/html to use for the default template's close icon. can pass font awesome or glyphicon if desired.
            closeText: 'Close',                   // the text to use for the default template's close button.
            okText: 'Ok',                         // the text to use for the default template's ok button.
            closeClass: 'btn btn-default',        // the class to use for the default template's close button.
            okClass: 'btn btn-primary',           // the class to use for the default template's ok button.
            closeIconClass: 'close',              // the class to add to the close icon.

            /* scope and controller */
            controller: angular.noop,             // angular controller.
            controllerAs: null,                   // define controller as.
            scope: null,                          // pass existing scope.

            /* events */
            onCloseDestroy: false,                // when true the modal will be destroyed on close. Good when modal is initialized and shown from click event.
            onClose: null,                        // callback on close.
            onShow: null,                         // callback on show.
            onOk: null,                           // callback on ok.
            onDestroy: null,                      // callback on scope destroy.
            onBind: null                          // callback when modal is bound.

        }, get, set;

    set = function set(value) {
        angular.extend(defaults, value);
    };

    get = ['$rootScope', '$http', '$q', '$compile', '$controller', '$templateCache', '$timeout', '$document',
           '$animate', '$window', '$injector',
        function ($rootScope, $http, $q, $compile, $controller, $templateCache, $timeout, $document, $animate,
                  $window, $injector) {


            var defaultTemplate,
                _cache = $templateCache,
                instances = [],
                sce;

            sce = $injector.get('$sce');

            function isHtml(str) {
                return /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(str);
            }

            function isPath(str) {
                var ext = str.split('.').pop();
                return ext === 'html';
            }

            function htmlReady() {
                if(!sce) return false;
                try {
                    angular.module('ngSanitize');
                    return true;
                } catch (ex) {
                    return false;
                }
            }

            function find(q, element) {
                return angular.element(element.querySelectorAll(q));
            }

            defaultTemplate =
                '<div class="modal">' +
                '<div class="modal-dialog" >' +
                '<div class="modal-content">' +
                '<div class="modal-header" ng-show="header">' +
                '<button type="button" ng-class="closeIconClass" aria-hidden="true" ng-click="close()" ng-bind="closeIcon"></button>' +
                '<h4 ng-show="title"class="modal-title" ng-bind="title"></h4>' +
                '</div>' +
                '<div class="modal-body" ng-bind="content"></div>' +
                '<div class="modal-footer" ng-show="footer">' +
                '<button type="button" ng-class="closeClass" ng-click="close()" ng-bind="closeText"></button>' +
                '<button type="button" ng-class="okClass" ng-click="ok()" ng-bind="okText"></button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';

            _cache.put('ai-modal.html', defaultTemplate);

            $rootScope.$on('$routeChangeStart', function (event, next, current) {
                angular.forEach(instances, function (instance) {
                    if(instance.visibility() === 1)
                        instance.close();
                });
            });

            function ModuleFactory(options) {

                var self, ctrl, isDefault, closing,
                    scope, element, opts,
                    body, backdrop, initializing, dialog,
                    _requestAnimationFrame, _cancelAnimationFrame,
                    lastAnimation;

                    self = this;

                initializing = false;

                _requestAnimationFrame =
                    $window.requestAnimationFrame ||
                    $window.webkitRequestAnimationFrame ||
                    $window.mozRequestAnimationFrame ||
                    function (callback) {
                        $window.setTimeout(callback, 1000 / 60);
                    };

                _cancelAnimationFrame =
                    $window.cancelAnimationFrame || $window.mozCancelAnimationFrame;

                // gets the html content for the modal */
                function getTemplate() {

                    if (!opts.template) throw new Error('ai-modal requires a template but was not specified.');

                    /* var to note using default built in template */
                    isDefault = opts.template === 'ai-modal.html';

                    return loadTemplate(opts.template);
                }

                // resolves the content if exists
                function getContent() {

                    /* add some default html in case no content was provided */
                    opts.content = opts.content || '';

                    return loadTemplate(opts.content);

                }

                function loadTemplate(template) {

                    var isElement;

                    isElement = document.getElementById(template) || undefined;

                    if (isHtml(template) || !isPath(template)) {

                        var markup = template;

                        if (isElement) {

                            /* make sure we hide the in page element */
                            isElement = angular.element(isElement).css('display', 'none');

                            /* local element in page used as template store in cache */
                            markup = _cache.get(template) || angular.element('<div></div>')
                                .append(isElement).html();
                            _cache.put(template, markup);
                        }

                        /* if html is present return promise */
                        var defer = $q.defer();
                        defer.resolve(markup);
                        return defer.promise;

                    } else {

                        /* html was not loaded use $http.get to load */
                        return $q.when(_cache.get(template) || $http.get(template))
                            .then(function (res) {
                                if (res.data) {
                                    _cache.put(template, res.data);
                                    return res.data;
                                }
                                return res;
                            });

                    }
                }

                function normalizeAnimation() {

                    var ani,
                        backAni,
                        tmp;

                    ani = { in: null, out: null };
                    backAni = { in: null, out: null };

                    if (angular.isObject(opts.animation)) {
                        ani = opts.animation;
                    } else if (angular.isString(opts.animation)) {
                        tmp = opts.animation.replace(/\s+/g, ',').split(',');
                        if (tmp.length === 2)
                            ani = { in: tmp[0], out: tmp[1] };
                    } else {
                        if (opts.animation === true)
                            ani = { in: 'fadeInDownBig', out: 'fadeOutUpBig' };
                    }
                    opts.animation = ani;

                    if (angular.isObject(opts.backdropAnimation)) {
                        backAni = opts.backdropAnimation;
                    } else if (angular.isString(opts.backdropAnimation)) {
                        tmp = opts.backdropAnimation.replace(/\s+/g, ',').split(',');
                        if (tmp.length === 2)
                            backAni = { in: tmp[0], out: tmp[1] };
                    } else {
                        if (opts.backdropAnimation === true)
                            backAni = { in: 'fadeIn', out: 'fadeOut' };
                    }
                    opts.backdropAnimation = backAni;

                }

                // returns the visibility state of the modal
               function visibility() {
                    return scope.visibility;
                }

                // show the modal
                function show() {

                    /* prevents flicker on reinit */
                    var check = setInterval(function () {

                        if (!initializing) {
                            clearInterval(check);
                            scope.$apply(function () {
                                ready();
                            });
                        }

                    }, 10);

                    function ready() {

                        scope.visibility = 1;

                        if (opts.animation.in) {

                            if (lastAnimation)
                                _cancelAnimationFrame(lastAnimation);

                            lastAnimation = _requestAnimationFrame(function () {

                                if (opts.backdropAnimation.in)
                                //backdrop.addClass(opts.backdropAnimation.in);
                                    $animate.setClass(backdrop, opts.backdropAnimation.in, opts.backdropAnimation.out, function () {

                                    });

                                if (opts.animation.in)
                                    $animate.setClass(dialog, opts.animation.in, opts.animation.out, function () {
                                        showComplete();
                                    });

                            });

                        } else {
                            showComplete();
                        }
                    }

                }

                // modal has been shown
                function showComplete() {
                    if (opts.onShow && angular.isFunction(opts.onShow))
                        opts.onShow(self);
                }

                // close the modal
                function close($event, callback, preventAnimation) {

                    // if click event make sure only the background closes the modal
                    if ($event) {
                        if (opts.backdrop === 'static') return;
                        var target = angular.element($event.target);
                        if (!target.parent().hasClass('ai-modal-background') && !target.hasClass('ai-modal-background')) return;
                    }

                    if (closing) return;
                    closing = true;

                    if (opts.animation.out && !preventAnimation) {

                        if (opts.backdropAnimation.out)
                            $animate.setClass(backdrop, opts.backdropAnimation.out, opts.backdropAnimation.in, function () {
                            });
                        if (opts.animation.out)
                            $animate.setClass(dialog, opts.animation.out, opts.animation.in, function () {
                                closeComplete(callback);
                            });
                        else
                            closeComplete(callback);

                    } else {
                        scope.visibility = 0;
                        closing = false;
                        if (opts.onCloseDestroy)
                            self.destroy();
                        closeComplete(callback);
                    }

                }

                // modal close complete function
                function closeComplete(callback) {

                    if (!callback) {
                        if (opts.onClose && angular.isFunction(opts.onClose))
                            opts.onClose(self);
                    } else {
                        callback();

                    }

                }

                // calls close then triggers ok callback if not null
                function ok(callback) {

                    close(null, function () {
                        if (angular.isFunction(opts.onOk))
                            opts.onOk(self);
                    });

                }

                // calls close when keyup is triggered usually esc key
                function onKey() {

                    if (opts.backdrop === 'static' || !opts.keyboard) return;
                    $document.bind('keyup', function (e) {
                        var code = e.which || e.keyCode;
                        if (code === 27) {
                            scope.$apply(function () {
                                close();
                            });
                        }
                    });

                }

                // destroys the modal
                function destroy() {

                    if (lastAnimation) _cancelAnimationFrame(lastAnimation);

                    element.remove();
                    var idx = instances.indexOf(self);

                    if (idx !== -1)
                        instances.splice(idx, 1);

                    if (opts.onDestroy && angular.isFunction(opts.onDestroy))
                        opts.onDestroy(self, scope);

                    scope.$destroy();

                }

                function setOptions(key, value, reinit) {

                    var obj = {},
                        finishShow;
                    if (angular.isObject(key)) {
                        obj = key;
                        if (value && typeof (value) === 'boolean') {
                            reinit = value;
                        }
                    } else if (key && value) {
                        obj[key] = value;
                    }

                    if(scope.isHtml && obj.content) {
                        var contentDiv = find('.ai-modal-content', dialog[0]);
                        if(contentDiv)
                            contentDiv.html(obj.content);
                    }

                    // extend options
                    opts = angular.extend(opts, obj);

                    // rebind the scope
                    bindScope();

                    // check for show after update
                    finishShow = opts.show || false;

                    // we need to reinit to change many config options. if you don't want to reinit
                    // you can pass true for "suppressInit" to change the options only. Only some
                    // options can be set without reinit.
                    if (reinit) {
                        element.remove();
                        init(finishShow);
                    } else {
                        compile();
                        if(finishShow)
                            self.show();
                    }

                }

                // resets the visibility of the modal after animation has completed.
                function resetVisibility() {
                    if (closing) {
                        $timeout(function () {
                            scope.visibility = 0;
                            closing = false;
                            if (lastAnimation) _cancelAnimationFrame(lastAnimation);
                            if (opts.onCloseDestroy)
                                self.destroy();
                        });
                    }
                }

                function compile() {
                    $compile(element)(scope);
                }

                function bindScope() {

                    var locals = opts.locals;
                    locals.visibility = 0;

                    locals.title = opts.title;
                    locals.header = opts.header;
                    locals.footer = opts.footer;

                    locals.ok = ok;
                    locals.close = close;

                    locals.okText = opts.okText;
                    locals.okClass = opts.okClass;
                    locals.closeText = opts.closeText;
                    locals.closeIcon = opts.closeIcon;
                    locals.closeClass = opts.closeClass;
                    locals.closeIconClass = opts.closeIconClass;
                    locals.content = opts.content;

                    /* iterate the locals */
                    if (locals) {
                        for (var prop in locals) {
                            if (locals.hasOwnProperty(prop))
                                scope[prop] = locals[prop];
                        }
                    }

                }

                // attach methods.
                function bindMethods() {

                    self.show = show;
                    self.close = close;
                    self.ok = ok;
                    self.destroy = destroy;
                    self.visibility = visibility;
                    self.setOptions = setOptions;
                    self.compile = compile;
                    self.scope = scope;

                }

                // initializes the modal
                function init(finishShow) {

                    initializing = true;

                    /* normalize animation to object */
                    normalizeAnimation();

                    var backdropTemplate = '<div class="ai-modal-background" ng-cloak></div>',
                        backdropCss = {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            'z-index': 1040,
                            overflow: 'hidden'
                        };

                    if (opts.backdrop !== 'static')
                        backdropTemplate = '<div class="ai-modal-background" ng-click="close($event)"></div>';

                    body = find('body', document);

                    /* create the backdrop template */
                    backdrop = angular.element(backdropTemplate);
                    if (opts.backdropCss && opts.backdropCss !== false)
                        backdropCss.background = opts.backdropCss;
                    backdrop.css(backdropCss);

                    scope = (opts.scope && opts.scope.$new()) || $rootScope.$new();
                    scope.options = opts;
                    scope.visibility = 0;
                    ctrl = $controller(opts.controller, { $scope: scope });

                    /* check for controller as */
                    if (opts.controllerAs)
                        scope[opts.controllerAs] = ctrl;

                    /* attach locals to scope */
                    finish(finishShow);

                }

                function finish(finishShow) {

                    // bind locals and helper methods
                    bindScope();
                    bindMethods();

                    var html = getTemplate(),
                        container = find(opts.container, document),
                        contentHtml = getContent();

                    contentHtml.then(function (content) {

                        scope.content = content;

                        html.then(function (template) {

                            if (!htmlReady()){
                                console.log('Modal could not enable ng-bind-html. ngSanitize is not loaded.');
                            } else {
                                template = template.replace(/ng-bind/g, 'ng-bind-html');
                            }

                            // create the dialog element
                            dialog = angular.element(template);

                            var bindType = htmlReady() ? 'ng-bind-html' : 'ng-bind',
                                bindAttr = '[' + bindType + '="content"]',
                                contentDiv = find(bindAttr, dialog[0]).addClass('ai-modal-content');

                            // check for content
                            if (content) {
                                if (htmlReady()) {
                                    contentDiv.removeAttr(bindType).html(content);
                                    scope.isHtml = true;
                                } else {
                                    contentDiv.text(content);
                                }
                            }

                            /* handle bootstrap modal templates */
                            if (dialog.hasClass('modal'))
                                dialog.css({ display: 'block', overflow: 'hidden' });

                            if (opts.animation.in || opts.animation.out) {

                                if (opts.animation.in)
                                    dialog.addClass('animated');

                                if (opts.backdropAnimation.in)
                                    backdrop.addClass('animated');

                                /* add animation listener when complete reset visibility */
                                dialog.bind('animationend webkitAnimationEnd oAnimationEnd', resetVisibility);

                            }

                            /* add the dialog template to the backdrop */
                            element = backdrop.append(dialog);
                            element.attr('ng-show', 'visibility == 1');

                            /* check on key close */
                            onKey();

                            /* compile the modal element */
                            $compile(element)(scope);

                            /* prepend to our container */
                            container.prepend(element);

                            /* add to instances */
                            instances.push(self);

                            /* listen for destroy */
                            scope.$on('destroy', function () {
                                destroy();
                            });

                            /* if on bind callback return instance */
                            if (opts.onBind && angular.isFunction(opts.onBind))
                                opts.onBind(self);

                            initializing = false;

                            if (finishShow)
                                self.show();

                        });

                    });

                }

                // merge options

                opts = angular.extend(defaults, options);

                // initialize modal.
                init(opts.show);

            }

            return ModuleFactory;

    }];

    return {
        $get: get,
        $set: set
    };

})


.directive('aiModal', ['$modal', function ($modal) {

    return {
        restrict: 'AE',
        link: function (scope, element, attrs) {

            var $module, options;

            options = { };

           function bindEvents() {

                element.unbind('click');

                // add click event
                element.on('click', function () {
                    scope.$apply(function () {
                        $module.show();
                    });
                });

            }

            function init() {

                var tmpOpt = attrs.aiModal || attrs.options;
                scope.options = options = scope.$eval(tmpOpt);

                if (!$module)
                    $module = new $modal(scope.options);

                // check if additional css styles
                if (scope.options.cssClass)
                    element.addClass(scope.options.cssClass);

                // unbind/bind jqlite events
                bindEvents();

            }

            scope.$watch(attrs.aiModal, function (newVal, oldVal) {

                if (newVal === oldVal) return;

                if (angular.isObject(newVal)) {

                    angular.extend(scope.options, scope.$eval(newVal));

                    if ($module) {
                        $module.destroy();
                        $module = null;
                        init();
                    } else {
                        init();
                    }
                }

            }, true);

            scope.$on('destroy', function () {
                $module.destroy();
            });

            // get data dash attributes model will override these
            //angular.forEach(defaults, function (v, k) {
            //
            //    if (attrs[k]) {
            //
            //        var val = attrs[k],
            //            isBool = /^(true|false)$/i.test(val) || false,
            //            isInt = parseInt(val) || undefined;
            //
            //        // convert bools/ints
            //        if (isBool) val = JSON.parse(val);
            //        else if (isInt) val = isInt;
            //        dataOptions[k] = val;
            //    }
            //
            //});

            init();

        }


    };

}]);
