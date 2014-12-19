### Ai App Module

Using the app module makes wiring up your client side code extremely easy. This simple file handles most of
the gotchas in using Angular. It also makes it ridiculously easy to wire up various areas of your project simplifying
the syntax and in turn making the project much more organized. As an added benefit when using the $passport module areas 
can now have access levels that are applied globally, then overridden at the route level if desired. Since the logic
uses a standard JavaScript module pattern, your project components can be loaded in any order.

As a result of the module pattern "app" is accessible in any component. Imagine creating a utils factory then in your
primary module inject this factory into your .run. You can now expose methods in app by referencing them as app.method.
Now "app.method" is accessible in any part of the project.

Say you want to create some standardized way of navigating within the project. You could expose something like
app.navigate('/to/path', some_object). Do something with the object each time you navigate. See below for an example
method along with return a complete module.

### Initialize Application
'''
    <script type="text/javascript" src="/path/to/ai.js"></script>
    <script type="text/javascript">
        var modules, options;
        modules = [
            'ngRoute'
        ];
        options = {
            ns: 'my app namespace'
        };
        // now call init
        $app.init(modules, options);
    </script>
'''

That's it! Ai's app module will inject your modules and pass in config options then bootstrap the app.

See below for further details regarding options.

### Initial module (recommended method)

'''
    (function (app) {
    
        'use strict';
    
        app.areas.register('init', function () {
    
            var module, ns;
            
            // this will prefix our namespace using what
            // was defined above in our init options.
            // this is optional but keeps things clear 
            // when inspecting the "app" object.
            ns = app.createNamespace('init');
    
            // create base module
            module = angular.module(ns, [])
    
                .run(['$rootScope', '$utils', function ($rootScope, $utils) {
    
                    // on run expose helpers to app object.
                    // in this example "$utils" is a factory you
                    // might have created with helpers for common
                    // actions and tasks.
                    app.navigate = $utils.navigate;
    
                }]);
    
            // don't forget to return the module.
            return module;
    
        });
    
    })($app);
    
'''

### Registering an Area
'''
    (function (app) {    
        'use strict';    
        // register your area
        app.areas.register('name', {
            access: 1,
            routes: {
                        '/mypath': { templateUrl: '/path/to/view.html' }
                    }
        });    
    })($app);
'''

### Register a Controller
'''
    (function (app) {    
        'use strict';    
        var area = app.areas.common;    
        function LandingController($scope) {
            $scope.hello = 'Hello Ai!';
        }    
        area.register.controller('LandingController', ['$scope', LandingController]);       
    })($app);

'''

### Register a Filter, Service, Factory or Directive
'''
    (function (app) {    
        'use strict';    
        var area = app.areas.common;    
        function MyFactory($scope) {
            $scope.hello = 'Hello Ai!';
        }    
        area.register.factory('MyFactory', ['$scope', MyFactory ]);       
    })($app);

'''
