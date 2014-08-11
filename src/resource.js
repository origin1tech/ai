
angular.module('ai.resource', ['ngResource'])

    .provider('$resource', function $resource() {

        // define defaults
        var defaults = {
            crud: false
        };

        function Resource() {

        }

        // provider get method.
        this.$get = [function () {
            return this;
        }];

    });