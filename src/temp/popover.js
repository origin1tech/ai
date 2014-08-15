var popover = angular.module('ai.module.popover', []);

popover.factory('PopoverFact', [ '$rootScope', '$http', '$q', '$compile', '$controller', '$templateCache', '$timeout', '$document', '$animate', '$window',
    function($rootScope, $http, $q, $compile, $controller, $templateCache, $timeout, $document, $animate, $window) {
    
    var isHtml, find, isPath, htmlReady, _cache;

    _cache = $templateCache;

    isHtml = function isHtml(str) {
        return /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(str);
    };

    isPath = function isPath(str) {
        var ext = str.split('.').pop();
        return ext === 'html';
    };

    htmlReady = function htmlReady() {
        try {
            angular.module('ngSanitize');
            return true;
        } catch (ex) {
            return false;
        }
    };

    find = function find(q, element) {
        return angular.element(element.querySelectorAll(q));
    };

    var defaultTemplate = '<div class="popover">' +
        '<div class="arrow"></div>' +
        '<h3 class="popover-title" ng-show="title" ng-bind="title"></h3>' +
        '<div class="popover-content" ng-bind="content"></div>' +
        '</div>';

        _cache.put('ai-popover.html', defaultTemplate);
  
    function Popover(options) {

        var self, scope, init, getTemplate, getContent, loadTemplate,
            showComplete, finish, body, ctrl, show, close, closeComplete,
            destroy, opts, normalizeAnimation, _requestAnimationFrame, isDefault,
            _cancelAnimationFrame, lastAnimation, popover, bindMethods, bindScope,
            resetVisibility, visibility, closing, position, size;

        self = this;

        this.options = {

            template: 'ai-popover.html',
            animation: true,
            html: false,
            placement: 'top',
            title: 'Popover',
            content: null,
            container: 'body',
            onClose: null,
            onShow: null,
            onDestroy: null,
            onBind: null,

            controller: angular.noop,             // angular controller.
            controllerAs: null,                   // define controller as.
            scope: null,                          // pass existing scope.
            locals: {}

        };

        _requestAnimationFrame =
            $window.requestAnimationFrame ||
                $window.webkitRequestAnimationFrame ||
                $window.mozRequestAnimationFrame ||
                function (callback) {
                    $window.setTimeout(callback, 1000 / 60);
                };

        _cancelAnimationFrame =
            $window.cancelAnimationFrame || $window.mozCancelAnimationFrame;

        /* gets the html content for the modal */
        getTemplate = function getTemplate() {

            if (!opts.template) throw new Error('ai-popover requires a template but was not specified.');

            /* var to note using default built in template */
            isDefault = opts.template === 'ai-popover.html';

            return loadTemplate(opts.template);

        };

        /* resolves the content if exists */
        getContent = function getContent() {

            /* add some default html in case no content was provided */
            opts.content = opts.content || '';

            return loadTemplate(opts.content);

        };

        loadTemplate = function loadTemplate(template) {

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


        };

        normalizeAnimation = function normalizeAnimation() {

            var ani,
                tmp;

            ani = { in: null, out: null };

            if (angular.isObject(opts.animation)) {
                ani = opts.animation;
            } else if (angular.isString(opts.animation)) {
                tmp = opts.animation.replace(/\s+/g, ',').split(',');
                if (tmp.length === 2)
                    ani = { in: tmp[0], out: tmp[1] };
            } else {
                if (opts.animation === true)
                    ani = { in: 'fadeIn', out: 'fadeOut' };
            }
            opts.animation = ani;

        };

        show = function show(options) {

            if (options) opts = angular.extend(self.options, options);

            scope.visibility = 1;

            position();

            if (opts.animation.in) {
                if (lastAnimation) _cancelAnimationFrame(lastAnimation);
                lastAnimation = _requestAnimationFrame(function () {
                    if (opts.animation.in)
                        $animate.setClass(popover, opts.animation.in, opts.animation.out, function () {
                            showComplete();
                        });
                    else
                        showComplete();
                });
            } else {
                showComplete();
            }

        };

        /* modal has been shown */
        showComplete = function showComplete() {
            if (opts.onShow && angular.isFunction(opts.onShow))
                opts.onShow(self);
        };

        /* close the modal */
        close = function close($event, callback, suppress) {

            /* if click event make sure only the background closes the modal */
            if (closing) return;
            closing = true;

            if (opts.animation.out) {

                if (opts.animation.out)
                    $animate.setClass(popover, opts.animation.out, opts.animation.in, function () {
                        closeComplete(callback);
                    });
                else
                    closeComplete(callback);

            } else {
                scope.visibility = 0;
                closing = false;
                closeComplete(callback);
            }

        };

        /* modal close complete function */
        closeComplete = function closeComplete(callback) {

            if (!callback) {
                if (opts.onClose && angular.isFunction(opts.onClose))
                    opts.onClose(self);

            } else {
                callback();
            }

        };

        destroy = function destroy() {

            if (lastAnimation) _cancelAnimationFrame(lastAnimation);

            popover.remove();

            self = null;

            if (opts.onDestroy && angular.isFunction(opts.onDestroy))
                opts.onDestroy(self, scope);

            scope.$destroy();

        };

        /* returns the visibility state of the modal */
        visibility = function visibility() {
            return scope.visibility;
        };

        /*  resets the visibility of the modal after animation has completed. */
        resetVisibility = function resetVisibility() {
            if (closing) {
                $timeout(function () {
                    scope.visibility = 0;
                    closing = false;
                    if (lastAnimation) _cancelAnimationFrame(lastAnimation);
                });
            }
        };

        bindScope = function bindScope() {

            var locals = opts.locals;
            locals.visibility = 0;

            locals.title = opts.title;

            /* iterate the locals */
            if (locals) {
                for (var prop in locals) {
                    if (locals.hasOwnProperty(prop))
                        scope[prop] = locals[prop];
                }
            }

        };


        /* attach helper methods */
        bindMethods = function bindMethods() {

            self.show = show;
            self.close = close;
            self.destroy = destroy;
            self.visibility = visibility;

        };

        position = function position() {

            var elem = opts.relativeTo,
                elemPos = elem.offset(),
                elemH = elem.outerHeight(),
                elemW = elem.outerWidth(),
                offset = { top: 0, left: 0 },
                top, left;

            if(opts.placement === 'top') {
                offset.top = elemPos.top - (size.h + elemH);
                offset.left = (elemPos.left + elemW) - (size.w /2 + elemW / 2);
            }

            if(opts.placement === 'right') {
                offset.top = elemPos.top - (size.h / 2);
                offset.left = (elemPos.left + elemW);
            }

            if(opts.placement === 'bottom') {
                offset.top = elemPos.top + elemH;
                offset.left = (elemPos.left + elemW) - (size.w /2 + elemW / 2);
            }

            if(opts.placement === 'left') {
                offset.top = elemPos.top - (size.h / 2);
                offset.left = elemPos.left - size.w;
            }

            popover.css(offset);

        };

        init = function init () {

            /* normalize animation to object */
            normalizeAnimation();

            scope = (opts.scope && opts.scope.$new()) || $rootScope.$new();
            scope.visibility = 0;
            ctrl = $controller(opts.controller, { $scope: scope });

            /* check for controller as */
            if (opts.controllerAs)
                scope[opts.controllerAs] = ctrl;

            /* attach locals to scope */
            finish();

        };

        finish = function finish() {

            /* bind locals and helper methods */
            bindScope();
            bindMethods();

            var html = getTemplate(),
                container = find(opts.container, document), //angular.element(opts.container),
                contentHtml = getContent();

            contentHtml.then(function (content) {

                html.then(function (template) {

                    if (opts.html) {
                        if (!htmlReady())
                            console.log('Popover could not enable ng-bind-html. ngSanitize is not loaded.');
                        else
                            template = template.replace(/ng-bind/g, 'ng-bind-html');
                    }

                    /* create the dialog element */
                    popover = angular.element(template);
                    popover.addClass(opts.placement);
                    popover.css('display', 'block');

                    var bindType = opts.html && htmlReady() ? 'ng-bind-html' : 'ng-bind',
                        bindAttr = '[' + bindType + '="content"]',
                        contentDiv = find(bindAttr, popover[0]).removeAttr(bindType);

                    /* check for content */
                    if (content) {
                        if (isHtml(content)) {
                            content = angular.element(content); //.removeAttr('id').removeAttr('style');
                            contentDiv.append(content);
                        } else {
                            contentDiv.text(content);
                        }
                    }

                    /* add the dialog template to the backdrop */
                    popover.attr('ng-show', 'visibility == 1');

                    /* prepend to our container */
                    container.prepend(popover);

                    size = { h: popover.outerHeight(), w: popover.outerWidth() };

                    /* compile the modal element */
                    $compile(popover)(scope);

                    window.onresize = function(event) {
                        position();
                    };

                    /* listen for destroy */
                    scope.$on('destroy', function () {
                        destroy();
                    });

                    /* add animation after visibility is bound */
                    $timeout(function () {

                        if (opts.animation.in)
                            popover.addClass('animated');

                        /* add animation listener when complete reset visibility */
                        //dialog.bind('animationend webkitAnimationEnd oAnimationEnd', event, resetVisibility);
                        popover.bind('animationend webkitAnimationEnd oAnimationEnd', resetVisibility);

                        /* if on bind callback return instance */
                        if (opts.onBind && angular.isFunction(opts.onBind))
                            opts.onBind(self);


                    });

                });

            });


        };

        /* merge options */
        opts = angular.extend(this.options, options);

        init();
    }
    
    return Popover;
    
}]);


