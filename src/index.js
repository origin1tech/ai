angular.module('ai', [

    /* Providers
    *******************************************************************/

    /*
     * Google Voice Click2Call
     * Includes directive for connecting client to Google Voice number.
     */
    'ai.click2call',

    /*
     * Dynamic Route Resolver
     * Dynamically based on convention handles route.
     */
    'ai.resolver',

    /*
     * Extend ngResource
     * Extends ngResource with additional options including CRUD.
     * reference: see: https://docs.angularjs.org/api/ngResource/service/$resource
     */
    'ai.resource',

    /* Directives
    *******************************************************************/

    /*
     * Nicescroll Directive
     * Ports nicescroll to an Angular directive.
     * reference: see: http://areaaperta.com/nicescroll/
     */
    'ai.nicescroll'

]);