require([
    'helpers',
    'step/step',
    'table/table',
    'widget/widget',
    'flash/flash',
    'modal/modal',
    'validate/validate',
    'storage/storage',
    'passport/passport',
    'dropdown/dropdown',
    'autoform/autoform',
    'loader/loader',
    'tree/tree'
], function () {

    var app, tmpAreas, keys, areas, controller;

    tmpAreas = {
        //'/passport': 'Simplifies handling authentication within Angular app.',
        '/storage': 'Use local storage with auto cookie fallback.',
        '/autoform': 'Handy during dev to quickly create a form.',
        '/dropdown': 'Advanced customizable dropdown directive.',
        '/flash': 'Allows for showing flash/popup messages.',
        //'/modal': 'Native modal dialog.',
        '/table': 'Bind local or remote data to table/grid.',
        '/validate': 'Form validation with auto model binding.',
        '/widget': 'Various widgets - casing, number, compare, placeholder',
        '/step': 'Creates form step wizard.',
        '/loader': 'Shows loading message/spinner on ajax calls.',
        '/tree': 'Treeview element.'
    };

    // sort areas.
    keys = Object.keys(tmpAreas).sort();
    areas = {};

    angular.forEach(keys, function (k) {
        areas[k] = tmpAreas[k];
    });

    app = angular.module('app', ['ngRoute', 'ngAnimate', 'ai.step', 'ai.table',
        'ai.storage', 'ai.dropdown', 'ai.widget', 'ai.modal', 'ai.flash',
        'ai.passport', 'ai.validate', 'ai.autoform', 'ai.loader', 'ai.tree']);

    app.config(['$routeProvider', '$locationProvider', '$passportProvider', '$loaderProvider',
        function ($routeProvider, $locationProvider, $passportProvider, $loaderProvider) {
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
            $loaderProvider.$set('onLoading', function (loader, instances) {
                return true;
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
        '$rootScope', '$scope', '$route', '$flash', '$step', '$modal', '$storage', '$location', '$http', '$loader',
        function ($rootScope, $scope, $route, $flash, $step, $modal, $storage, $location, $http, $loader) {
            var current = $route.current,
                route = current.$$route,
                params = current.params,
                path = route.originalPath,
                area = path && path !== '/' ? path.replace('/', '') : 'home';

            $scope.tabs = {
                table:      { active: 'markup' },
                step:       { active: 'markup' },
                flash:      { active: 'markup' },
                decimal:    { active: 'markup' },
                casing:     { active: 'markup' },
                compare:    { active: 'markup' },
                modal:      { active: 'markup' },
                storage:    { active: 'markup' },
                dropdown:   { active: 'markup' },
                autoform:   { active: 'markup' },
                placeholder:{ active: 'markup' },
                tab:        { active: 'markup' },
                loader:     { active: 'markup' },
                tree:       { active: 'markup' }
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
                var tblSrc = [
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
                ];

                $scope.tbl = {
                    source: angular.copy(tblSrc),
                    orderBy: ['-name'],
                    selectable: true,
                    exportable: true,
                    display: 10,
                    hover: true,
                    goto: false
                };

                $scope.tblAdv = {
                    orderBy: ['-name'],
                    selectable: true,
                    exportable: true,
                    display: 10,
                    hover: true,
                    goto: false,
                    onBind: function (scope) {
                        scope.options.source = tblSrc;
                        scope.init();
                    }
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
                    onLoad: function (form, ctrl) {
                    },
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
                    onBeforeChange: function (steps, e) {
                        return true;
                    },
                    onReady: function ($module) {
                        //$module.steps[1].enabled = false;
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

            if (area === 'storage'){
                var storage = $storage();
                storage.set('storage', '');
                $scope.setStorage = function (v) {
                    storage.set('storage', v);
                };
                $scope.getStorage = function () {
                    $scope.viewStorage = storage.get('storage');
                };
            }

            if (area === 'dropdown'){

                // basic dropdown example.
                $scope.ddSimple = {
                    text: 'name',
                    value: 'email',
                    inline: true,
                    source: [
                        {name: 'Jim Evers', email: 'jim@global.net', category: 'customer' },
                        {name: 'Charles Xander', email: 'charles@gmail.com', category: 'customer'},
                        {name: 'Scott Sandres', email: 'sanders.scott@aol.com', category: 'customer'},
                        {name: 'Rob Reiner', email: 'rr@dc.rr.com', category: 'customer'},
                        {name: 'Jim Thomas', email: 'jthomas@gmail.com', category: 'customer'},
                        {name: 'Bob Blair', email: 'bblair@aol.com', category: 'employee'},
                        {name: 'Randy Quick', email: 'randy.quick@yahoo.com', category: 'employee'},
                        {name: 'Bob Smith', email: 'bobsmith@msn.com', category: 'employee'},
                        {name: 'Susan Jones', email: 'susan.jones@hotmail.com', category: 'employee'},
                        {name: 'Larry Anderson', email: 'anderson.larry@mail.com', category: 'employee'},
                        {name: 'Harry Ellis', email: 'ellis@gmail.com', category: 'employee'},
                        {name: 'Rory Boscoe', email: 'rory@aol.com', category: 'vendor'},
                        {name: 'Simon Green', email: 'sgreen@yahoo.com', category: 'vendor'},
                        {name: 'Quentin Rose', email: 'qrose@msn.com', category: 'vendor'},
                        {name: 'Micah Barry', email: 'barry4u@hotmail.com', category: 'vendor'},
                        {name: 'Alex Angle', email: 'alex.angle@mail.com', category: 'vendor'}
                    ]
                };
                $scope.ddSimpleSel = 'charles@gmail.com';

                // advanced example using grouping.
                $scope.ddAdv = {
                    text: 'name',
                    value: 'email',
                    groupKey: 'category',
                    source: [
                        {name: 'Jim Evers', email: 'jim@global.net', category: 'customer' },
                        {name: 'Charles Xander', email: 'charles@gmail.com', category: 'customer'},
                        {name: 'Scott Sandres', email: 'sanders.scott@aol.com', category: 'customer'},
                        {name: 'Rob Reiner', email: 'rr@dc.rr.com', category: 'customer'},
                        {name: 'Jim Thomas', email: 'jthomas@gmail.com', category: 'customer'},
                        {name: 'Bob Blair', email: 'bblair@aol.com', category: 'employee'},
                        {name: 'Randy Quick', email: 'randy.quick@yahoo.com', category: 'employee'},
                        {name: 'Bob Smith', email: 'bobsmith@msn.com', category: 'employee'},
                        {name: 'Susan Jones', email: 'susan.jones@hotmail.com', category: 'employee'},
                        {name: 'Larry Anderson', email: 'anderson.larry@mail.com', category: 'employee'},
                        {name: 'Harry Ellis', email: 'ellis@gmail.com', category: 'employee'},
                        {name: 'Rory Boscoe', email: 'rory@aol.com', category: 'vendor'},
                        {name: 'Simon Green', email: 'sgreen@yahoo.com', category: 'vendor'},
                        {name: 'Quentin Rose', email: 'qrose@msn.com', category: 'vendor'},
                        {name: 'Micah Barry', email: 'barry4u@hotmail.com', category: 'vendor'},
                        {name: 'Alex Angle', email: 'alex.angle@mail.com', category: 'vendor'}
                    ]
                };
                $scope.ddAdvSel = 'ellis@gmail.com';

                // example using remote url.
                $scope.ddRemote = {
                    text: 'name',
                    value: 'email',
                    source: '/dropdown/example/data.json'
                };

            }

            if (area === 'autoform') {
                $scope.autoSource = {
                    name: 'Nancy Brewer',
                    email: 'nancy@gmail.com',
                    phone: '8885551212',
                    age: 23,
                    enabled: true
                };
                $scope.autoOptions = {
                    elements: {
                        email: { type: 'email' },
                        age: { type: 'radio', values: [19,20,21,22,23,24,25] }
                    },
                    source: $scope.autoSource

                };
            }

            if (area === 'loader') {
                $scope.timeout = 2000;
                $scope.pageLoader = function (timeout) {
                    timeout = timeout || 2000;
                    $http.get('/api/loader?timeout=' + timeout).then(function (res) {
                    });
                };
                $scope.customLoader = function (timeout) {                   
                    var loaders = $loader();
                    timeout = timeout || 2000;
                    loaders.custom.start();
                    setTimeout(function () {
                        loaders.custom.stop();
                    }, timeout);
                };
            }

            if (area === 'tree') {
                $scope.tree = {
                    onSelect: function (node, model, event) {
                        //console.log($scope.tree);
                    }
                };
                $scope.treeModel = '/api/tree';
                //$scope.treeModel = [
                //    { value: 1, label: 'item one' },
                //    { value: 2, label: 'item two', children: [
                //        { value: 21, label: 'child item 2-1'},
                //        { value: 22, label: 'child item 2-2'},
                //        { value: 23, label: 'child item 2-3', children: [
                //            { value: 231, label: 'child child item 2-3-1' },
                //            { value: 232, label: 'child child item 2-3-2' }
                //        ]}
                //    ] },
                //    { value: 3, label: 'item three' },
                //    { value: 4, label: 'item four' }
                //];
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

    angular.bootstrap(document, ['app']);

});