popover.directive('aiPopover', ['$rootScope','PopoverFact',  function ($rootScope, PopoverFact) {

    var Popover = PopoverFact;

    return {
        restrict: 'AE',
        scope: {
            options: '&aiPopover'
        },
        link: function (scope, element, attrs) {

            var popover, defaults, init, bindEvents, dataOptions;

            defaults = {

                relativeTo: null,
                template: 'ai-popover.html',
                animation: true,
                html: false,
                placement: 'top',
                trigger: 'click',
                title: 'Popover',
                content: null,
                container: 'body',
                locals: {},

                onClose: null,
                onShow: null,
                onDestroy: null,
                onBind: null


            };

            dataOptions = {};

            bindEvents = function bindEvents() {

                element.unbind(scope.options.trigger);

                /* add trigger event */
                element.on(scope.options.trigger, function () {
                    scope.$apply(function () {
                        var visibility = popover.visibility();
                        if(visibility === 0)
                            popover.show();
                        if(visibility === 1)
                            popover.close();
                    });
                });

            };

            init = function init() {

                scope.options.relativeTo = element;

                if (!popover)
                    popover = new Popover(scope.options);

                /* unbind/bind jqlite events */
                bindEvents();

                scope.$on('destroy', function () {
                    popover.destroy();
                });

            };

            scope.$watch(attrs.aiPopover, function (newVal, oldVal) {

                if (newVal === oldVal) return;

                if (angular.isObject(newVal)) {

                    angular.extend(scope.options, scope.$eval(newVal));

                    if (popover) {
                        popover.destroy();
                        popover = null;
                        init();
                    } else {
                        init();
                    }
                }

            }, true);

            $rootScope.$on('$routeChangeStart', function (event, next, current) {
                if(popover.visibility() === 1)
                    popover.close();
            });

            /* get data dash attributes model will override these */
            angular.forEach(defaults, function (v, k) {

                if (attrs[k]) {

                    var val = attrs[k],
                        isBool = /^(true|false)$/i.test(val) || false,
                        isInt = parseInt(val) || undefined;

                    /* convert bools/ints */
                    if (isBool) val = JSON.parse(val);
                    else if (isInt) val = isInt;
                    dataOptions[k] = val;
                }

            });

            scope.options = angular.extend(defaults, dataOptions, scope.$eval(scope.options));

            init();

        }


    }


}]);
