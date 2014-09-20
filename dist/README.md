# Ai - Angular Helper Framework

A helper framework that assists in simplifying Angular's Superheroic MVW library.

### App Module

Using the app module makes wiring up your client side code extremely easy and fast. This simply file handles most of
the gotchas in using Angular. It also makes it ridiculously easy to wire up various areas of your project simplifying
the syntax and in turn making the project much more organized.

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

That's it! Ai's app module will inject your modules and pass in config options and bootstrap the app.

See below for further details regarding options.

### Registering an Area

'''
    (function (app) {    
        'use strict';    
        // register your area
        app.areas.register('account', {
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
        var area = recrent.areas.common;    
        function MyController($scope) {
            $scope.hello = 'Hello Ai!';
        }    
        area.register.controller('LandingController', ['$scope', MyController]);       
    })($app);

'''

### Register a Filter, Service, Factory or Directive


### JavaScript Components

To use individual components withing the JavaScript library reference the /js/components directory.

### Sass Components

If you wish to compile sass directly within your project you may reference the /css/components directory.