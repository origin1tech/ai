/**
 * NOTE this file is only used for examples
 * and documentation and is not part of
 * the Ai library.
 */

define(function (require) {

    require('step/step.js');
    require('table/table.js');
    require('widget/widget.js');
    require('flash/flash.js');
    require('modal/modal.js');
    require('validate/validate.js');
    require('viewer/viewer.js');
    require('storage/storage.js');
    require('passport/passport.js');


    var app, tmpAreas, keys, areas, controller;

    tmpAreas = {
        '/register': 'Angular application registration helper',
        '/passport': 'Simplifies handling authentication within Angular app.',
        '/storage': 'Use local storage with auto cookie fallback.',
        '/autoform': 'Handy during dev to quickly create a form.',
        '/dropdown': 'Advanced customizable dropdown directive.',
        '/flash': 'Allows for showing flash/popup messages.',
        '/modal': 'Native modal dialog.',
        '/table': 'Bind local or remote data to table/grid.',
        '/validate': 'Form validation with auto model binding.',
        '/viewer': 'Animated slide transitions for views.',
        '/widget': 'Various widgets - case, nicescroll, redactor, decimal, input mask & compare.',
        '/step': 'Creates form step wizard.'
    };

    // sort areas.
    keys = Object.keys(tmpAreas).sort();
    areas = {};

    angular.forEach(keys, function (k) {
        areas[k] = tmpAreas[k];
    });

    app = angular.module('app', ['ngRoute', 'ngAnimate', 'ai.step', 'ai.table',
        'ai.widget', 'ai.modal', 'ai.flash', 'ai.viewer', 'ai.passport', 'ai.validate']);

    app.config(['$routeProvider', '$locationProvider', '$passportProvider',
        function ($routeProvider, $locationProvider, $passportProvider) {
            $routeProvider.when('/', {templateUrl: '/home.html', controller: 'Controller', title: 'Ai'});
            angular.forEach(areas, function (v, k) {
                var config, cap;
                cap = k.replace('/', '');
                cap = cap.charAt(0).toUpperCase() + cap.slice(1);
                config = {
                    templateUrl: '/' + cap.toLowerCase() + '/example' + k + '.html',
                    controller: 'Controller', title: 'Ai ' + cap
                };
                $routeProvider.when(k, config);
            });
            $locationProvider.html5Mode(true);

        }]);

    app.run(['$rootScope', function ($rootScope) {
        $rootScope.msg = '';
        $rootScope.close = function () {
            $rootScope.msg = '';
        };
        $rootScope.showBack = function () {
            return $rootScope.title !== 'Ai';
        };
        $rootScope.$on('$routeChangeSuccess', function (event, current) {
            $rootScope.msg = '';
            $rootScope.title = current.$$route.title;
        });
    }]);

    controller = [
        '$rootScope', '$scope', '$route', '$flash', '$step', '$modal',
        function ($rootScope, $scope, $route, $flash, $step, $modal) {
            var current = $route.current,
                route = current.$$route,
                params = current.params,
                path = route.originalPath,
                area = path && path !== '/' ? path.replace('/', '') : 'home',
                msg, close;

            $scope.tabs = {
                table:      { active: 'markup' },
                step:       { active: 'markup' },
                flash:      { active: 'markup' },
                decimal:    { active: 'markup' },
                casing:     { active: 'markup' },
                compare:    { active: 'markup' },
                modal:      { active: 'markup' }
            };

            $scope.tabActive = function (key) {
                if(!angular.isString(key) || key.indexOf(':') === -1)
                    return;
                key = key.split(':');
                return $scope.tabs[key[0]].active === key[1];
            };

            $scope.showTab = function (key) {
                if(!angular.isString(key) || key.indexOf(':') === -1)
                    return;
                key = key.split(':');
                $scope.tabs[key[0]].active = key[1];
            };

            if (area === 'home') {
                $scope.items = areas;
            }

            if (area === 'table') {
                $scope.tbl = {
                    source: [
                        {name: 'Jim Thomas', email: 'jthomas@gmail.com'},
                        {name: 'Bob Blair', email: 'bblair@aol.com'},
                        {name: 'Randy Quick', email: 'randy.quick@yahoo.com'},
                        {name: 'Bob Smith', email: 'bobsmith@msn.com'},
                        {name: 'Susan Jones', email: 'susan.jones@hotmail.com'},
                        {name: 'Larry Anderson', email: 'anderson.larry@mail.com'},
                        {name: 'Harry Ellis', email: 'ellis@gmail.com'},
                        {name: 'Rory Boscoe', email: 'rory@aol.com'},
                        {name: 'Simon Green', email: 'sgreen@yahoo.com'},
                        {name: 'Quentin Rose', email: 'qrose@msn.com'},
                        {name: 'Micah Barry', email: 'barry4u@hotmail.com'},
                        {name: 'Alex Angle', email: 'alex.angle@mail.com'}
                    ],
                    orderBy: ['-name'],
                    selectable: true,
                    exportable: true,
                    display: 10,
                    hover: true,
                    goto: false
                };
            }

            if (area === 'validate') {
                $scope.phonePattern = /^(?!.*911.*\d{4})((\+?1[\/ ]?)?(?![\(\. -]?555.*)\( ?[2-9][0-9]{2} ?\) ?|(\+?1[\.\/ -])?[2-9][0-9]{2}[\.\/ -]?)(?!555.?01..)([2-9][0-9]{2})[\.\/ -]?([0-9]{4})$/;
                $scope.submitValidate = function (form, model) {
                    if (form.$invalid) return;
                    // alert feedback.
                    alert('Passed validation your data would submit here.');
                };
                $scope.validateFormConf = {
                    validators: {
                        phone: {
                            'ng-pattern': function (obj, form) {
                                // eval the value to get orig
                                // source expression used in ng-pattern.
                                var getExp = $scope.$eval(obj.value);
                                return '{{name}} does not match the pattern required.';
                            }
                        }
                    }
                };
            }

            if (area === 'widget') {
                $scope.decimal = 25;
                $scope.case = 'timothy';

            }

            if (area === 'flash') {
                var flash = $flash;
                $scope.flashMessage = 'Show Me!';
                $scope.flashType = 'info';
                $scope.flashTimeout = 0;
                $scope.showFlash = function (msg, type, to) {
                    flash.add(msg, type, to);
                };
            }

            if (area === 'step') {

                $scope.user = {
                    username: 'bob@test.com',
                    password: 'temptemp',
                    first: 'Bob',
                    last: 'Jones'
                };
                $scope.stepOptions = {
                    steps: {
                        credentials: {content: '/step/example/step-cred.html'},
                        name: {content: '/step/example/step-name.html'},
                        finish: {content: '/step/example/step-finish.html'}
                    },
                    onLoad: function ($module) {
                        $module.steps[1].enabled = false;
                    }
                };


            }

            if (area === 'modal'){
                var modalConf = {
                    title: 'Instance Modal',
                    content: 'I was shown using instance from source code.'
                };
                var modal = new $modal(modalConf);
                $scope.showModal = function () {
                    modal.show();
                };
            }
        }
    ];

    app.controller('Controller', controller);

    app.filter('areaName', function () {
        return function (val) {
            val = val.replace('/', '');
            return val.charAt(0).toUpperCase() + val.slice(1);
        };
    });

    angular.element(document).ready(function () {
        angular.bootstrap(document, ['app']);
    });

});