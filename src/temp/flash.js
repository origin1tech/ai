
var fs = angular.module('ai.module.flash', []);

fs.config([ '$httpProvider', function ($httpProvider) {

    $httpProvider.interceptors.push('FlashFact');

}]);

fs.factory('FlashFact', ['$q', '$injector', 'FlashServ',  function ($q, $injector, FlashServ) {

    return {

        responseError: function (err) {

            if(err && FlashServ.interceptErrors) {

                var message = err.data ? err.data.message || err.data : 'Unknown server exception occurred.';

               if(err.data && err.data.metadata && err.data.metadata.validations){
                   var validations = err.data.metadata.validations.ValidationError;
                   angular.forEach(validations, function (obj, key) {
                        angular.forEach(obj, function (validation) {
                            if(validation.message)
                                message += '<br/>' + validation.message;
                        });
                   });
               }

                if(message)
                    FlashServ.add(message, 'alert-danger');

            }

            return $q.reject(err);

        }

    };

}]);

fs.service('FlashServ', ['$rootScope', '$timeout', function ($rootScope, $timeout) {

    var self = this;

    this.flashes = [];

    this.interceptErrors = true;

    this.removing = false;

    this.allowMultiple = false;

    /* add a message to be flashed */
    this.add = function (message, type, fixed, title){
        var flash = {
            title: title || null,
            type: type || 'alert-info',
            message: message || '',
            focus: false,
            shown: false,
            fixed: fixed || false
        };
        if(!this.allowMultiple)
            this.flashes = [];
        this.flashes.push(flash);
        $rootScope.$broadcast('flash:add', { flash: flash, flashes: this.flashes });
    };

    /* get flash collection */
    this.get = function () {
        return this.flashes;
    };

    /* remove all flashes from collection */
    this.removeAll = function () {
        if(this.removing) return;
        this.removing = true;
        var self = this;
        if(this.flashes.length > 0) {
            angular.forEach(this.flashes, function (flash) {
	            if(flash.shown === true)
		            self.remove(flash);
	            else flash.shown = true;
            });
        }
        this.removing = false;
    };

    /* remove flash from flashes */
    this.remove = function (flash) {
	   if(flash.fixed) return false;
        if(flash && this.flashes) {
            this.flashes.splice(this.flashes.indexOf(flash), 1);
            $rootScope.$broadcast('flash:remove', { flash: flash, flashes: this.flashes});
        }
    };

    /* on route success clear flashes */
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        self.removeAll();
    });

    return this;

}]);

fs.directive('aiFlash', [ '$compile', 'FlashServ', '$timeout', '$rootScope', function ($compile, FlashServ, $timeout, $rootScope) {

    /* to use html in message include ngSanitize in your project */
    return {
        restrict: 'AE',
        //controller: 'FlashController',
        scope: true,
        link: function (scope, element, attrs, ctrl) {

            var options, defaults, init, template, sanitizeLoaded, _fs;

            _fs = FlashServ;

            defaults = {
                template: '<div class="flash alert" ng-repeat="flash in flashes" ng-mouseenter="enter(flash)" ng-mouseleave="leave(flash)" ng-class="flash.type">' +
                            '<button type="button" ng-click="remove(flash)" class="close"></button>' +
                            '<h4 ng-show="flash.title">{{flash.title}}</h4>' +
                            '<div class="alert-content" ng-bind-html="flash.message"></div>' +
                          '</div>',
                autoRemove: true,
                autoRemoveTimeout: 3750,
	            glyphicon: undefined,
                interceptErrors: true,
                animate: false,
                allowHtml: true,
                allowMultiple: false,
                onAdd: null,
                onRemove: null
            };

            /* merge the options */
            options = attrs.aiFlash ? angular.extend(defaults, scope.$eval(attrs.aiFlash)) : defaults;

            sanitizeLoaded = function () {
                try {
                    angular.module("ngSanitize");
                } catch(err) {
                    throw new Error('ngSanitize is required by ai-flash when "allowHtml" is set to true. Please include ngSanitize in your app modules.');
                }
            };

            init = function () {

                if(options.allowHtml) sanitizeLoaded();

                /* set interceptor */
                _fs.interceptErrors = options.interceptErrors;

                /* set allow multiple */
                _fs.allowMultiple = options.allowMultiple;

                /* collection of flashes */
                scope.flashes = _fs.flashes;

                /* function to remove */
                scope.remove = _fs.remove;

                function autoRemove(fs) {
	                if(fs.fixed) return;
                    clearTimeout(fs.timeoutId);
                    fs.timeoutId = $timeout(function () {

                        if(fs.focus) {
                            clearTimeout(fs.timeoutId);
                            autoRemove(fs);
                        } else {
                            clearTimeout(fs.timeoutId);
                            _fs.remove(fs);
                        }

                    }, options.autoRemoveTimeout);
                }

                /* listen for flash being added to collection */
                scope.$on('flash:add', function (e, obj) {

                    /* update the collection */
                    scope.flashes = obj.flashes;

                    /* if auto remove start timeout */
                    if(options.autoRemove){
	                    autoRemove(obj.flash);
                    }

                    /* callback if on add exists */
                    if(options.onAdd)
                        options.onAdd(e, obj.flash, obj.flashes);

                });

                /* listen for flash being removed */
                scope.$on('flash:remove', function (e, obj) {
                    if(options.onRemove)
                        options.onRemove(e, obj.flash, obj.flashes);

                });

                scope.enter = function (flash) {
                    flash.focus = true;
                };

                scope.leave = function (flash) {
                    flash.focus = false;
                };

                template = angular.element(options.template);

                var closeBtn = template.find('button');

                if(options.glyphicon)
                    closeBtn.html('<i class="fa glyphicon ' + options.glyphicon + '"></i>');
                else
                    closeBtn.html('&times;');

                element.html($compile(template)(scope));

            };


            init();
        }
    };

}]);