angular.module('ai', [

    /* PROVIDERS
    *****************************************/

    /**
     * Google Voice Click2Call
     * @description - Includes directive for connecting client to Google Voice number.
     */
    'ai.click2call',

    /**
     * Storage service.
     * @description - saves values to local storage with cookie fallback.
     */
     'ai.storage',

    /**
 * Transition Navigator
 * @description - Navigates between ng-views using CSS3 transitions.
 */
    'ai.navigator',

    /* Directives
    *****************************************/

    /**
     * Nicescroll Directive
     * @description - Ports nicescroll to an Angular directive.
     * @see http://areaaperta.com/nicescroll/
     */
    'ai.nicescroll'

]); 