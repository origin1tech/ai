require([
    'helpers',
    'step/step',
    'table/table',
    'widget/widget',
    'flash/flash',
    'storage/storage',
    'passport/passport',
    'list/list',
    'autoform/autoform',
    'loader/loader',
    'tree/tree',
    'passport/passport'
], function () {

    var app, tmpAreas, keys, areas, controller;

    tmpAreas = {
        '/passport': ' (Alpha) Simplifies handling authentication within Angular app.',
        '/storage': 'Use local storage with auto cookie fallback.',
        '/autoform': 'Handy during dev to quickly create a form.',
        '/list': 'Advanced customizable dropdown directive.',
        '/flash': 'Allows for showing flash/popup messages.',
        '/table': 'Bind local or remote data to table/grid.',
        '/widget': 'Various widgets - casing, number, compare, placeholder and lazyload',
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

    //'ai.passport',
    app = angular.module('app', ['ngRoute', 'ngAnimate', 'ai.step', 'ai.table',
        'ai.storage', 'ai.list', 'ai.widget', 'ai.flash',
         'ai.autoform', 'ai.loader', 'ai.tree', 'ai.passport']);
    // '$passportProvider' $passportProvider,,
    app.config(['$routeProvider', '$locationProvider', '$loaderProvider', '$passportProvider',
        function ($routeProvider, $locationProvider,  $loaderProvider, $passportProvider) {
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

            $passportProvider.$set({ welcomeParams: ['firstName', 'lastName']});
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
        '$rootScope', '$scope', '$route', '$flash', '$step', '$storage', '$location', '$http', '$loader', '$passport',
        function ($rootScope, $scope, $route, $flash, $step, $storage, $location, $http, $loader, $passport) {
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
                storage:    { active: 'markup' },
                list:       { active: 'markup' },
                autoform:   { active: 'markup' },
                placeholder:{ active: 'markup' },
                loader:     { active: 'markup' },
                tree:       { active: 'markup' },
                lazyload:   { active: 'markup' },
                passport:   { active: 'markup' }
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
                    {name: 'Jim Thomas', email: 'jthomas@gmail.com', date: '1/22/2016' },
                    {name: 'Bob Blair', email: 'bblair@aol.com', date: '2/2/2016' },
                    {name: 'Randy Quick', email: 'randy.quick@yahoo.com', date: '2/23/2016' },
                    {name: 'Bob Smith', email: 'bobsmith@msn.com', date: '3/17/2016' },
                    {name: 'Susan Jones', email: 'susan.jones@hotmail.com', date: '3/18/2016' },
                    {name: 'Larry Anderson', email: 'anderson.larry@mail.com', date: '3/20/2016' },
                    {name: 'Harry Ellis', email: 'ellis@gmail.com', date: '4/1/2016' ,
                    {name: 'Rory Boscoe', email: 'rory@aol.com', date: '4/3/2016' },
                    {name: 'Simon Green', email: 'sgreen@yahoo.com', date: '4/8/2016' },
                    {name: 'Quentin Rose', email: 'qrose@msn.com', date: '4/11/2016' },
                    {name: 'Micah Barry', email: 'barry4u@hotmail.com', date: '4/12/2016' },
                    {name: 'Alex Angle', email: 'alex.angle@mail.com', date: '4/13/2016' }
                ];

                function filterRows() {

                }

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
                    onReady: function (scope) {

                        scope.options.source = tblSrc;
                        scope.init();

                        console.log(scope.tblAdv);

                    }

                };

            }

            // if (area === 'validate') {
            //     $scope.phonePattern = /^(?!.*911.*\d{4})((\+?1[\/ ]?)?(?![\(\. -]?555.*)\( ?[2-9][0-9]{2} ?\) ?|(\+?1[\.\/ -])?[2-9][0-9]{2}[\.\/ -]?)(?!555.?01..)([2-9][0-9]{2})[\.\/ -]?([0-9]{4})$/;
            //     $scope.submitValidate = function (form, model) {
            //         if (form.$invalid) return;
            //         // alert feedback.
            //         alert('Passed validation your data would submit here.');
            //     };
            //     $scope.validateFormConf = {
            //         onLoad: function (form, ctrl) {
            //         },
            //         validators: {
            //             phone: {
            //                 'ng-pattern': function (obj, form) {
            //                     // eval the value to get orig
            //                     // source expression used in ng-pattern.
            //                     var getExp = $scope.$eval(obj.value);
            //                     return '{{name}} does not match the pattern required.';
            //                 }
            //             }
            //         }
            //     };
            // }

            if (area === 'widget') {
                $scope.decimal = 25;
                $scope.case = 'timothy';
                $scope.sayHello = function () {
                    sayHello();
                };
                $scope.sayHelloInline = function () {
                    sayHelloInline();
                };
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

            if (area === 'list'){

                // basic dropdown example.
                $scope.ddSimple = {
                    text: 'name',
                    value: 'email',
                    inline: true,
                    blurClose: false,
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
                    source: '/list/example/data.json'
                };
                $scope.ddRemoteSel = 'anderson.larry@mail.com';

                var ddModify;

                $scope.ddModify = {
                    text: 'name',
                    value: 'email',
                    source: [
                        {name: 'Jim Evers', email: 'jim@global.net', category: 'customer' },
                        {name: 'Charles Xander', email: 'charles@gmail.com', category: 'customer'},
                        {name: 'Scott Sandres', email: 'sanders.scott@aol.com', category: 'customer'},
                        {name: 'Rob Reiner', email: 'rr@dc.rr.com', category: 'customer'}
                    ],
                    onReady: function ($module) {
                        ddModify = $module;
                    }
                };

                $scope.ddModifySel = 'ellis@gmail.com';

                // adding an element.
                $scope.ddModifyAdd = function ddModifyAdd () {
                    ddModify.add({name: 'Added Record', email: 'added.record@mail.com'});
                };

                // removing an element.
                // you can remove by the model value as
                // shown below or you can specify a
                // second param like .remove(2, true);
                // this says I want you to remove the element
                // at that index.
                $scope.ddModifyRemove = function ddModifyRemove () {
                    ddModify.remove('added.record@mail.com');
                };

                // modifies the source collection of the list.
                $scope.ddModifySource = function ddModifySource() {
                    ddModify.modify([
                        {name: 'New Source', email: 'jim@global.net', category: 'customer' },
                        {name: 'Modified Source', email: 'charles@gmail.com', category: 'customer'}
                    ]);
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

                var trModify;

                $scope.tree = {

                    model: '/api/tree',
                    onSelect: function (node, model, event) {

                    },

                    onReady: function (tree) {
                        trModify = tree;
                    }

                };

                $scope.treeModify = function treeModify(){
                    var newSrc = [
                        { value: 1, label: 'item one' },
                        { value: 2, label: 'item two', children: [
                            { value: 21, label: 'child item 2-1'},
                            { value: 22, label: 'child item 2-2', children: [
                                { value: 221, label: 'child child item 2-2-1' },
                                { value: 222, label: 'child child item 2-2-2' }
                            ]}
                        ] }
                    ];
                    trModify.modify(newSrc);
                };
            }

            if (area === 'passport') {

                $scope.displayName = $passport.displayName();

                $scope.roleMethod = 'hasRole';
                $scope.role = 3;
                $scope.roleResult = '';
                $scope.checkRole = function(method, role) {
                  if ($passport[method]) {
                    $scope.roleResult = $passport[method](role);
                  }
                };

                $scope.roleMinMaxMethod = 'hasMinRole';
                $scope.roleMinMax = 3;
                $scope.roleMinMaxResult = '';
                $scope.checkMinMaxRole = function(method, role) {
                  if ($passport[method]) {
                    $scope.roleMinMaxResult = $passport[method](role);
                  }
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

    angular.bootstrap(document, ['app']);

});
