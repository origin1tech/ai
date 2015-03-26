
/**
* @license
* Ai: <http://github.com/origin1tech/ai>
* Version: 0.1.9
* Author: Origin1 Technologies <origin1tech@gmail.com>
* Copyright: 2014 Origin1 Technologies
* Available under MIT license <http://github.com/origin1tech/stukko-client/license.md>
*/

(function(window, document, undefined) {
'use strict';
angular.module('ai', [
    'ai.helpers',
    'ai.autoform',
    'ai.list',
    'ai.flash',
    'ai.loader',
    'ai.passport',
    'ai.step',
    'ai.storage',
    'ai.table',
    'ai.widget'  
]);
angular.module('ai.helpers', [])

.factory('$helpers', [ '$q', '$templateCache', '$http', '$compile', function ($q, $templateCache, $http, $compile) {

    function tryParse(action, value){
        try { return action(value); }
        catch(ex) { return undefined; }
    }
        
    function tryParseInt(value) {
        if(/^\d+$/.test(value))
            return tryParse(parseInt, value);
        return undefined;
    }

    function tryParseFloat(value) {
        if(/^\d+/.test(value))
            return tryParse(parseFloat, value);
        return undefined;
    }
        
    function tryParseBoolean(value){
        if(/^true$/i.test(value))
            return true;
        if(/^false$/i.test(value))
            return false;
        return undefined;
    }
    
    function tryParseDate(value){
        try { var d = Date.parse(value); if(isNan(d)) d = undefined; return d; }
        catch(ex) { return undefined; }
    }
    
    function tryParseRegex(value){
        if(!/^\//.test(value))
            return undefined;
        var options = value.split('/');
        options = options.pop() || '';
        try{ return new RegExp(value, options);}
        catch(ex) {return undefined;}
    }
        
    function contains(obj, value){
        return obj.indexOf(value) !== -1;        
    }
    
    function trim(str) {
        return str.replace(/^\s+|\s+$/gm,'');
    }

    function isBoolean(value){
            return /^(true|false)$/i.test(value);
    }

    function isHtml(str) {
        return /<(svg|br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|wbr|!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video).*?<\/\2>/.test(str);
    }

    function isPath(str) {
        if(!str || !angular.isString(str)) return false;
        var ext = str.split('.').pop();
        return ext === 'html' || ext === 'tpl';
    }
        
    function isUrl(str) {
        var regex = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!(angular.isString(str) && regex.test(str));
    }
        
    function isRegex(value){
        return tryParseRegex(value);
    }

    // crude object literal test.
    function isPlainObject(value) {
        var json;
        try{ json = JSON.stringify(value); }
        catch(ex){}
        return !(!json || !/^{/.test(json));
    }
        
    function parseAttrs(keys, attrs){
        var result = {};
        angular.forEach(keys, function (k) {       
            // convert string attrs to types.
            if(attrs[k] && angular.isString(attrs[k])){                
                var orig = attrs[k],                               
                value = tryParseRegex(orig);
                if(value === undefined)
                    value = tryParseBoolean(orig);
                if(value === undefined)
                    value = tryParseDate(orig);
                if(value === undefined)
                    value = tryParseFloat(orig);
                //if(value === undefined)
                //    value = tryParseInt(orig);
                if(undefined === value)
                    result[k] = orig;
                else
                    result[k] = value;
            }
        });
        return result;
    }

    function findElement(q, element, single) {
        var querySelector = 'querySelectorAll';
        if(single)
            querySelector = 'querySelector';
        if(angular.isElement(element))
            return element[querySelector](q);
        return angular.element((element || document)[querySelector](q));
    }
    
    function getPutTemplate(name, template) {
        $templateCache.get(name) || $templateCache.put(name, template);
    }

    function loadTemplate(t) {
        // handle html an strings.
        if ((isHtml(t) && !isPath(t)) || (angular.isString(t) && t.length === 0)) {
            var defer = $q.defer();
            defer.resolve(t);
            return defer.promise;
        } else {
            // handle paths.
            return $q.when($templateCache.get(t) || $http.get(t))
                .then(function (res) {
                    if (res.data) {
                        $templateCache.put(t, res.data);
                        return res.data;
                    }
                    return res;
                });
        }
    }

    function getOverflow(elem) {
        var x, y;
        elem = elem || 'body';
        elem = document.querySelector(elem);
        if(!angular.isElement(elem))
            elem = angular.element(elem);
        x = elem.style.overflow || 'auto';
        y = elem.style.overflowY || 'auto';
        return {x:x,y:y};
    }
        
    function compile(scope, contents){
       return $compile(contents)(scope);       
    }

    function selfHtml(element) {
        return angular.element('<div></div>').append(element.clone()).html();
    }

    function toPlainObject(obj) {
        try{
            return JSON.parse(JSON.stringify(obj));
        } catch(ex){
            return obj;
        }
    }
     
    return {
        isHtml: isHtml,
        isPath: isPath,
        isUrl: isUrl,
        isPlainObject: isPlainObject,
        trim: trim,
        isBoolean: isBoolean,
        findElement: findElement,
        getPutTemplate: getPutTemplate,
        loadTemplate: loadTemplate,
        getOverflow: getOverflow,
        compile: compile,
        parseAttrs: parseAttrs,
        tryParseFloat: tryParseFloat,
        tryParseInt: tryParseInt,
        selfHtml: selfHtml,
        toObject: toPlainObject
    };
        
}]);
angular.module('ai.autoform', ['ai.helpers'  ])

.provider('$autoform', function $autoform() {

    var defaults = {

            prefix: 'model',           // value to prepend to models.
            source: undefined,         // the source data for the form.
            labels: undefined,         // when true labels are created.
            type: 'text',              // the default type for elements.
            addClass: false,           // specify class to be added to form for styling.
            textareaAt: 35,            // if value is greater than this use textarea.

            datetimeExp:               // date time expression
                /^(0?[1-9]|1[012])(:[0-5]\d) [APap][mM]$/,

            phoneExp:                   // phone expression
                /^(?!.*911.*\d{4})((\+?1[\/ ]?)?(?![\(\. -]?555.*)\( ?[2-9][0-9]{2} ?\) ?|(\+?1[\.\/ -])?[2-9][0-9]{2}[\.\/ -]?)(?!555.?01..)([2-9][0-9]{2})[\.\/ -]?([0-9]{4})$/,

            intExp:                     // integer/number expression.
                /^\d+$/,
                                        // email expression.
            emailExp:
                /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/

        },
        get, set;

    set = function set(key, value) {
        var obj = key;
        if(arguments.length > 1){
            obj = {};
            obj[key] = value;
        }
        defaults = angular.extend(defaults, obj);
    };

    get = ['$rootScope', '$helpers',   function get($rootScope, $helpers) {

        // iterate attributes build string.
        function parseAttributes(attrs) {
            if(!attrs || !angular.isObject(attrs)) return '';
            var result = [];
            angular.forEach(attrs, function (v, k) {
                if(k === 'ngModel')
                    k = 'ng-model';
                result.push(k + '="' + v + '"');
            });
            return result.join(' ');
        }

        // simple array contains.
        function contains(arr, value){
            return arr.indexOf(value) !== -1;
        }

        // generate tabs.
        function tab(qty) {
            var _tab = '',
                ctr = 0;
            while(ctr < qty){
                _tab += '\t';
                ctr += 1;
            }
            return _tab;
        }

        // trim string.
        function trim(str) {
            return str.replace(/^\s+/, '').replace(/\s+$/, '');
        }

        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // parse the element type.
        function parseType(value, options) {
            if($helpers.isBoolean(value))
                return 'checkbox';
            if(options.phoneExp.test(value))
                return 'tel';
            if(options.datetimeExp.test(value))
                return 'datetime';
            if(options.intExp.test(value))
                return 'number';
            if(options.emailExp.test(value))
                return 'email';
            return options.type;
        }

        function generateRadios(values, attrs){
            var radAttrs = attrs,
                radios = '';
            angular.forEach(values, function (v) {
                var radOpts = '<label class="radio-inline"><input {{ATTRS}}/>' +
                    ' {{NAME}}</label>';
                radios += (radOpts
                    .replace('{{ATTRS}}', trim(radAttrs + ' value="' + v + '"')))
                    .replace('{{NAME}}', v);
            });

            return radios;
        }

        function ModuleFactory(element, options, attrs) {

            var $module = {},
                template = '',
                scope,
                elements;
 
            // parse out relevant options
            // from attributes.
            if(attrs)
                attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

            options = options || {};
            $module.scope = scope = options.scope || $rootScope.$new();
            $module.options = scope.options = options = angular.extend({}, defaults, attrs, options);
            elements = options.elements || {};

            if(angular.isString(options.source))
                options.source = scope.$eval(options.source);

            // initialize the module.
            function init() {

                var template = '',
                    groups = [];

                // normalize the data.
                angular.forEach(options.source, function (v,k) {

                    // parse source get type & attributes
                    var elem = elements[k] = elements[k] || {},
                        capName = capitalize(k),
                        attrs,
                        tmpValue,
                        el;
                    
                    attrs = elem.attributes = elem.attributes || {};

                    // set type
                    attrs.type = elem.type || attrs.type;

                    // normalize name attribute.
                    attrs.name = attrs.name || k;

                    // set value.
                    attrs.value = v || attrs.value || elem.value;
                    if(attrs.type === undefined)
                        attrs.type = parseType(attrs.value, options);

                    // set default class value.
                    attrs.class = attrs.class || '';

                    // if ngModel is false delete from attrs.
                    // if undefined create adding prefix.
                    if(attrs.ngModel === false || elem.ngModel === false)
                        delete attrs.ngModel;
                    else
                        attrs.ngModel =
                            attrs.ngModel ||
                            elem.ngModel ||
                            options.prefix ? options.prefix + '.' + k : k;

                    // if values array/object
                    // supplied set type as select
                    // if not specified by user
                    // and not of type radio.
                    if(elem.values){
                        if(angular.isString(elem.values))
                            elem.values = elem.values.split(',');
                        if(!angular.isArray(elem.values) && angular.isObject(elem.values)){
                            // if is object can only be select.
                            attrs.type = 'select';
                        }
                        if(angular.isArray(elem.values)){
                            attrs.type = attrs.type === 'radio' ? 'radio' : 'select';
                        }
                    }

                    // test if textarea is needed.
                    if(attrs.value && angular.isString(attrs.value) && attrs.value.length > options.textareaAt)
                        attrs.type = 'textarea';

                    // add default class for inputs/selects.
                    if(!contains(['checkbox', 'radio'], attrs.type))
                        attrs.class = trim(attrs.class.replace('form-control', '') + ' form-control');

                    // store value temporarily.
                    tmpValue = attrs.value;

                    // set value as checked/selected if radio
                    // or select delete from attrs.
                    if(contains(['select', 'radio', 'textarea'], attrs.type)){
                        if(attrs.type === 'radio')
                            elem.checked = attrs.value;
                        if(attrs.type === 'select')
                            elem.selected = attrs.value;
                        if(attrs.type === 'textarea')
                            elem.content = attrs.value;
                        delete attrs.value;
                    }

                    // parse all attributes.
                    var attrsStr = elem.attributesStr = parseAttributes(attrs);

                    // add value back in after parsing.
                    attrs.value = tmpValue;

                    var group = '';

                    // create opening group markup.
                    
                    if(attrs.type !== 'checkbox'){
                        group += '<div class="form-group">';
                    } else {
                        group += '<div class="checkbox">';
                    }

                    // generate labels.
                    if(attrs.type !== 'radio') {
                        var label = '<label{{FOR}}>';
                        if(attrs.type !== 'checkbox') {
                            label = label.replace('{{FOR}}', ' for="' + k + '"') + capName + '</label>';
                        } else {
                            label = label.replace('{{FOR}}', '');
                        }

                        // labels are required for checkboxes.
                        if(options.labels !== false || attrs.type === 'checkbox')
                            group += label;
                    }

                    // check if non-standard input type.
                    if(contains(['select', 'textarea', 'radio'], attrs.type)) {

                        if(attrs.type === 'textarea'){
                            el = '<textarea {{ATTRS}}>{{CONTENT}}</textarea>';
                            el = el.replace('{{CONTENT}}', attrs.value);
                        }

                        if(attrs.type === 'select'){
                            var opts = '',
                                isKeyVal = !angular.isArray(elem.values);
                            el = '<select {{ATTRS}}>{{OPTIONS}}</select>';
                            angular.forEach(elem.values, function (v,k) {
                                var opt = '<option {{VALUE}}>{{TEXT}}</option>';
                                if(isKeyVal)
                                    opt = (opt.replace('{{VALUE}}', k).replace('{{TEXT}}', v));
                                else
                                    opt = (opt.replace('{{VALUE}}', '').replace('{{TEXT}}', v));
                                opts += opt;
                            });
                            el = el.replace('{{OPTIONS}}', opts);
                        }

                        if(attrs.type === 'radio'){

                            group += generateRadios(elem.values, attrsStr);
                            group += '</div>';
                        }

                    } else {
                        el = '<input {{ATTRS}}/>';
                    }

                    // add attribute string.
                    if(el) {
                        el = el.replace('{{ATTRS}}', attrsStr);
                        // add element to group.
                        group += el;
                    }

                    // close label if radio or checkbox.
                    if(attrs.type === 'checkbox')
                        group += capName + '</label>';
                    
                    // close markup group.
                    if(!contains(['radio'], attrs.type))
                        group += '</div>';
                    
                    // add to the collection.
                    groups.push(group);

                });

                var wrapper = angular.element('<div></div>'),
                    form = angular.element('<form></form>');

                template = groups.join('\n');
                element.replaceWith(wrapper);
                form.html(template);
                wrapper.append(form);

                scope.model = options.source;
                $helpers.compile(scope, wrapper.contents());

                return $module;

            }

            return init();

        }

        return ModuleFactory;

    }];

    return {
        $get: get,
        $set: set
    };

})

.directive('aiAutoform', ['$autoform', function($autoform) {

    return {
        restrict: 'AC',
        scope: true,
        link: function (scope, element, attrs) {

            var defaults, options, $module;

            defaults = {
                scope: scope
            };

            function init() {
                // create the directive.
                $module = $autoform(element, options, attrs);
            }

            // get options and model.
            options = angular.extend(defaults, scope.$eval(attrs.aiAutoform || attrs.aiAutoformOptions || attrs.aiFormOptions));

            // define the source.
            //options.source = options.source || scope.$eval(attrs.source);
            init();

        }

    };

}]);


angular.module('ai.flash.factory', ['ai.helpers'])

    .provider('$flash', function $flash() {

        var defaults, get, set;

        // default settings.
        defaults = {
            template: 'ai-flash.html',              // the template for flash message.
            errorKey: 'err',
                                                    // if undefined validation errors are undefined.
            excludeErrors: [401, 403, 404],         // exclude errors by status type.           
            errorName: 'Unknown Exception',         // the error name to use in event and error.name is not valid.
            errorMessage: 'An unknown exception ' + // default error message in event one is not provided.
                          'has occurred, if the ' +
                          'problem persists ' +
                          'please contact the ' +
                          'administrator.',
            title: undefined,                       // when true flash error messages use the error name as the title
                                                    // in the flash message.
            stack: false,                           // when true stack trace is shown.
            multiple: false,                        // whether to allow multiple flash messages at same time.
            type: 'info',                           // the default type of message to show also the css class name.
            typeError: 'danger',                    // the error type or class name for error messages.
            timeout: 3500,                          // timeout to auto remove flashes after period of time..
                                                    // instead of by timeout.
            intercept: undefined,                   // when false flash error interception is disabled.
            onError: undefined                      // callback on error before flashed, return false to ignore.
        };

        // set global provider options.
        set = function set(key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        // get provider
        get = ['$rootScope', '$timeout', '$helpers',
            function get($rootScope, $timeout, $helpers) {

            var flashTemplate, $module;
 
            flashTemplate = '<div class="ai-flash-item" ng-repeat="flash in flashes" ng-mouseenter="enter(flash)" ' +
                            'ng-mouseleave="leave(flash)" ng-class="flash.type">' +
                                '<a class="ai-flash-close" type="button" ng-click="remove(flash)">&times</a>' +
                                '<div class="ai-flash-title" ng-if="flash.title" ng-bind-html="flash.title"></div>' +
                                '<div class="ai-flash-message" ng-bind-html="flash.message"></div>' +
                            '</div>';

            $helpers.getPutTemplate(defaults.template, flashTemplate);

            function tryParseTimeout(to) {
                if(undefined === to)
                    return to;
                try{
                   return JSON.parse(to);
                } catch(ex){
                    return to;
                }
            }

            // The flash factory
            function ModuleFactory() {

                var flashes = [],          
                    scope,
                    body,
                    overflows,
                    element,
                    options;
                
                $module = {};
                options = {};

                // uses timeout to auto remove flash message.
                function autoRemove(flash) {
                    clearTimeout(flash.timeoutId);
                    flash.timeoutId = $timeout(function () {
                        if(flash.focus) {
                            clearTimeout(flash.timeoutId);
                            autoRemove(flash);
                        } else {
                            clearTimeout(flash.timeoutId);
                            remove(flash);
                        }
                    }, flash.timeout);
                }
                
                // add a new flash message.
                function add(message, type, title, timeout) {
                    var flashDefaults = {
                            title: undefined,
                            type: options.type,
                            focus: false,
                            show: false,
                            timeout: false
                        }, flash = {}, tmpTitle;
                    title = tryParseTimeout(title);
                    timeout = tryParseTimeout(timeout);
                    // if title is number assume timeout
                    if(angular.isNumber(title) || 'boolean' === typeof title){
                        timeout = title;
                        title = undefined;
                    }
                    if(!options.multiple)
                        flashes = [];
                    // if message is not object create Flash.
                    if(!angular.isObject(message)){
                        flash = {
                            message: message,
                            type: type || options.type,
                            title: title || options.title,
                            timeout: timeout || options.timeout
                        };
                    }
                    // extend object with defaults.
                    flash = angular.extend({}, flashDefaults, flash);
                    // set the default timeout if true was passed.
                    if(flash.timeout === true)
                        flash.timeout = options.timeout;
                    if(flash.message) {
                        flashes.push(flash);
                        $module.flashes = scope.flashes = flashes;
                        body.css({ overflow: 'hidden'});
                        element.addClass('show');
                        if(flash.timeout)
                            autoRemove(flash);

                    }
                }
                
                // remove a specific flash message.
                function remove(flash) {
                    if(flash && flashes.length) {
                        flashes.splice(flashes.indexOf(flash), 1);
                        if(!flashes.length){
                            body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                            if(element)
                                element.removeClass('show');
                        }
                    }
                    
                }
                
                // remove all flash messages in collection.
                function removeAll() {
                    if(flashes.length) {
                        angular.forEach(flashes, function (flash) {
                            if(flash.shown === true)
                                remove(flash);
                            else
                                flash.shown = true;
                        });
                    }
                }

                // on flash enter set its focus to true
                // so it is not removed while being read.
                function enter(flash) {
                    flash.focus = true;
                }

                // on leave set the focus to false
                // can now be removed.
                function leave(flash) {
                    flash.focus = false;
                }
                
                function suppress() {
                    $module.suppressed = false;
                }

                function setOptions(key, value) {
                    var obj = key;
                    if(arguments.length > 1){
                        obj = {};
                        obj[key] = value;
                    }
                    $module = $module || {};
                    scope = scope || {};
                    options = $module.options = angular.extend(options, obj);
                    if(scope)
                        scope.options = options;
                }
                
                function destroy() {
                    if(element)
                        element.removeClass('show');
                    if(body)
                        body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                    scope.flashes = $module.flashes = flashes = [];
                    scope.$destroy();
                }
                
                // get overflows and body.
                body = $helpers.findElement('body');
                overflows = $helpers.getOverflow();
                
                function init(_element, _options, attrs) {
                    
                    element = _element;

                    // parse out relevant options
                    // from attributes.
                   attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);
                    
                    // extend options      
                    $module.scope = scope = _options.scope || $rootScope.$new();
                    options = angular.extend({}, defaults, attrs, options, _options);
                    options.onError = options.onError || function () { return true; };
                    $module.options = scope.options = options;

                    scope.add = add;
                    scope.remove = remove;
                    scope.removeAll = removeAll;
                    scope.flashes = flashes;
                    scope.leave = leave;
                    scope.enter = enter;
                    scope.set = setOptions;
                    scope.suppress = suppress;

                    $module.add = add;
                    $module.remove = remove;
                    $module.removeAll = removeAll;
                    $module.suppress = suppress;

                    // load the template.
                    $helpers.loadTemplate(options.template).then(function (template) {
                        if(template) {
                            element.html(template);
                            $helpers.compile(scope, element.contents());
                            element.addClass('ai-flash');
                        } else {
                            console.error('Error loading $flash template.');
                        }
                    });

                    // when route changes be sure
                    // to remove all flashes.
                    $rootScope.$on('$locationChangeStart', function () {
                        if(element)
                            element.removeClass('show');
                        if(body)
                            body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                        scope.flashes = $module.flashes = flashes = [];
                    });

                    scope.$watch($module.options, function (newVal, oldVal) {
                        if(newVal === oldVal) return;
                        scope.options = newVal;
                    });

                    scope.$on('destroy', function () {
                        $module.destroy();
                    });
                    
                }

                $module.set = setOptions;
                $module.init = init;
                
                return $module;
            }

            // $flash requires singleton
            function getInstance() {
                if(!$module)
                    $module = ModuleFactory();
                return $module;
            }

            // return $module instance.
            return getInstance();

        }];

        // return getter/setter.
        return {
            $set: set,
            $get: get
        };

    })

    .directive('aiFlash', [ '$flash', function ($flash) {

        return {
            restrict: 'EAC',
            scope: true,
            link: function (scope, element, attrs) {

                var $module, defaults, options;

                defaults = {
                    scope: scope
                };

                // initialize the directive.
                function init () {
                    $module = $flash.init(element, options, attrs);
                }

                options = scope.$eval(attrs.aiFlash) || scope.$eval(attrs.aiFlashOptions);
                options = angular.extend(defaults, options);

                init();

            }
        };
    }]);


angular.module('ai.flash.interceptor', [])
    .factory('$flashInterceptor', ['$q', '$injector', function ($q, $injector) {
        return {
            responseError: function(res) {
                
                // get passport here to prevent circular dependency.
                var flash = $injector.get('$flash'),
                    excludeErrors = flash.options.excludeErrors || [];
                
                // if interception is disabled
                // don't handle/show message.
                if(flash.options.intercept === false || flash.suppressed){
                    flash.suppressed = false;
                    return res;
                }                    
                
                function handleFlashError(errObj){
                    var name, message, stack;
                    if(flash.options.errorKey && errObj[flash.options.errorKey])
                        errObj = errObj[flash.options.errorKey];
                    name = errObj.displayName || errObj.name || flash.options.errorName;
                    message = errObj.message || flash.options.errorMessage;
                    stack = errObj.stack || '';
                    // handle stack trace.
                    if(stack && flash.options.stack){
                        if(angular.isArray(stack))
                            stack = stack.join('<br/>');
                        if(angular.isString(stack) && /\\n/g.test(stack))
                            stack = stack.split('\n').join('<br/>');
                        message += ('<br/><strong>Stack Trace:</strong><br/>' +  stack);
                    }
                    message = '<strong>Message:</strong> ' + message;
                    message = message.replace(/From previous event:/ig, '<strong>From previous event:</strong>');
                    // finally display the flash message.
                    if(flash.options.title !== false)
                        flash.add(message, flash.options.typeError, name);
                    else
                        flash.add(message, flash.options.typeError);
                    return $q.reject(res);
                }
                
                if(res.status && excludeErrors.indexOf(res.status) === -1){
                    // handle error using flash.
                    if(!res.data){                        
                        if(flash.options.title !== false)
                            flash.add(res.statusText, flash.options.typeError || 'flash-danger', res.status);
                        else
                            flash.add(res.statusText, flash.options.typeError || 'flash-danger');
                        return $q.reject(res);
                    } else {
                        var err = res.data;                     
                        $q.when(flash.options.onError(res, flash)).then(function (result) {
                            if(result){                                
                                if(result === true)
                                    result = err;                             
                                handleFlashError(result);                                
                            }                                
                        });                        
                    }
                }
            },
            response: function (res) {
                var flash = $injector.get('$flash');
                // ensure we turn disable once off.
                flash.suppressed = false;
                return res || $q.when(res);
            }
        };
        
    }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('$flashInterceptor');
    }]);

// imports above modules.
angular.module('ai.flash', [
    'ai.flash.factory',
    'ai.flash.interceptor'
]);

angular.module('ai.list', ['ai.helpers'])

    .provider('$list', function $list(){

        var defaults = {

            text: 'text',                           // property to use for text values.
            value: 'value',                         // property to use for model values default is text.
            display: false,                         // alt property to use for display values.
            capitalize: undefined,                  // if true display is capitalized. (group is cap also if used).
            searchable: undefined,                  // indicates that the list is searchable.
            placeholder: 'Please Select',           // placeholder text shown on null value.
            btnClass: 'btn-default',                // the class to add to the button which triggers list.
            allowNull: undefined,                   // when true user can select placeholder/null value.
            inline: false,                          // positions element inline.
            shadow: undefined,                      // when true adds shadow to bottom of list.

            template: 'list.tpl.html',          // the template to use for the list control.
            itemTemplate:
                'list-item.tpl.html',           // template used for list items.
            itemGroupTemplate:
                'list-item-group.tpl.html',
            searchTemplate:
                'list-search.tpl.html',         // template used for searching list.
            addClass: false,                        // adds a class the top level of the component.

            source: [],                             // data source can be csv, object, array of string/object or url.
            params: {},                             // object of data params to pass with server requests.
            queryParam: 'q',                        // the param key used to query on server requests.
            method: 'get',                          // the method to use for requests.

            groupKey: false,                        // the parent primary key to find children by.
            groupDisplay: false,                    // used to display the group name.

            selectClose: undefined,                 // if not false list is closed after selection.
            selectClear: undefined,                 // after selecting value clear item.
            closeClear: undefined,                  // when searchable and on toggle close clear query filter.
            blurClose: undefined,                   // when true list is closed on blur event.
            closePrevious: undefined,               // when not false previously opened lists are closed.

            // all callbacks are returned with $module context.
            onToggled: false,                       // on toggle list state. injects(toggle state, event).
            onSelected: false,                      // callback on select. injects(selected, ngModel, event).
            onFilter: false,                        // callback on filter. injects (filter, event).
            onGroup: false,                         // callback fired on grouping injects (distinct groups, data).
            onReady: false                           // callback on directive loaded. returns

        }, get, set;

        set = function set(key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        get = [ '$q', '$parse', '$filter', '$http', '$helpers', function get($q, $parse, $filter, $http, $helpers) {

            var baseTemplate = '<button type="button" class="btn ai-list-toggle" ng-click="toggle($event, ts)" ng-class="{expanded: expanded}">' +
                '<span class="selected" ng-bind="selected.display">Please Select</span>' +
                '<span class="caret" ng-class="{ down: !expanded, up: expanded }"></span>' +
                '</button>' +
                '<div class="ai-list-wrapper">' +
                '<div class="ai-list-items" ng-show="expanded">' +
                '</div>' +
                '</div>';

            // item template must be wrapped
            // with outer <ul>.
            var itemTemplate =  '<ul>' +
                '<li ng-repeat="item in items" ng-class="{ active: item.active }">' +
                '<a ng-click="select($event, item)">{{item.display}}</a>' +
                '</li>' +
                '</ul>';

            // item group template must be
            // wrapped in outer <div>
            var itemGroupTemplate = '<div>' +
                '<div ng-repeat="group in items" ng-if="!group.hidden">' +
                '<h5 ng-bind="group.display" ng-show="group.display"></h5>' +
                '<ul>' +
                '<li ng-repeat="item in group.items" ng-class="{ active: item.active }">' +
                '<a ng-click="select($event, item)">{{item.display}}</a>' +
                '</li>' +
                '</ul>' +
                '</div>' +
                '</div>';


            var searchTemplate =  '<input type="text" ng-model="q" ng-change="filter($event, q)" class="ai-list-search form-control" placeholder="search"/>';

            $helpers.getPutTemplate(defaults.template, baseTemplate);
            $helpers.getPutTemplate(defaults.itemTemplate, itemTemplate);
            $helpers.getPutTemplate(defaults.itemGroupTemplate, itemGroupTemplate);
            $helpers.getPutTemplate(defaults.searchTemplate, searchTemplate);

            var activeLists = [];

            // module factory.
            function ModuleFactory(element, options, attrs) {

                if((!element && !$helpers.isElement(element)) || !options.source)
                    return;

                var $module = {},
                    scope,
                    list,
                    button,
                    search,
                    items,
                    nullItem;

                // parse out relevant options
                // from attributes.

                attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

                options = options || {};
                $module.scope = scope = options.scope || $rootScope.$new();
                $module.options = scope.options = options = angular.extend({}, defaults, attrs, options);

                nullItem = { text: options.placeholder, value: '', display: options.placeholder };

                // normalize source data to same type.
                function normalizeData(data) {
                    if(!data)
                        return [];
                    var _collection = options.groupKey ? {} : [],
                        display;
                    // if string split to array.
                    if(angular.isString(data))
                        data = $helpers.trim(data).split(',');
                    if(options.allowNull !== false && angular.isArray(_collection))
                        _collection.push(nullItem);
                    if(options.allowNull !== false && angular.isObject(_collection))
                        _collection._placeholder = {
                            key: 'placeholder',
                            display: false,
                            hidden: false,
                            items: [nullItem]
                        };
                    angular.forEach(data, function (v,k) {
                        if(angular.isString(v)) {
                            display = v = $helpers.trim(v);
                            if(options.capitalize !== false)
                                display = v.charAt(0).toUpperCase() + v.slice(1);
                            // simple string just push to collection.
                            _collection.push({ text: v, value: v, display: display });
                        }
                        if(angular.isObject(v)) {
                            var item = v,
                                displayKey = options.display || options.text;
                            item.text = v[options.text];
                            item.text = item.text.charAt(0).toUpperCase() + item.text.slice(1);
                            item.value = v[options.value] || item.text;
                            item.display = v[displayKey];
                            if(options.capitalize !== false)
                                item.display =  item.display.charAt(0).toUpperCase() + item.display.slice(1);
                            if(!options.groupKey) {
                                _collection.push(item);
                            } else {
                                var groupKey = v[options.groupKey],
                                    groupDisplay = v[options.groupDisplay || options.groupKey];
                                if(options.capitalize !== false)
                                    groupDisplay = groupDisplay.charAt(0).toUpperCase() + groupDisplay.slice(1);
                                _collection[groupKey] = _collection[groupKey] ||
                                { key: groupKey, display: groupDisplay, hidden: false };
                                _collection[groupKey].items = data.filter(function(i) {
                                    return i[options.groupKey] === groupKey;
                                });
                            }
                        }
                    });

                    return _collection;
                }

                // build params for server request.
                function buildParams(params, q) {
                    params = params || {};
                    if(q)
                        params[options.queryParam] = q;
                    return params;
                }

                // load data using promise.
                function loadData(q) {
                    if(angular.isString(options.source)){
                        var method = options.method,
                            params = buildParams(options.params, q);
                        return $q.when($http[method](options.source, { params: params }))
                            .then(function(res) {
                                return normalizeData(res.data);
                            });
                    } else {
                        var defer = $q.defer();
                        defer.resolve(normalizeData(options.source));
                        return defer.promise;
                    }
                }

                // parse ngDisabled if present.
                function parseDisabled(newVal) {
                    if(!button || undefined === newVal)
                        return;
                    var isDisabled = $parse(newVal)(scope.$parent);
                    if(isDisabled)
                        button.attr('disabled', 'disabled');
                    else
                        button.removeAttr('disabled');
                }

                // clears active items.
                function clearActive() {
                    angular.forEach(scope.items, function (item) {
                        if(!options.groupKey) {
                            item.active = false;
                        } else {
                            if(item.items){
                                angular.forEach(item.items, function (groupItem) {
                                    groupItem.active = false;
                                });
                            }
                        }
                    });
                }

                // clear the search filter.
                function clearFilter() {
                    $module.q = scope.q = '';
                    filter(null, scope.q);
                }

                // find item by value.
                function find(value) {
                    if(!value) return;
                    var found;
                    if(!options.groupKey){
                        found = scope.items.filter(function (item){
                            return item.value === value;
                        })[0];
                        return found;
                    } else {
                        angular.forEach(scope.items, function (group) {
                            if(!found) {
                                found = group.items.filter(function(item) {
                                    return item.value === value;
                                })[0];
                            }
                        });
                        return found;
                    }
                }

                // select item.
                function select(event, item, suppress) {
                    var _item = { text: options.placeholder, value: '', display: options.placeholder };
                    // clear active item flag.
                    clearActive();
                    // if not clear on select
                    // otherwise set back to
                    // default placeholder.
                    if(!options.selectClear){
                        if(item) {
                            _item = item;
                            _item.active = true;
                        }
                    }
                    $module.selected = scope.selected = _item;
                    // update ngModel value.
                    if(options.model && !suppress) {
                        var model = options.model;
                        // set val too make sure ui updates.
                        element.val(_item.value);
                        model.$setViewValue(_item.value);
                        if(model.$setTouched)
                            model.$setTouched(true);
                    }
                    // if on select close toggle list.
                    if(options.selectClose !== false && !suppress)
                        toggle();
                    // clear the filter.
                    clearFilter();
                    // callback on select funciton.
                    if(angular.isFunction(options.onSelected))
                        options.onSelected.call($module, _item, options.model, event);
                }

                function beforeToggle(ts) {
                    angular.forEach(activeLists, function (dd, idx) {
                        if(dd.ts !== ts){
                            dd.options.scope.expanded = false;
                            activeLists.splice(idx, 1);
                        }
                    });
                }

                // toggle the list.
                function toggle(event, ts) {
                    if(ts && (options.closePrevious !== false))
                        beforeToggle(ts);
                    scope.expanded =! scope.expanded;
                    $module.expanded = scope.expanded;
                    if(!scope.expanded && options.closeClear === true)
                        clearFilter();
                    if(scope.expanded){
                        list[0].focus();
                        activeLists.push($module);
                    }
                    // if a function callback on toggle.
                    if(angular.isFunction(options.onToggled))
                        options.onToggled.call($module, scope.expanded, event);
                    // closing so clear filter.
                    if(options.searchable !== false && !scope.expanded && angular.isFunction(options.closeClear))
                        $module.q = scope.q = undefined;
                }

                // filter the collection.
                function filter(event, q) {
                    var filtered = scope.source;
                    if(angular.isFunction(options.onFilter)){
                        filtered = options.onFilter.call($module, filtered, event);
                    } else {
                        if(!options.groupKey){
                            // filtering std list.
                            filtered = $filter('filter')(scope.source, q);
                        } else {
                            // filtering group list.
                            angular.forEach(filtered, function(v,k) {
                                var _items = $filter('filter')(v.items, q);
                                v.hidden = !_items.length;
                            });
                        }
                    }
                    $module.items = scope.items = filtered;
                }

                // initialize the module.
                function init() {

                    var promises = [];

                    // set scope/method vars.
                    $module.selected = scope.selected = nullItem;
                    $module.expanded = scope.expanded = false;
                    $module.q = scope.q = undefined;

                    // timestamp used as an id.
                    $module.ts = scope.ts = options.ts;

                    // set scope/module methods.
                    $module.toggle = scope.toggle = toggle;
                    $module.find = scope.find = find;
                    $module.beforeToggle = scope.beforeToggle = beforeToggle;
                    // if calling by instance
                    // no event so pass null apply args.
                    $module.select = function () {
                        var args = Array.prototype.slice.call(arguments, 0);
                        args = [null].concat(args);
                        select.apply(this, args);
                    };
                    scope.select = select;

                    // when calling by instance
                    // no event so pass null apply args.
                    $module.filter = function () {
                        var args = Array.prototype.slice.call(arguments, 0);
                        args = [null].concat(args);
                        filter.apply(this, args);
                    };
                    scope.filter = filter;

                    scope.$on('destroy', function () {
                        activeLists = [];
                    });

                    // parse ngDisabled if exists.
                    $module.parseDisabled = scope.parseDisabled = parseDisabled;

                    // load data.
                    loadData().then(function (res) {

                        // add data collection to scope.
                        // store original collection.
                        // and filtered item collection.
                        $module.source = scope.source = res;
                        $module.items = scope.items = res;

                        // add template promises to queue.
                        promises.push($helpers.loadTemplate(options.template || ''));
                        promises.push($helpers.loadTemplate(options.searchTemplate || ''));

                        // add group or base items template.
                        if(options.groupKey)
                            promises.push($helpers.loadTemplate(options.itemGroupTemplate || ''));
                        else
                            promises.push($helpers.loadTemplate(options.itemTemplate || ''));

                        // build the templates.
                        $q.all(promises).then(function(res) {

                            // replace with new template.
                            if(res && res.length) {

                                var vis = options.visibility,
                                    visAttrs = '',
                                    itemsHtml = '';

                                // create outer wrapper element.
                                list = '<div tabindex="-1"{{ATTRS}}></div>';

                                // check for ng-show
                                if(vis.ngShow)
                                    visAttrs += ' ng-show="' + vis.ngShow + '"';

                                // check for ng-hide
                                if(vis.ngHide)
                                    visAttrs += ' ng-hide="' + vis.ngHide + '"';

                                // check for ng-if
                                if(vis.ngIf)
                                    visAttrs += ' ng-if="' + vis.ngIf + '"';

                                // add ng-if, ng-show, ng-hide
                                // attrs if provided from orig element.
                                // the parent scope is applied.
                                list = list.replace('{{ATTRS}}', visAttrs);

                                // compile with parent scope for ng-attrs.
                                list = angular.element($helpers.compile(scope.$parent, list));

                                // add primary class for styling.
                                list.addClass('ai-list');

                                // check if block display.
                                if(options.inline)
                                    list.addClass('inline');

                                // if group add class to main element.
                                if(options.groupKey)
                                    list.addClass('group');

                                // if additional class add it.
                                if(options.addClass)
                                    list.addClass(options.addClass);

                                // replace the orig. element.
                                // use after as jqlite doesn't
                                // support .before();
                                var prev = options.before;
                                prev.element[prev.method](list);

                                // set content to template html.
                                list.html(res[0]);

                                // get the items container.
                                items = $helpers.findElement('.ai-list-items', list[0], true);
                                items = angular.element(items);

                                if(options.shadow !== false)
                                    items.addClass('shadow');

                                // add items and search if required.
                                if(options.searchable !== false)
                                    itemsHtml += res[1];

                                // add items template.
                                itemsHtml += res[2];
                                items.html(itemsHtml);

                                // get reference to button.
                                button = $helpers.findElement('button:first-child', list[0], true);
                                button = angular.element(button);
                                button.addClass(options.btnClass);

                                if(options.blurClose !== false) {
                                    // find search input
                                    // add listener if blurClose
                                    search = $helpers.findElement('input', list[0], true);
                                    if(search){
                                        search = angular.element(search);
                                        search.on('blur', function (e) {
                                            e.preventDefault();
                                            if(!e.relatedTarget && scope.expanded){
                                                scope.$apply(function () {
                                                    toggle(e);
                                                });
                                            }
                                        });
                                    }

                                    // check for on blur event.
                                    list.on('blur', function (e) {
                                        e.preventDefault();
                                        if(scope.expanded && !e.relatedTarget){
                                            scope.$apply(function () {
                                                toggle(e);
                                            });
                                        }
                                    });

                                }

                                // disable button
                                if(vis.disabled)
                                    button.attr('disabled', 'disabled');

                                // set button to readonly.
                                if(vis.readonly)
                                    button.attr('readonly', 'readonly');

                                // parse ng-disabled.
                                if(vis.ngDisabled)
                                    parseDisabled(vis.ngDisabled);

                                // we need to monitor ngDisabled if exists
                                // as it may change all other attrs
                                // are applied to either outer div with parent
                                // scope or remain on the original input element.
                                if(attrs.ngDisabled) {
                                    scope.$watch(attrs.ngDisabled, function (newVal, oldVal){
                                        if(newVal === oldVal) return;
                                        scope.parseDisabled(newVal);
                                    });
                                }

                                // watch model to set selected.
                                scope.$watch(attrs.ngModel, function (newVal, oldVal) {
                                    if((!initialized && undefined !== newVal) || newVal !== oldVal){
                                        var item = scope.find(newVal);
                                        if(!item || (item.value === scope.selected.value)) return;
                                        scope.select(null, item, true);
                                        initialized = true;
                                    }
                                });

                                // compile the contents.
                                $helpers.compile(scope, list.contents());

                                // if onload callback.
                                if(angular.isFunction(options.onReady))
                                    options.onReady.call($module);

                            }

                        });

                    });

                    // don't wait for template just return;
                    return $module;

                }

                return init();
            }

            return ModuleFactory;

        }];

        return {
            $get: get,
            $set: set
        };

    })

    .directive('aiList', [ '$list', function ($list) {

        // get the previous sibling
        // to the current element.
        function prevSibling(elem, ts) {
            try {
                var parents = elem.parent(),
                    prevIdx;
                angular.forEach(parents.children(), function (v,k) {
                    var child = angular.element(v),
                        _ts = child.attr('_ts_');
                    if(ts.toString() === _ts){
                        prevIdx = k -1;
                    }
                });
                elem.removeAttr('_ts_');
                if(prevIdx < 0)
                    return { element: angular.element(elem.parent()), method: 'prepend' };
                return { element: angular.element(parents.children().eq(prevIdx)), method: 'after' };
            } catch(ex) {
                return false;
            }
        }

        return {
            restrict: 'EAC',
            scope: true,
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel){

                var defaults, options, $module, model,
                    tagName, initialized, ts;

                initialized = false;
                ts = new Date().getTime();

                defaults = {
                    scope: scope,
                    ts: ts
                };

                function init() {

                    // get previous sibling for appending.
                    element.attr('_ts_', ts);

                    options.before = prevSibling(element, ts);

                    // save visibility attrs to object.
                    options.visibility = {
                        disabled: false,
                        readonly: false,
                        ngHide: attrs.ngHide,
                        ngShow: attrs.ngShow,
                        ngIf: attrs.ngIf,
                        ngDisabled: attrs.ngDisabled
                    };

                    // disabled does not contain value
                    // if preset set to true.
                    if(attrs.disabled)
                        options.visibility.disabled = true;

                    // readonly does not contain value
                    // if preset set to true.
                    if(attrs.readonly)
                        options.visibility.readonly = true;

                    // save ref to orig input element.
                    options.input = element;

                    // hide the orig. element.
                    element.css({ display: 'none'});

                    // instantiate the module.
                    $module = $list(element, options, attrs);



                }

                // verify valid element type.
                tagName = element.prop('tagName').toLowerCase();
                if(tagName !== 'input')
                    return console.error('Invalid element, ai-list requires an input element with ng-model.');

                // get options and model.
                options = scope.$eval(attrs.aiList || attrs.aiListOptions);
                options = angular.extend(defaults, options);

                // define the source & model data.
                options.source = options.source || scope.$eval(attrs.source);
                options.model = ngModel;

                if(undefined === options.source)
                    return console.error('ai-list failed to initialize, invalid model.');
                init();

            }

        };

    }]);
angular.module('ai.loader.factory', ['ai.helpers'])

    .provider('$loader', function $loader() {
        
        var defaults = {
                name: 'page',                                       // the default page loader name.
                intercept: undefined,                               // when false loader intercepts disabled.
                template: 'ai-loader.html',                         // the default loader content template. only used
                                                                    // if content is not detected in the element.
                message: 'Loading',                                 // text to display under loader if value.
                delay: 600,                                         // the delay in ms before loader is shown.
                overflow: undefined,                                // hidden or auto when hidden overflow is hidden,
                                                                    // then toggled back to original body overflow.
                                                                    // default loader is set to hidden.
                onLoading: undefined                                // callback on loader shown, true to show false 
                                                                    // to suppress. returns module and instances.
            }, get, set;
        
        set = function set (key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        get = [ '$q', '$rootScope', '$helpers',  function get($q, $rootScope, $helpers) {
            
            var loaderTemplate, instances, loaderUri;
            
            instances = {};
            loaderUri = 'data:image/gif;base64,R0lGODlhMAAwAIQAAExKTKyurISChNza3GRiZJSWlOzu7FxaXMzKzGxubPz6/IyKjJyenFRSVGxqbPT29NTW1ExOTLSytISGhOTm5GRmZJyanPTy9FxeXMzOzHRydPz+/IyOjKSipElJSQAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJCQAeACwAAAAAMAAwAAAF/qAnjmTpAcQUINSlKBeFBAsGmHiuHwX0bMCgEPiAWA66JO4QuAyf0EsAo1Q2GD+o9vlgNKq4CmRLhkIcYJLAWW4LL4I0oKDYXjKdicZR0Uw6GWxQCgU3SnRaAxwHhiYABxwDdU+ESgKTQxQCjUoRAhSDcTkVgkEKEl9pIw0SmEEXaCYNY0MKC5yqJwtZQhCpJAyUorkml08MJRi8QLbEOguuGw9UIxJPAbjOIwABTxIjB6UbFL/asqBvSB4FT8PmOMZCBSe0QQPZ7yMR9UAQKMsbFuRLwmHIAwILhlxQNxBHA3ELuglBgK+hhwgIhkjgt6GDRR0dhmRAF8TdRzWZ8cRpOIkjgcEnFViaqNAmpkwSBLgMWXlzhEshD0gCmdBzxIRMGYZ4LOohZC9rEys2BJBUiISE6Yo+HLKgAkAORQsKUUAAwIAhECLc3DfkngcL7W7GC2JBBAZx5FhGELrhAjUPUIVg+8jNGwkM0ZpZhFbrrwi4tUxqEwBwQ90SsyjdMgdgQuUB5UY4ELdBQYDQYCJIVBgLXjQgmtSm/hTq0Ot+iyo+4gDhdiUlc24DuYCggwANFfoIAGRgCyGpJda4md5XshIHHKk/GWCT2BXh0xVYQJ0LQxPtwwMwHHjAgo82DwYUWE8YoQQWbGJkuFo2VwgAIfkECQkAKAAsAAAAADAAMACFJCIklJaUXFpczM7MPD48hIKE7O7sNDI0tLK0bGpsTEpMrK6s/Pr8LCosnJ6cZGJk5ObkjIqM1NbUREZE9Pb0PDo8dHJ0VFJUJCYknJqcXF5cREJEhIaE9PL0NDY0zMrMbG5sTE5M/P78LC4spKKkZGZkjI6M3NrcSUlJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv5AlHBILKIUD87iA+kwABjM6FDZKIzYrFYQkFBE4DBgTMY0PBOtGitYdMJwMHk+xhzSa/XF8Y3H6YAAHld5RiUSfomBdBgIJYVEBW+JfotzJiIdBZAKAQyUmQMkHBYJBKceIxh0E2EMAYRqnpQnJgKxRRMTHlFQA3CvawWffhAFuGoTBBgcfgybWSWTwAgXkEQTC31wHQlYF4hxDBHI1yERxHAS1kUOztDXWAXbYQ5FGvQi4/Fq6HEUGogg8LOgHL8hIRb4QTBEwDQwENgdzHIBQpwOAoQE8ANvYpZhcQIcCRfmhEGPCEmCkYAkXwSUazDBofAgwsWMMLVceCgigv5COB9O5kQR4kMcBCpFkBiqhkScARbhdGRapECcJnEsUM0C4p+fR1sNgQoDNiyRB37yaTVLpOvMqGE4sCXSDA6EX3CWzhXiVN1AoEJzKsAbBoFNbjjZ7owToUQ+E3tlunqg4EQcCSHYhkhqEkUGjmxBwskgRAPPiGFDwAXTIaCQv3AKUlXwEw7DIRrSgdnH1B8w10M+i5s6cZ4f0kXAOSPnUQGHfCJOSCSSgKe+BdMhJUzUTYvoqwUyFwpRYLUr4kVmJZJg66QCASYk6HYlck2n+dw+kChgoUQJCwWQMIABoLwSWCTWjaVgJuipkUBSC4JyQlnx7IFfhK5kkB0/GiC4gSE3CySWkwAZeLEgBScEIOJsNSHAxCQd3GUYZfEEAQAh+QQJCQAqACwAAAAAMAAwAIUkIiSUlpRcWlzMzsw8PjyEgoTs6uw0MjS0srRsamxMTkz09vSsrqwsKiycnpxkYmTk5uRERkSMiozU1tT08vQ8Ojx0cnRUVlT8/vwkJiScmpxcXlxEQkSEhoTs7uw0NjTMysxsbmxUUlT8+vwsLiykoqRkZmRMSkyMjozc2txJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/kCVcEgsqk6PDgMEoYwAmQzpUOGcjNisVhCYLDDgMGBMzjQ+Ea0aK2BQwnAweT7OHNJrtcjxjcfpgAAfV3lGJhN+iYGADRyFRAVviX6LgBkEjycBI5MYFAMlHRYJBKUfJBmVgoRqm5MpKAKsRRERH1GLH2sFnH4GBbNqEQSpgZhZJpJwIwgKj0QRqJaORiKIcSMSwc+2xXMZeEQOfiMFz1oElrpEG31h2edqH4HhKgh+DNvxQ7aAJEMClIExIGKfMG9jQlwQEsCPOYNq0gEg0QEChgBHroWZ4AyilmF8NiJxBwaFxzUo4ix4ICEOBQEn1VwQiEECgzgg9MUUcgJE/hwEGsGU2KmmRJwBFuE8JIqlQBwDNC0wzRJCpR8TU7GY6BQGa9YiD/yQxCD1K5GqcBYkDdPBLJEOTwfEGepWiFE4A+7ByVn3hFw4CFrCobDQrQAPcSSYGGvSreB3D06kiMPRrILJcFJc0eDQLK84GoRsoAmh4FQFa8FQ2DBEL5x8TE/c/Mmu1zsJTCXYBjOCNRHO2JZ6LDAWQ+gi1shpg3iiQ/EUposkoIlhBIPozxTMdplAy2c/EAp0zKOgQOp3wrG4SjQhls4TAlBM2P0O4xpN9AeDKFHAggkTFhRQwgCITTJCADoZEQlXDCZCQXp5JBBUg1yl4FU8e+RH4TsaJmC3zwZubDgYAzARJYAGXjS4QAoBlJgVEhIgwIQkFECQlwSRnRMEACH5BAkJACkALAAAAAAwADAAhSQiJJSWlFxaXMzOzDw+PISChOzu7DQyNLSytGxqbExKTKyurNze3Pz6/CwqLJyenGRiZIyKjNTW1ERGRPT29Dw6PHRydFRSVCQmJJyanFxeXERCRISGhPTy9DQ2NMzKzGxubExOTOTm5Pz+/CwuLKSipGRmZIyOjNza3ElJSQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAb+wJRwSCymFBDO4iPqNAAYDOlQ2SiM2KxWEJBQRuAwYEzGODwTrRorWHTCcDB5PsYc0mv15fGNx+mAAB5XeUYmEn6JgYAOG4VEBW+JfouAGASPCgENkyMdAyUcFgkEpR4kGJWChGqbkygnAqxFExMeUYseawWcfiIFs2oTBKmBmFkmknANCBePRBOolo5GF4hxDRHBz7bFcxh4RA9+DQXPWgSWukQafWHZ52oegeEpCH4L2/FDtoAkQwKUgRHhbJ+WCd7q4Angx5xBNeno6FJwLQwKfQ/54SozAYI7MBEyronIMUKcDgJEQkwoaEGcDxhVpogmsSKYEjLl0cEgIo7+w5xYSNYROMIC0CxCofgxcRTLBkBLmxp5SudjUalFkvKMwwErEa0D4uD0KqTECAYLAmgIcQ8OTLIKwsJZYBIOSrIXDMQ5YcLqCbInsEFQgCKOhBBYQxSGczFFhoZYecXJIEQDUYJNQ/S0q2FI27kx4ylwGQcBu17vQuaMgBpMg85EHmP7mbGA1RGUi1gjp+2hAg63URQskoDoiAYLhj8LQfpkAi2SfRVAXChEgc2z17hKJCEWRgUCTkho/S5AHk3k7X4oUcCCCRMWCpQYoHdSgwChIRnvxD9MB9qFJGBTf/2hwNQ+e6RH4DIZKLePBm4seNICKeUkQAZeEEgBCgETVNgUEhEgwIQkHYgwAAIRDHZOEAAh+QQJCQAnACwAAAAAMAAwAIUkIiSUlpRcWlzMzsw8PjyEgoT08vQ0MjS0srRsamxMSkysrqwsKiycnpxkYmTk5uSMioz8+vzU1tRERkQ8Ojx0cnRUUlQkJiScmpxcXlxEQkSEhoT09vQ0NjTMysxsbmxMTkwsLiykoqRkZmSMjoz8/vzc2txJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/sCTcEgsnhSOzcLzMEQAl0voQNEojNisVhCQcErgMGBMvjA6E60aK1gYwnAweT6+HNJrtaXxjcfpgAAdV3lGIxJ+iYGADBqFRAVviX6LgBcEjwoBEZMlBgMiGxUJBKUdIReVgoRqm5MmJAKsRRMTHVGLHWsFnH4PBbNqEwSpgZhZI5JwEQgWj0QTqJaORhaIcREQwc+2xXMXeEQNfhEFz1oElrpEGX1h2edqHYHhJwh+C9vxQ7aAIUMClIF54Gyflgne6uAJ4MecQTXp6OhScC2MCX0P+eEqM8GBOzAQMq6JyBFCHAMCREJMKGhBHA8YVZ6IJrEiGBEy5dG58CCO/sOcWEjWEViiAtAsQqH4GXEUiwZAS5saeUrnY1GpRZLyjLMBKxGtA+Lg9Cpk3pwQ9+DAJEvzrEk4KNmy7DDCKgmyFHZOUGAijgQQWBWwBHcCQ0OseSUKyUCUYFOEeoekhZMPaD86/4Zk6PUuZM4Jlo4NMYztZ8ZIAhQXsUZO20MFG/qMKEbYSAKiJSIsKHgOhEs4AaCINsIr0S/AhUAU6OmnwXAsrhJJiIVRgQASEjgvC5BHk/aTHkQUqDBiRIUCIgbgfhcgZpFIneJ3MmC6UAKb8uWbYLpvz/f82GDAm0EZuAHgSQuklJMAGHiRHwcmBKBgU0hAgAATkhjwwAAIB0DggHtGBAEAIfkECQkAKQAsAAAAADAAMACFJCIklJaUXFpczM7MPD48fHp8tLK09PL0NDI0bGpsTEpMrK6shIaELCosnJ6cZGJk5Obk/Pr81NbUREZEzMrMPDo8dHJ0VFJUjI6MJCYknJqcXF5cREJEhIKEtLa09Pb0NDY0bG5sTE5MjIqMLC4spKKkZGZk/P783NrcSUlJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv7AlHBILKYUD8aCAjlEAJkMCVHhKIzYrFYQkHxO4DBgTM40QBOtGitYHMJwMHk+ziDSa/XF8Y3H6YAAIFd5RiYSfomBgA0chUQdb4l+i4AZBI8KARGTJwcDJQwWCQSlICQZlYKEapuTKBgCrEUTEyBRiyBrHZx+EB2zahMEqYGYWSaScBEGF49EE6iWjkYXiHERI8HPtsVzGXhEDn4RHc9aBJa6RBt9YdnnaiCB4SkGfgvb8UO2gCRDApSBgeBsn5YJ3urgCeDHnEE16ejoUnAtDAp9D/nhKjPhgTswIzKuichxRJwDAkRCTChoQRwKGFWmiCaxIpgSMuXRyQAhjv7DnFhI1hF4wgLQLEKh+DFxFAsHQEubGnlK52NRqUWS8ozDACsRrQPi4PQqZN4cEvfgwCRL86xJOCjZsgRhwioGshV2TlCAIo4EEVgVsASXQkNDrHklCtlAlGBThHqHpIWTD2g/Ov+GbOj1LmTOxN+ODTGM7WfGpGPWEbFGTtvDCaC/1RuSgOiJCAsKnru8U7QRXol+AS6koAJLMqqzuEokIRZGBbA3AkqeRRNnPwcolOhgwYQJCx1KDLigCs2jSJ3SO1iUgXqeBDbTw5EQ6JLBPdflgzGLfHa8DW7oF0YBdZDg30MCaOCFfh60d6BKSIxgABOSHADBAAaM8MCDWQIEAQAh+QQJCQAsACwAAAAAMAAwAIUkIiSUkpRcWlzMysw8Pjx8fnzk5uSsrqw0MjRsamzc2txMSkycnpyMioz09vQsKixkYmTU0tScmpxERkSEhoTEwsQ8Ojx0cnRUUlT8/vwkJiSUlpRcXlzMzsxEQkSEgoT08vS0srQ0NjRsbmzk4uRMTkykoqSMjoz8+vwsLixkZmTU1tRJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/kCWcEgsshYQymFgAKEAGk0KYfEsjNisVrBZOTLgMGBM1jxEE60aKziAwnAweT7WINJrNYbxjcfpgAAiV3lGKit+iYGADx6FRB9viX6LgBoEjwsbKJMZIB0mFBcJBKUiKRqVgoRqm5MKJwKsRRMTIlGLImsfnH4GH7NqEwSpgZhZKpJwKCEYj0QTqJaORhiIcSgNwc+2xXMaeEQMfigfz1oElrpEHH1h2edqIoHhLCF+B9vxQ7aAKUMClIEx4Gyflgne6uDZ4MecQTXp6OhacC2MAn0P+eEqMwGCOzANMq6JyLFBHBACREJMKOhAnAEYVbKIJjFCHBMy5dHRYCCO+MOcWEjW+ZjhAtAsQqH4UXEUiwdAS5saeUqHqFGpRJLyjEMBa9adNuHg9Cpk3pwU9+DAJEvzrEk4KNmyFKGC6AmyFnZOWKAgzooSWBewBMdCQkOseSUK4SAwA8GmCPUOSQsnH9B+dP4N4dDrXcicib8dG2IY28+MScesI2KNnLaHE0J/qzckQeMMKA4UPId552gjvBL9AlxogQWWZFZncZVoRSwtC2JvBKQ8i6bOfkhYEEHAg3dTD5DPQfMo0qQKqippqJ4nQUU4BdIHumRwD/YMsuULoh2PgxswEehXRwr8PSSABCsEIF8U5EkV3SmoFBOFFGgUqEUQACH5BAkJACkALAAAAAAwADAAhSQiJJSWlFxaXMzOzDw+PISChPTy9LSytDQyNGxqbKyqrExKTOTm5CwqLJyenGRiZNTW1IyKjPz6/ERGRDw6PHRydFRSVCQmJJyanFxeXNTS1ERCRISGhPT29MzKzDQ2NGxubKyurExOTCwuLKSipGRmZNza3IyOjPz+/ElJSQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAb+wJRwSCymFg9OyMMwSACXywhB2SyM2KxWEIB0UOAwYEy+ND4TrRorCBnCcDB5Pr4g0mu1xfGNx+mAAB9XeUYlEH6JgYANG4VEBW+JfouAFwSPCwESkygGAyQcFQkEpR8jF5WChGqbkyYnAqxFExMfUYsfawWcfgwFs2oTBKmBmFklknASBxaPRBOolo5GFohxEhHBz7bFcxd4RA5+EgXPWgSWukQZfWHZ52ofgeEpB34h2/FDtoAjQwKUgWHgbJ+WCd7q4Angx5xBNeno6FpwLYwJfQ/54Soz4YE7MBEyronIMUIcAwJEQkwoKEQcDxhVpogmUUMcEjLl0bnAII7rw5xYSNb5iKIC0CxCofgpcRTLBkBLmxp5SoeoUalEkvKMwwFr1p024eD0KmTenBH34MAkS/OsSTgo2bL8UILoCbIUdk5YYCIOBBFYF7AElwJDQ6x5JQrJIBAFwaYI9Q5JCycf0H50/g3J0OtdyJyJvx0bYhiOhlIyQ89ZR8RaGA0NxlCod26Bao5YErxREJvMnX0LEAS6pKUAh+EEYtIilmvN7TkNZmOsRaF3INYHzS4y84HAhu+mGrCUSBvdeFXooWAvROx8ekujz3V7rwqNyGjuVUmJf/9W/jIX2CdVLaegUkwUUqBRnhpBAAAh+QQJCQAmACwAAAAAMAAwAIUkIiSUlpRcWlw8PjzMzsx0dnQ0MjRsamz08vS0srRMSkyMiowsKiysrqxkYmT8+vycnpxERkTk5uSEgoQ8Ojx0cnRUUlQkJiRcXlxEQkTU1tR8enw0NjRsbmz09vTMysxMTkyMjowsLixkZmT8/vykoqRJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/kCTcEgsmhSOReMjQTwAl4vIQMkojNisVhDQIEjgMGBMvjA4Ea0aK2h8w3ASeT6+GNJrtQXiifvpgAAcV3lGIxp+iYGADBmFRBNviXGLgBcDjwoBD5MkCAQlExUHA6UcIheVgoRqm5MaIQKsRRERHFGLHGsTnH4SExaPEQOpgZhZI5JhDwnBj0MRqJaORhaIcQ8Ls88mtsVzF3hEEH4PE9xZA5a6RBh9cNnoWhyB4iYJfg3b8tD0dCJDBCgjIcEZPywRvtXBE8DPuYNa1NHRpeBaGA0gIGpJqDCcg3dhQmhUQ4FOuAVxEAgYqSWDQkEN4nzYx1JItIkWwZSoOc+k3oQ4D3kakVhmYAWhWIjW8TMCqZEMgJg6LQKVDkgwR6cOUQrlJ5wNWoeUBFciwAYMBgSFFeKPzJR/NGvenCNibBl7SBNOjACI3VS7CyMwMBlX49y7JtrWOYaUq9puL8PlHQxOnAhAIgqjU5D2HxG+Jv2OBLy4iGIyjCE6fvwZ10TNaiKQXojFpaU78mwFujTv5WLY0AZQ7rvmNLgBEeLWojCc+BrdlcxwGJChuikGvuegeURMlffdogsRy/7dUupn0MtX2g4xGnlVUs63v/W+zAX2eW2JQFUsihQ0eK0RBAAh+QQJCQAnACwAAAAAMAAwAIUkIiSUlpRcWlzMzsw8PjyEgoS0srQ0MjT08vRMTkxsamwsKiysrqxkYmRERkSMiozExsT8+vycnpzk5uQ8OjxUVlQkJiRcXlzU1tREQkSEhoS8urw0NjT09vRUUlR0cnQsLixkZmRMSkyMjozMysz8/vykoqRJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/sCTcEgsnkQNDYM0QUQAFgvoQMmIjNisVhDAdErgMGBMtiw4Dq0aK2AgwnAweT62HNJrtUfyjcfpgAAcV3lGIRh+iYGACxmFRAVviX6LgBYEjyIBEZMlCAMmGh8KBKUcIBaVgoRqm5MYIwKsRQ4OHFGLHGsFnH4TBR6PDgSpgZhZIZJwEQbBj0MOqJaORh6IcREPs88ntsVzFnhEEn4RBdxZBJa6RBd9YdnoWhyB4icGfgzb8tD0dCDQKpCAM8EZPywOvtXBQ2GMiA1gzh3Uoo6OLgcL5hDQNlFLQoXhHABi1zEdnXANwdkrWSSDQkEH/q1kCQ2ERZtzSNI04q/Mx8tjO3me/BkUCzFwgIAWhaZqjNKl3SzRebq0os+pUIlYrYOTjE6oPcdMkZm1W1exYaHM3JnQokiLZVOWqZUR3D6W0U6mCZuKKsutY9i1VVl08NwhZ8Xe5WcLEECmJ79OBAzlaVqnfwNJ/jhycR4HcgkbOXryjrzGlvwKoVyHgGdaBOqOXHO5DAEHi2tRkD17jbdKZjgQyEDc1IKXbh/daso8MjpiyJunZlxbute1z6JFbypF9elb28FZQAO11ilUxaJIQYM9SxAAIfkECQkAIAAsAAAAADAAMACFJCIklJaUXFpcPDo8zM7MhIKE7O7sLC4sREZEdHJ0/Pr8zMrMZGJkLCosrK6sREJE5ObkjIqM9Pb0NDY0TE5MJCYkpKKkXF5cPD481NbU9PL0NDI0TEpM/P78ZGZkjI6MSUlJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv5AkHBILII4jIhjAdEoAJXKYTN4cIzYrFYQyGg64DBgTK40JgitGitwfMPwDnk+rmzS63VAEu/T/wATV3lGDw0WfX6AdA0PhEQYFQAHBolwi38VGI8cE3MXcRoEFgUJHg8YGBMHkpiCeZ50DmAZHwKDRggIE1GLE2sYgAMZBRSPCJGLm1kPrXQHuI8gCKyZjrkNgGjSRciAFXhEA4DL3Ea8dBW/RA/a5lrodOEgG38H8+9EFNVzB0MIzurgy0cEYDo84+iUI4glGJ1fCLLNAcdQC7WDCP6sq5jFYRkECT9ytBgwUL2JA0cKuThn1UOV8NKVXAiTSLw6M2s2TPeHprbOaZjI+NSZkeecoTU94lT4s4hSKAdeNh0Si8yUZylVsrRaVeDUaSXRaPwaUmDEdNFgbvXaVRLSik8DrSxJsaZBlEOiPkvLcJe9gpk2coyrqUhXoSPjyu3W6yHfY2VFGkmW7s47v5neKoaC4TEWZBLHqjk8EQMCz7oGhBatZlfJiWcwPJidakKD1y2znsMdtLc6c5F4986cD/PwoNv68jte5sBbc66Fl1Gnu++uA6xaRZGCprqRIAAh+QQJCQALACwAAAAAMAAwAIMkIiQ8OjwsLixERkQsKixEQkQ0NjQkJiQ8Pjw0MjRMSkxJSUkAAAAAAAAAAAAAAAAE/nDJSetSJSRxDgCdkASFYp1oOgTd577uQRhDap9D4sE8fyS1m23VKxoNJqGlQDA6e4SCkoLYPa8xxFRhcHYMBoQYAW4dk7Zu8UALWhQDg5lnuCHWyOmgWtSiClYvAm5TCwMcPlIWA010hIUXcj6PCwE9dZAndzBsFQWXmSmSMIQJPIOhKAqIghMDgSCUqa6wB0GWMH6zKJsvdYycsrsSh8EDdMM2vR+2uDHCyYawBqYvttEoxb4CMJjYJ2oxsLrfFaPM4+WanDzk6sRX7u/H7C/y6ssg6e9UnNy+/CiE+yACBqqA2lwIGBgroLRu9AAGdMZsADBraMolrLhgoId7fsnyAcD0Kpi6ktbc/BOUcVicUxQixvAW0oc7hh9AQhI5ctEcF3lSEZmkCRYIIKFe2kzBEwSClioQNEKWxsgBBAOgElsxleqQcz5mIChAVowBAkZ9QTOXFgueTFXaus0iFOdcoGuFHJJrVYDOTHF+rmGTV2gcARx2dDiw0CKkCAAh+QQJCQAkACwAAAAAMAAwAIUkIiSUlpRcWlzMzsw8Ojx0dnTs7uwsLiy0srRsamxERkT8+vysrqxkYmSMiowsKiycnpzk5uREQkT09vQ0NjRMTkwkJiRcXlzU1tQ8PjyEgoT08vQ0MjTMysx0cnRMSkz8/vxkZmSMjoykoqRJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/kCScEgskj4SAudgsQAWm0iH4bh8jNisVkFoAr5gkHg8wQQE2jRWwXGC34CxXLxhXNRqLnwfn88nEBV4WBIPfHt+fhEEEoNEGW6Hb4lzCV8Zjh8UkgBNFBQZCiEeGiMDG3MIbxRXapuHFhQKClkVAiIYdK9gFGoZsBSCgxUaEQV8mFkSkW8HtI5DmnwWjUYKhnuy0EV6exatRAR8vdtYkNlFEuPlWr97z0Ice87sWQq7YAdDCsyd8PXW+ll4Jg5OMoBZ3K0icQ3OQIRbDjichQ5iu4kFwTy0aK8fBXlvNnK0JnFVSV4jteDr1O9gyiIUmHl54/LlEIVf+gGoaZMhuqdLPbl5Mxj0kcOWRW86PPmFXNKVB0Dm+2dTAVMAB1aK7MkPjqyKQTPmnIVNI7iXVieSwOeEJ0ecTYV0DUnV4lyN8K5iPQvx3jwiCrw5tQi3U82VQAmv4zZzFV9o3dQaOeeQQ108fr25FVI4Z4bH9jKU9epKkoVQoBlyGU06T0zTD0BJmJ0hA4UHOlddxvL6p++QgwdByv3b4WbXxTlpQ2iVOCcLB46Xu9fYdKzdfe8dYOKmCXRZ2LEEAQAh+QQJCQAmACwAAAAAMAAwAIUkIiSUlpRcWlzMzsw8Pjx0dnT08vQ0MjS0srRsamxMSkyMiowsKiysrqxkYmTk5uT8+vycnpzU1tRERkSEgoQ8OjxUUlQkJiRcXlxEQkR8enz09vQ0NjTMysx0cnRMTkyMjowsLixkZmT8/vykoqTc2txJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/kCTcEgsmhSZyiF0uQAghkenscAojNisdlJpAr7gkXi8kQQE2jR2cnCC34CxXGxoYNRqLnwfn883ERZ4WBkMfHt+iRIJg0QEbodviYkGFI0KHJEATRwcBBMiHhQkAwaTIxABV2qZhxccExNZHwIgJRCJqWoErhwfjR8UD7mWWRmQbyGyjUMfCLhzBoxGE4Z7sMxFHwsbfhKCRRV8HNlZFNByEUUZ4+VaIOhiG3dDB3vK7rMNfghDE8ibluXD8mHYmAcalomDQ2BgGgpiSmj4Qq4anAsCHRr5QEIAJAaxrmlMw+sNxoVgMI7cApCDPZMZVxKZEAJOiJpvyMnM0goM0BOGO7OUTAmwYVAjQ78ABGD06ExNX5o6FTJhT9Gpji5exSok6SacYHRy7fklxEufMYPStEk2INd/cGCJxIpSaSxrKVcdXQvTBFknUnd6BaATbl+1AFUKAetT78gJbQGEeHpR7MjBFwJHZrpyMGFqXuI6zqbHaloTj6weOJ1nc2YtnjcRGL2FAN64rCJlnkCbKpfbuFsvTcnAU4bjBAhwYDA8LGsjHJpD1W150CPp000GbgQ5O1RsDmlidxVi+0DIoTVxeh4e8s3QTS6EgMXeSBAAIfkECQkAJAAsAAAAADAAMACFJCIklJaUXFpcPD48zM7MhIKENDI0bGps9PL0tLK0TEpMLCosrK6sZGJk/Pr8nJ6cREZE5ObkjIqMPDo8dHJ0VFJUJCYkXF5cREJE1NbUNDY0bG5s9Pb0zMrMTE5MLC4sZGZk/P78pKKkjI6MSUlJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv5AknBILJIUmInhY7EAHIhIhyG5KIzYrBYyaQK+4JB4zMkEBNo0FmJwgt+AsVyMYFzUai58H5/POQ8VeFgYC3x7fokZB4NEA26Hb4mJCAWNChqRAE0aGgMQIBQFIgQIkyEOAVdqmYcWGhAQWR4CIxmTqWoDrhoejR4FEYkOllkYkG8fso1DHgkOfgiMRhCGe7DMRR4SHH4ZgkUTfBrZWQXQcw9FGOPlWiPoZHdDBnvK7rMMfglDEMiby/Bh8SBMDgI0JMTBGSAwTQE/AUhUg2MhYEMjHm7JyaAAwrWLaUb8aaAQTEWQWgSYkiOh3puTKNcQmJPgAxxyMbOImEPgH+PDnFgeyongEyiWDX/2/DRKBIQfpUyLOJ1TNOoQpHI4VLVKgsJKMRFsvsHJNZMFBRQkBHAJ5p5VCGLBGGhl0qJRfzc93uRa8ouFT9ZMrrob168supsALAW6a6/EfzBz4n0ZsPCXD4NBQkB8mYjel2RBNn65mATnL6XxjR5LzcvNzNn07Ins6N8mA3YHbebzV8tq0rC3DAjsWMtpk5+CC4k1gXjxLRpsm1zgCYP1AQM0LJAOBtug6JrC8w496BF38RRT6z6Ofmzu2Ezav/ygHt9m15o4vde8+QMTN01Y8AEs+2URBAAh+QQJCQAqACwAAAAAMAAwAIUkIiSUkpRcWlzMysw8Pjx8enzk5uQ0MjSsrqxsamxMSkz09vScnpyEhoQsKixkYmTU1tScmpxERkTs7uw8Ojx0cnRUUlT8/vyMjowkJiSUlpRcXlzMzsxEQkSEgoQ0NjS0srRsbmxMTkz8+vykoqSMiowsLixkZmTc2tz08vRJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/kCVcEgsqhQdysGUyQBGKcMAUdoojNisVkJpAr7gi3i8gEQE2jRWcnCC34CxXJxCbNRqLnwfn88XDBZ4WB0OfHt+iRAJg0QEbodviYkpHo0KH5EATR8fBBInFQ0kHCmTFyMaV2qZhxkfEhJZIgIYKCOJqWoErh8ijSIeBrmWWR2QbyayjUMiILhzKYxGEoZ7sMxFIiULfhCCRRR8H9lZDdByDEUd4+VaGOhiC3dDB3vK7rMIfiBDEsibluXDImJCNDQqxMEhMDBNAT8aVFSDk0FgQyMiIMyBoEDCtYtpMPx5oBBMRZBaBBiUU8Lem5MoCQ6YA8IEHHIxs5CYwwEg9sOcWDzMMeATKJYQf/b8NErkhB+lTIs4nVM06hCkchZUtaqiwVCbb3By3SkHgksw+KxK4ECzlUmLRlXOKeHxJleRckY8mPhyldGMc1BccbsJwFKgHuJdiCDkH0W4IEUMk5OCngqwyfxG3keTSN2XYkEWUDzCshDCYA4PfBRgDuMi/wAC+KA5m54vJcagAFfk0Z4MByDjkYA6BJQTWnjxyUCg9hYC1uBIKKYF9ctPzhtzif4xzwfZJh146kCeAIEPDsCDwTbou6b3y0MPeqQePkXVjYjbf89+oAQm+72UFkrEefEeJ8KBFMsHJjDhRhMZmABLglkEAQAh+QQJCQArACwAAAAAMAAwAIUkIiSUlpRcWlzMzsw8Pjx8eny0srTs7uw0MjRsamykpqRMSkyEhoT8+vwsKiycnpxkYmTk5uTU1tRERkTExsT09vQ8Ojx0cnRUUlSMjowkJiScmpxcXlxEQkSEgoT08vQ0NjRsbmysrqxMTkyMioz8/vwsLiykoqRkZmTc2tzMysxJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/sCVcEgsrhYdC8Kk0QAan4hKROIsjNisdmJpAr7gknhckWwE2jR2gnCC34CxXPwRcdRqLnwfn88rDxh4WB0OfHt+iRIJg0QEbodviYkfHo0LIJEATSAgBBMoFwwnAx+TJQ0BV2qZhxogExNZIwIZKQ2JqWoEriAjjSMeEbmWWR2QbyayjUMjBrhzH4xGE4Z7sMxFIyQVfhKCRRZ8INlZDNByD0Ud4+VaGehiFXdDCHvK7rMifgZDE8ibluXDMuJANDQrxMEhMDBNAT8BVlSDo0FgQyMjJMyRsGDCtYtpMvyBoBBMRZBaBBiUQ8Lem5MoCaqYY8AEHHIxsyiYMwAg/sOcWDzMieATKJYQf/b8NEoEhR+lTIs4nVM06hCkcipUtbqCwVCbb3ByPbHRJRh8VicMoNnKpEWjKueQ8HiTq0g5DSBMfLnKaMY5Ka603QRgKVAP8UpsEPKP4luQI4bJ+UBvBdhkfSHvo0mE7kuxIEkkblBZyGAwhgd66DZncZF/AAGAyJxtAQPWclKAK/JojwYEj/GM2BxtGhZefDQQoK0lmOQ5DYppOf3yE3PGAkhozBUxD4jYJh146kCeAAEQDnZOSnUdy3dNkbD6qVTuEXhNGhKlQJFvAnX4AFCA1wa79ccEgGA8VEIdCKHknxfwTWBGg0DFAoIJTLjRhAYmBHxSThAAIfkECQkAKwAsAAAAADAAMACFJCIklJaUXFpczM7MPD48hIKEtLK07O7sNDI0bGpsTE5MrK6s/Pr8LCosnJ6cZGJk5ObkREZEjIqMxMLE1NbU9Pb0PDo8dHJ0VFZUJCYknJqcXF5cREJEhIaEvLq89PL0NDY0bG5sVFJU/P78LC4spKKkZGZkTEpMjI6MzMrM3NrcSUlJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv7AlXBILK5OHAuClMkAGB9IaiHZnIzYrDZiaQK+4JF4XKFoBNo0NoJwgt+AsVz8WWzUai58H5/PKw4ieFgcDXx7fokUCYNEBG6Hb4mJHwWNJyCRAE0gIAQRJhcdJQMfkyMMAVdqmYcZIBERWQoCKCoMialqBK4gCo0KBRC5llkckG8kso1DCga4cx+MRhGGe7DMRQoSFX4UgkUWfCDZWR3Qcg5FHOPlWijoYhV3Qwh7yu6zC34GQxHIm5blw6LgQDQ0K8TBITAwTYF4IwKsqAYng8CGRhRQmEPhRIRrGNOg+PNAIRiLIbVgMCVHgr03KFMSTDHHAAk45GRmKTFnAP5AhjqxFJgD4WdQLCH+7AF6lIgJP0ubFnk6x6jUIUnlVLB6dUUHojff5OzKUw6Fl2DwXY0woGarkxePrpwj4SPOriPlMHhAEeaqoxrnqLjydhMApkEfztEg5F/FuCEVDJPzgd6KsMn+Rt5Xk4hdmGNDSoDIwLKQwmAQDyzQbTE1Lzg1ZzvRobUcFeCKPNqTAQFkPAo4R5uGhRefDARkawk2eQ6DYlpQw/yk5UQtChDF6MoDAiBMDyUKXDARqgApg5NSKc/S/ZCCU/ArlXvkfSj8RCpM5Isg3cN95xrkth8TX2Tw3xh1IJQSfxlQBV8FKgSgYFARYNCBAQNAwFIUAwgYIMED62kRBAAh+QQJCQArACwAAAAAMAAwAIUkIiSUkpRcWlzMysw8PjyEgoTk5uQ0MjSsrqxsamxMTkz09vScnpwsKixkYmTU1tRERkSMiozs7uycmpw8Ojx0cnRUVlT8/vwkJiSUlpRcXlzMzsxEQkSEhoTs6uw0NjS0srRsbmxUUlT8+vykoqQsLixkZmTc2txMSkyMjoz08vRJSUkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/sCVcEgsrlAcyqGEwQBGKsMAEdGgjNisFkJpAr7gi3i8eEwE2jQWcnCC34CxXKxCaNRqLnwfn88XDCJ4WBwNfHt+iQ8Jg0QEbodviYkqBY0oH5EATR8fBBAmFR0kGyqTFyMZV2qZhxgfEBBZCgIpJyOJqWoErh8KjQoFBrmWWRyQbyWyjUMKILhzKoxGEIZ7sMxFChELfg+CRRR8H9lZHdByDEUc4+VaKehiC3dDB3vK7rMIfiBDEMibluXDosBDNDQrxMEhMDBNAT8ZVlSDg0FgQyMKHsx5gALCtYtpUvxxoBBMRZBaLJiSE8Hem5MoCQ6YA6IEHHIxs5CYswEg/sOcWB7K8eATKJYQf/b8NErEhB+lTIs4nVM06hCkchZUtbqiwxwPNt/g5LpTzgaXYPBZhbCBZiuTFo2qnBPB402uIuWMcDDx5SqjGeecuPJ2E4ClQAvEuzBByD+KcUEqGCZHBb0VYZP9lbyPJhG7L8eCjLB4xGUhhQGUGFDsYoducxoX+efmg8YFETZnQ/HazwlwRR4BUCBhzAgEwJkp6BxtGhYCGhIZKPBrUDDKc0a0zpJXUQoBuoegqPVgsRhdalBkMD9GxQASBSqYCFWAVPFJqcJnKbDylH9K2w2SgEb/FSjGCSbkIwID7Bl43gTJuaMBAv05eEEdCKEkwAQPHMDm3wInZJAhUCg4EAEIAxiwUhQbgBCBA/ppEQQAIfkECQkAKgAsAAAAADAAMACFJCIklJaUXFpczM7MPD48fHp87O7stLK0NDI0bGpsTEpMrK6shIaE/Pr8LCosnJ6cZGJk5Obk1NbUREZE9Pb0zMrMPDo8dHJ0VFJUjI6MJCYknJqcXF5cREJEhIKE9PL0vLq8NDY0bG5sTE5MjIqM/P78LC4spKKkZGZk3NrcSUlJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv5AlXBILKoUHQvCpNEAGp9IZUHiKIzYrHZiaQK+4JJ4TJFsBNo0doJwgt+AsVz8WXDUai58H5/PKQ8YeFgdDnx7fokSCYNEBG6Hb4mJHx6NCiGRAE0hIQQTKBcMJwMfkyUNAVdqmYcaIRMTWSMCGSkNialqBK4hI40jHhG5llkdkG8mso1DIwe4cx+MRhOGe7DMRSMkFH4SgkUWfCHZWQzQcg9FHePlWhnoYhR3Qwh7yu6zC34HQxPIm5blwzLCQDQ0KsTBITAwTQE/AVRUg6NBYEMjIyTMkaBgwrWLaTL8gaAQTEWQWgQYlEPC3puTKAlWmHPABBxyMbOcmDMAIP7DnFg8zIngEygWEX/2/DRKBIUfpUyLOJ1TNOoQpHIoVLWqgsFQDAIKLABRQh1XFTvlSNgnp8KqqCMG0CQxxwDCqBhWjiGBopucDFxFymkAQUGKjb+YjjgsJ8WVDX6KGS0Qr8QGIRxMyYkALueIYXI+0FNxwM+CtyAVsJXTbwiHyg1I5CQBe7QQyHMaSG7owa+cy0UwaMxNAnU2BQx8j0nRmUgCzYMXNAe2OvS0oJXFRPCQGE8w0Ll3YwmQXYyEDAKMD1FQS0J5XWoUkD/1ocIJDxdQhPJASq+fVOpl4QF0pxToRyXlJDCcgQyWkAIK+WDwQHkNitHABtOVw8ECBCRWWMddIAmwgQTKTUJBCgGAmJMCEJBwQAURaBbFAAeQUFg2QQAAIfkECQkAKgAsAAAAADAAMACFJCIklJKUXFpczMrMPD48hIKE5ObkrK6sNDI0bGpsTEpM9Pb0nJ6cLCosZGJk1NbUjIqMnJqcREZE7O7sxMbEPDo8dHJ0VFJU/P78JCYklJaUXF5czM7MREJEhIaEtLK0NDY0bG5sTE5M/Pr8pKKkLC4sZGZk3NrcjI6M9PL0SUlJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv5AlXBILKoUnQqilMkARinD4ADZKIzYrFZSaQK+YIx4vHhEBNo0VoJwgt+AsVycOmzUai58H5/PFwwXeFgdDXx7fokPCYNEBG6Hb4mJKQWNCiCRAE0gIAQSJhYeJBwpkxgjGldqmYcZIBISWSICKCcjialqBK4gIo0iBQa5llkdkG8lso1DIh+4cymMRhKGe7DMRSIQC34PgkUVfCDZWR7QcgxFHePlWijoYgt3Qwh7yu6zB34fQ7WtXzIsy4dFxIRoaFRoEHNAxBcCBNMUiIdBw5EHcihcGBjRiAiMch4ocNBNDoqOaVD8cQABIUotF0zJgbBPzoBVLz0OmPMB5P4YEjm1kJjDYZicYkGNFJhjQOYYC0mxhPjjx0RUIyZOjbF6lYgDPyWfdiUyVc4Co2M8jB3igSmHOUDXqhga8sOcm2sVvJXzoaWcFAm7xpwDwURYMSfHqpQzwoGCE3Me/Lr6cc6JKxH8IE06cU4EIRucijEALqgItHToqbA75wBOlApq8iWygeIICEEh2FYtJPOcEZsJFjgs5nORCz7H3H6dTYEH4hhOlCaSQLSYEQemA5P9dxqWzn4MFJiMJxhq5cGNaKA45gEKAcyHKKj1gD0qi2oUrD+VYgCJAhaYEEoBpBw0SSrxZVGAdVo1SEd6aiSQnINancBVORcwYB+F1ydFoF05GxzAoIN1BIaSABE8AB1YJ2hgYlAjQfDBAE3RYQAHfTmWTRAAIfkECQkAKgAsAAAAADAAMACFJCIklJaUXFpczM7MPD48hIKE7O7sNDI0tLK0bGps5OLkTEpMrK6s/Pr8LCosnJ6cZGJk1NbUjIqMREZE9Pb0PDo8dHJ0VFJUJCYknJqcXF5c1NLUREJEhIaE9PL0NDY0zMrMbG5s5ObkTE5M/P78LC4spKKkZGZk3NrcjI6MSUlJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv5AlXBILKoWnMqhhMEAGh4RiCHRLIzYrHZSaQK+YJJ4TIlkBNo0dnJwgt+AsVzsYWjU6tEHzo/P5xQPF3hYCRsXfXB/ixEJhEQFBiQKiW+Lix4FjwsBDWMPcE0fHwQTJxYdJgMelyQNAVdqnXMjXxgfExNZIwIpKJ5/r2oFFH8RGKWPIwUiiw2aWSescw0II49EFwjAch6ORhcRwRLX2EQLEsVzEYNFD8HQ5kYF3J9FGupjDRLyWhL1JCjcGYLgD4NY/YwsYPAHwRAB08aIaJcQy4Vm3dCoCPAnXkUs9OYEOCJODgqEH42MKDkmwgII+cTwS6klBSAIEuZ40EjTYv5EmQzlgEDZk8gIEHMQbJhjoqgWE3M2YBzj0SmkOSJikrBgFUsIQH9OdDVyotUYsWOJQPijlWvaIV/lUJgqpsPbIR2wLpXT9K4KqHI2FBRK1OqCAUlzZrx74ScJCSe0prhrU04DCAtQrCvXdeWckyoydEwbUk4GIRocT+xMl4SHgSoGyznodGFDIhoA7nP6jxpsIaKpVU1I7M/pIuHGFd7UQSsJFBSJJHDsikF0ZUF1fgMJUIyIApzzMHM2vMgsRikELD/SK0J3VyPVcHpPB4SJAhZOnCqgStKlV+vNQ51ZBLpWXhoJsFQggSigJc8FD9C3oCsZXCePBgwMSGAdPBzRJEAGETjHFgoBdFgbTgiAIMI0UQyAgASYmRMEADs=';
            loaderTemplate = '<div>' +
                                '<img src="' + loaderUri + '" />' +
                                '<div ng-bind="message" ng-show="message" class="ai-loader-message">test</div>' +
                            '</div>';
            
            $helpers.getPutTemplate(defaults.template, loaderTemplate);

            function ModuleFactory(name, element, options, attrs) {
                
                var $module = {},
                    body,
                    overflows,
                    htmlContent,
                    contentTemplate,              
                    scope;

                // set global name if not passed.
                if(!angular.isString(name)){
                    attrs = options;
                    options = element;
                    element = name;
                    name = undefined;
                }
 
                // if no element can't create loader.             
                if(!element)
                    return console.error('Cannot configure loader with element of undefined.');

                attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

                options = options || {};
                scope = $module.scope = options.scope || $rootScope.$new();
                options = $module.options = scope.options = angular.extend({}, defaults, attrs, options);
                $module.element = scope.element = element;
                
                if(options.name === 'page')
                    options.overflow = $module.options.overflow = scope.options.overflow = 'hidden';

                if(instances[options.name]){
                    $module = undefined;
                    return $module;
                }                  
       
                body = $helpers.findElement('body');
                overflows = $helpers.getOverflow();
                htmlContent = element.html();           
                contentTemplate = options.template;                
                
                if(htmlContent && htmlContent.length){
                    contentTemplate = htmlContent;
                    // remove element contents
                    // we'll add it back later.
                    element.empty();
                }
                
                // start the loader.
                function start() {                
                    if(!$module.loading && !$module.disabled){
                        $module.loading = true;        
                        if(angular.isFunction(options.onLoading)){
                            $q.when(options.onLoading($module, instances)).then(function(res) {
                                if(res){
                                    $module.loading = true;
                                    if(options.overflow)
                                        body.css({ overflow: 'hidden'});
                                    element.addClass('show');
                                }
                            });                            
                        } else {
                            $module.loading = true;
                            if(options.overflow)
                                body.css({ overflow: 'hidden'});
                            element.addClass('show');
                        }
                    }
                }
                
                // stop the loader.
                function stop() {    
                    if(options.overflow)
                        body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                    if(element)
                        element.removeClass('show'); 
                    $module.loading = scope.loading = false;
                    $module.suppressed = scope.suppressed = false;
                }  
                
                // suppresses once.
                function suppress() {                    
                    $module.suppressed = true;
                }
                
                // disable the loader
                function disable() {
                    $module.disabled = true;    
                }

                // enable the loader
                function enable() {
                    $module.disabled = false;
                }
                
                // set/update options.
                // does not support live templates.
                function setOptions(key, value) {
                    var obj = key;
                    if(arguments.length > 1){
                        obj = {};
                        obj[key] = value;
                    }
                    options = $module.options = scope.options = angular.extend(options, obj); 
                    scope.message = options.message;
                }

                function destroy() {              
                    delete instances[$module.options.name];
                    scope.$destroy();                    
                }
                
                function init() {
                    
                    $module.start = scope.start = start;
                    $module.stop = scope.stop = stop;
                    $module.set = scope.set = setOptions;
                    $module.suppress = scope.suppress = suppress;
                    $module.enable = scope.enable = enable;
                    $module.disable = scope.disable = disable;
                    scope.message = options.message;                   
               
                    $helpers.loadTemplate(contentTemplate).then(function (template) {
                        if(template) {
                            element.html(template);
                            $helpers.compile(scope, element.contents());
                            if(options.name === 'page')
                                element.addClass('ai-loader-page');
                        } else {
                            console.error('Error loading $loader template.');
                        }
                    });

                    // remove loader on location/route change.
                    $rootScope.$on('$locationChangeStart', function () {
                        if(element)
                            element.removeClass('show');
                        if(body && options.overflow)
                            body.css({ overflow: overflows.x, 'overflow-y': overflows.y });
                    });

                    scope.$watch($module.options, function (newVal, oldVal) {
                        if(newVal === oldVal) return;
                        scope.options = newVal;
                    });

                    scope.$on('destroy', function () {
                        $module.destroy();
                    });
                    
                }
                
                init();
                
                return $module;
            }
            
            function getLoader(name, element, options) {
                var instance;
                if(!arguments.length)
                    return instances;
                else if(arguments.length === 1)
                    return instances[name];
                else
                    instance = ModuleFactory(name, element, options);
                if(instance)
                    instances[instance.options.name] = instance;
                return instance;
            }      
            
            return getLoader;

        }];
        
        return { 
            $get: get,
            $set: set            
        };
        
    })
    
    .directive('aiLoader', [ '$loader', function ($loader) {
    
        return {
            restrict: 'EAC',
            link: function (scope, element, attrs) {

                var $module, defaults, options, watchKey, validKeys;

                defaults = {
                    scope: scope
                };
                
                validKeys = ['name', 'template', 'intercept', 'message', 'delay', 'overflow', 'onLoading'];

                // initialize the directive.
                function init () {
                    $module = $loader(element, options, attrs);
                }

                options = scope.$eval(attrs.aiLoader) || scope.$eval(attrs.aiLoaderOptions);
                options = angular.extend(defaults, options);
                
                watchKey = attrs.aiLoader ? 'aiLoader' : 'aiLoaderOptions';
                scope.$watch(attrs[watchKey], function (newVal, oldVal) {
                    if(newVal === oldVal) return;
                    $module.set(newVal);
                });

                init();
                
            }
            
        };
        
    }]);

angular.module('ai.loader.interceptor', [])
    .factory('$loaderInterceptor', [ '$q', '$injector', '$timeout', function ($q, $injector, $timeout) {
        
        function getLoaders() {
            return $injector.get('$loader')();
        }

        // prevents loader from immediately showing
        // set options.delay.
        function delayLoader(_loader) {
            if(_loader.options.delay === 0 && !_loader.completed){
                _loader.start();                
            } else {
                clearTimeout(_loader.timeoutId);
                _loader.timeoutId = $timeout(function () {
                    if(_loader.completed){
                        clearTimeout(_loader.timeoutId);
                        _loader.stop();
                    } else {
                        _loader.start();
                    }
                }, _loader.options.delay);
            }
        }
        
        function startLoaders() {
            var loaders = getLoaders();            
            angular.forEach(loaders, function (_loader) {
                _loader.completed = false;
                if(_loader.options.intercept !== false){
                    if(!_loader.suppressed){
                        delayLoader(_loader);
                    }
                }
            });                
        }
        
        function stopLoaders(){
            var loaders = getLoaders();
            angular.forEach(loaders, function (_loader) {
                _loader.completed = true;
                _loader.loading = false;
                _loader.stop();
            });
        }
        
        return {
            request: function (req) {      
                startLoaders();
                return req || $q.when(req);
            },
            response: function (res) {
                stopLoaders();
                return res || $q.when(res);
            },
            responseError: function (res){   
                stopLoaders();
                return $q.reject(res);
            }
        };
    }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('$loaderInterceptor');
    }]);

// imports above modules.
angular.module('ai.loader', [
    'ai.loader.factory',
    'ai.loader.interceptor'
]);

   



angular.module('ai.passport.factory', [])

    .provider('$passport', function $passport() {

        var defaults, get, set;

        defaults = {
            rootName: 'Passport',                               // the name to use on rootscope for passport.
            levels: {                                           // security levels to string name map.
                0: '*',
                1: 'user',
                2: 'manager',
                3: 'admin',
                4: 'superadmin'
            },            
            401: true,                                          // set to false to not handle 401 status codes.
            403: true,                                          // set to false to not handle 403 status codes.
            paranoid: false,                                    // when true, fails if access level is missing.
            delimiter: ',',                                     // char to use to separate roles when passing string.

            // passport paths.
            defaultUrl: '/',                                    // the default path or home page.
            loginUrl: '/passport/login',                        // path to login form.
            resetUrl: '/passport/reset',                        // path to password reset form.
            recoverUrl: '/passport/recover',                    // path to password recovery form.            

            // passport actions
            loginAction:  'post /api/passport/login',           // endpoint/func used fo r authentication.
            logoutAction: 'get /api/passport/logout',           // endpoint/func used to logout/remove session.
            resetAction:  'post /api/passport/reset',           // endpoint/func used for resetting password.
            recoverAction:'post /api/passport/recover',         // endpoint/func used for recovering password.
            refreshAction: false,                               // when the page is loaded the user may still be
                                                                // logged in this calls the server to ensure the
                                                                // active session is reloaded.
                                                                // ex: 'get /api/passport/refresh'

            // success fail actions.
            onLoginSuccess: '/',                                // path or func on success.
            onLoginFailed: '/passport/login',                   // path or func when login fails.
            onRecoverSuccess: '/passport/login',                // path or func when recovery is success.
            onRecoverFailed: '/passport/recover',               // path or func when recover fails.
            onUnauthenticated: '/passport/login',               // path or func when unauthenticated.
            onUnauthorized: '/passport/login',                  // path or func when unauthorized.
            
            namePrefix: 'Welcome Back ',                        // prefix string to identity.
            nameParams: [ 'firstName' ]                         // array of user properties which make up the
                                                                // user's identity or full name, properties are 
                                                                // separated by a space.
        };

        set = function set (key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        get = ['$rootScope', '$location', '$http', '$route', function get($rootScope, $location, $http, $route) {

            var instance;

            // nomralize url to method/path object.
            function urlToObject(url) {
                var parts = url.split(' '),
                    obj = { method: 'get' };
                obj.path =  parts[0];
                if(parts.length > 1){
                    obj.method = parts[0];
                    obj.path = parts[1];
                }
                return obj;
            }

            // convert string roles to levels.
            function rolesToLevels(source, roles){
                var arr = [];
                source = source || [];
                angular.forEach(roles, function (v) {
                    if(source[v] !== undefined)
                        arr.push(source[v]);
                });
                return arr;
            }

            // reverse the levels map setting role values as keys.
            function reverseMap(levels) {
                var obj = {};
                angular.forEach(levels, function (v,k) {
                    obj[v] = parseFloat(k);
                });
                return obj;
            }

            function ModuleFactory(options) {

                var $module = {};
                
                $module.user = null;

                function setOptions(options) {

                    // ensure valid object.
                    options = options || {};

                    // override options map if exists.
                    defaults.levels = options.levels || defaults.levels;

                    // merge the options.
                    $module.options = angular.extend(angular.copy(defaults), options);

                    // normalize/reverse levels map
                    $module.options.roles = reverseMap($module.options.levels);
                }

                // login passport credentials.
                $module.login = function login(data) {
                    var url = urlToObject($module.options.loginAction);
                    $http[url.method](url.path, data)
                        .then(function (res) {
                            // set to authenticated and merge in passport profile.
                            //angular.extend(self, res.data);
                            $module.user = res.data;
                            if(angular.isFunction($module.options.onLoginSuccess)) {
                                $module.options.onLoginSuccess.call($module, res);
                            } else {
                                $location.path($module.options.onLoginSuccess);
                            }
                        }, function (res) {
                            if(angular.isFunction($module.options.onLoginFailed)) {
                                $module.options.onLoginFailed.call($module, res);
                            } else {
                                $location.path($module.options.onLoginFailed);
                            }
                        });
                };

                $module.logout = function logout() {        
                    function done() {
                        $module.user = null;
                        $location.path($module.options.loginUrl);
                        $route.reload();
                    }
                    if(angular.isFunction($module.options.logoutAction)){
                        $module.options.logoutAction.call($module);
                    } else {
                        var url = urlToObject($module.options.logoutAction);
                        $http[url.method](url.path).then(function (res) {
                                done();                               
                            });
                    }
                };

                $module.recover = function recover() {
                    if(angular.isFunction($module.options.recoverAction)){
                        $module.options.recoverAction.call($module);
                    } else {
                        var url = urlToObject($module.options.recoverAction);
                        $http[url.method](url.path).then(function (res){
                            if(angular.isFunction($module.options.onRecoverSuccess)) {
                                $module.options.onRecoverSuccess.call($module, res);
                            } else {
                                $location.path($module.options.onRecoverSuccess);
                            }
                        }, function () {
                            if(angular.isFunction($module.options.onRecoverFailed)) {
                                $module.options.onRecoverFailed.call($module, res);
                            } else {
                                $location.path($module.options.onRecoverFailed);
                            }
                        });        
                    }
                };               
                
                $module.refresh = function refresh() {   
                    if(!$module.options.refreshAction)
                        return;
                    if(angular.isFunction($module.options.refreshAction)){
                        $module.options.refreshAction.call($module);                            
                    } else {
                        var url = urlToObject($module.options.refreshAction);
                        $http[url.method](url.path).then(function (res){
                            $module.user = res.data;
                        });
                    }
                };

                $module.reset = function reset() {

                };

                // expects string.
                $module.hasRole = function hasRole(role) {
                    var passportRoles = $module.roles || [];
                    // if string convert to role level.
                    if(angular.isString(role))
                        role = $module.options.roles[role] || undefined;
                    // if public return true
                    if(role === 0)
                        return true;
                    return passportRoles.indexOf(role) !== -1;
                };

                // expects string or array of strings.
                $module.hasAnyRole = function hasAnyRole(roles) {
                    var passportRoles = $module.roles || [];
                    // if a string convert to role levels.
                    if(angular.isString(roles)){
                        roles = roles.split($module.options.delimiter);
                        roles = rolesToLevels($module.options.roles, roles);
                    }
                    // if public return true
                    if(roles.indexOf(0) !== -1)
                        return true;
                    return roles.some(function (v) {
                        return passportRoles.indexOf(v) !== -1;
                    });
                };

                // check if meets the minimum roll required.
                $module.minRole = function requiresRole(role) {
                    var passportRoles = $module.roles || [],
                        maxRole;
                    if(angular.isString(role))
                        role = $module.options.roles[role] || undefined;
                    // get the passport's maximum role.
                    maxRole = Math.max.apply(Math, passportRoles);
                    return maxRole >= role;
                };

                // check if role is not greater than.
                $module.maxRole = function requiresRole(role) {
                    var passportRoles = $module.roles || [],
                        maxRole;
                    if(angular.isString(role))
                        role = $module.options.roles[role] || undefined;
                    // get the passport's maximum role.
                    maxRole = Math.max.apply(Math, passportRoles);
                    return maxRole < role;
                };

                // unauthorized handler.
                $module.unauthenticated = function unauthenticated() {
                    var action = $module.options.onUnauthenticated;

                    // if func call pass context.
                    if(angular.isFunction(action))
                        return action.call($module);

                    // default to the login url.
                    $location.path(action || $module.options.loginUrl);

                };

                // unauthorized handler.
                $module.unauthorized = function unauthorized() {
                    var action = $module.options.onUnauthorized;
                    // if func call pass context.
                    if(angular.isFunction(action))
                        return action.call($module);
                    // default to the login url.
                    $location.path(action || $module.options.loginUrl);
                };
                
                // gets the identity name of the authenticated user.
                $module.getName = function getName(arr) {
                    var result = '';
                    arr = arr || $module.options.nameParams;
                    if(!$module.user)
                        return;
                    angular.forEach(arr, function (v, k){
                        if($module.user[v]){
                            if(k === 0)
                                result += $module.user[v];
                            else
                                result += (' ' + $module.user[v]);
                        }      
                    });    
                    return $module.options.namePrefix + result;
                };

                setOptions(options);
                
                $module.refresh();

                return $module;

            }

            function getInstance() {
                if(!instance)
                    instance = new ModuleFactory();
                $rootScope.Passport = instance;
                return instance;
            }

            return getInstance();
           
        }];

        return {
            $get: get,
            $set: set
        };

    });

// intercepts 401 and 403 errors.
angular.module('ai.passport.interceptor', [])
    .factory('$passportInterceptor', ['$q', '$injector', function ($q, $injector) {
        return {
            responseError: function(res) {
                // get passport here to prevent circ dependency.
                var passport = $injector.get('$passport');
                // handle unauthenticated response
                if (res.status === 401 && passport.options['401'])
                    passport.unauthenticated();
                if(res.status === 403 && passport.options['403'])
                    passport.unauthorized();
                return $q.reject(res);
            }
        };
    }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('$passportInterceptor');
    }]);

// handles intercepting route when
// required permissions are not met.
angular.module('ai.passport.route', [])
    .run(['$rootScope', '$location', '$passport', function ($rootScope, $location, $passport) {
        $rootScope.$on('$routeChangeStart', function (event, next) {
            var area = {},
                route = {},
                access,
                authorized;
            if(next && next.$$route){
                route = next.$$route;
                if(route.area)
                    area = route.area;
            }
            access = route.access || area.access;
            // when paranoid is true require access params
            // if undefined call unauthorized.
            // when paranoid is false unauthorized is not called
            // when access is undefined.
            if($passport.options.paranoid && access === undefined)
                return $passport.unauthorized();
            if(access !== undefined){
                authorized = $passport.hasAnyRole('*');
                if(!authorized)
                    $passport.unauthorized();
            }
        });
    }]);

// imports above modules.
angular.module('ai.passport', [
    'ai.passport.factory',
    'ai.passport.interceptor',
    'ai.passport.route'
]);
angular.module('ai.step', ['ai.helpers'])

.provider('$step', function $step() {

    var defaults = {

            key: '$id',                     // the primary key for the collection of steps.
            start: 0,                       // the starting index of the step wizard.
            title: 'true',                  // when true title is auto generated if not set in step object.
            continue: undefined,            // when true if called step is disabled continue to next enabled.
            breadcrumb: false,              // when true only header is shown, used as breadcrumb.
                                            // breadcrumb mode looks for property 'href' to navigate to.

                                            // html templates, can be html or path to template.

            header: 'step-header.tpl.html',   // the header template when using directive.
            content: 'step-content.tpl.html', // the content template to use when using directive.
            actions: 'step-actions.tpl.html', // the actions template when using directive.

                                            // hide/show buttons, disable/enable header click events.

            showNumber: undefined,          // when true step number show next to title.
            showNext: undefined,            // when true next button is created.
            showPrev: undefined,            // when true prev button is created.
            showSubmit: undefined,          // when true submit button is created.
            headTo: undefined,              // when true header can be clicked to navigate.

                                            // all events are called with $module context except onload which passes it.

            onBeforeChange: undefined,      // callback event fired before changing steps.
            onChange: undefined,            // callback on changed step, returns ({ previous, active }, event)
            onSubmit: undefined,            // callback on submit returns ({ active }, event)
            onReady: undefined               // callback on load returns ($module)

        }, get, set;

    set = function set(key, value) {
        var obj = key;
        if(arguments.length > 1){
            obj = {};
            obj[key] = value;
        }
        defaults = angular.extend(defaults, obj);
    };

    get = [ '$q', '$rootScope', '$location', '$helpers', function get($q, $rootScope, $location, $helpers) {

        var headerTemplate, contentTemplate, actionsTemplate;

        headerTemplate = '<div class="ai-step-header" ng-show="steps.length">' +
                            '<ul>' +
                                '<li ng-click="headTo($event, $index)" ng-repeat="step in steps" ' +
                                'ng-class="{ active: step.active, disabled: !step.enabled, ' +
                                'clickable: options.headTo !== false && step.enabled, nonum: !options.showNumber === false }">' +
                                    '<span class="title">{{step.title}}</span>' +
                                    '<span class="number">{{step.$number}}</span>' +
                                '</li>' +
                            '</ul>' +
                         '</div>';

        contentTemplate = '<div ng-if="!options.breadcrumb" class="ai-step-content" ng-show="steps.length">' +
                            '<div ng-show="isActive($index)" ng-repeat="step in steps" ng-bind-html="step.content"></div>' +
                          '</div>';

        actionsTemplate = '<div ng-if="!options.breadcrumb" class="ai-step-actions" ng-show="steps.length">' +
                            '<hr/><button ng-show="options.showPrev !== false" ng-disabled="isFirst()" class="btn btn-warning" ' +
                                'ng-click="prev($event)">Previous</button> ' +
                            '<button ng-show="options.showNext !== false" ng-disabled="isLast()" class="btn btn-primary" ' +
                                'ng-click="next($event)">Next</button> ' +
                            '<button ng-show="isLast() && options.showSubmit !== false" class="btn btn-success submit" ' +
                                'ng-click="submit($event)">Submit</button>' +
                          '</div>';

        $helpers.getPutTemplate(defaults.header, headerTemplate);
        $helpers.getPutTemplate(defaults.content, contentTemplate);
        $helpers.getPutTemplate(defaults.actions, actionsTemplate);

        function ModuleFactory(element, options, attrs) {

            var $module = {},
                steps = [],
                templates =[],
                contentTemplates = [],
                _steps,
                scope,
                _previous;

            // shift args if needed.
            if(!angular.isElement(element) && angular.isObject(element)){
                attrs = options;
                options = element;
                element = undefined;
            }            

            attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);
            
            // extend options
            options = options || {};
            $module.scope = scope = options.scope || $rootScope.$new();
            $module.options = scope.options = options = angular.extend({}, defaults, attrs, options);

            // check if options contain steps.
            if(options.steps){
                _steps = options.steps;
                delete options.steps;
            }

            // clears active step.
            function clear() {
                angular.forEach(steps, function (v) {
                    v.active = false;
                });
            }

            // Public API

            // get step by key/value, index or step.
            function find(key, value, first) {
                if(angular.isNumber(key) && !value){
                    return steps[key];
                } else {
                    if(!value){
                        value = key;
                        key = options.key;
                    }
                    var result = steps.filter(function (v) {
                        if(v[key])
                            return v[key] === value;
                        return false;
                    });
                    if(result && first)
                        return result[0];
                    return result;
                }
            }

            // get the index of a step.
            function indexOf(step) {
                if(!step)
                    return -1;
                return steps.indexOf(step);
            }

            // getter/setter for active step.
            function active(key, value) {
                if(!key) {
                    return steps.filter(function (v) {
                        return v.active === true;
                    })[0];
                } else {
                    var step = find(key, value, true);
                    if(step && step.enabled){
                        clear();
                        step.active = true;
                    }
                }
            }

            // go to a specific step index or object.
            function to(key, reverse, e) {
                var curActive = active(),
                    nextActive,
                    nextIdx;
                if(angular.isNumber(key)){
                    nextIdx = key;
                    nextActive = steps[key];
                }
                if(angular.isObject(key)){
                    nextIdx = indexOf(key);
                    nextActive = key;
                }

                if(angular.isFunction(options.onBeforeChange)){
                    $q.when(options.onBeforeChange({ active: curActive, next: nextActive }, e))
                        .then(function(res) {
                            if(res) done();
                        });
                } else {
                    done();
                }

                function done() {

                    if(nextActive) {
                        if(!nextActive.enabled && options.continue !== false){

                            var i, altActive;
                            if(reverse) {
                                for(i = nextIdx -1; i >= 0; i-- )  {
                                    altActive = steps[i];
                                    if(altActive.enabled){
                                        nextActive = altActive;
                                        nextIdx = i;
                                    }
                                }
                            } else {
                                for(i = nextIdx; i < steps.length; i++ )  {
                                    altActive = steps[i];
                                    if(altActive.enabled){
                                        nextActive = altActive;
                                        nextIdx = i;
                                    }
                                }
                            }
                        }


                        if(nextActive.enabled) {
                            clear();
                            nextActive.active = true;
                            _previous = nextActive;
                        }

                        // callback on change.
                        if(angular.isFunction(options.onChange))
                            options.onChange.call($module, { previous: curActive, active: nextActive }, e);

                    }

                }

            }

            // adds a new step
            function add(name, obj) {
                if(!name && !obj) return;
                var nextIdx = steps.length,
                    nameOnly;
                if(angular.isObject(name)){
                    obj = name;
                    name = undefined;
                }
                nameOnly = !obj;
                if(nameOnly){
                    obj = {};
                    obj.content = name;
                }
                // must have name or defined key in object.
                if(!name && !obj[options.key]) return;
                obj.enabled = obj.enabled !== undefined ? obj.enabled : true;
                obj.active = nextIdx === options.start;
                obj[options.key] = obj[options.key] || name;
                obj.content = obj.content || name;
                if(options.title){
                    obj.title = obj.title || 'Step';
                    obj.title = obj.title.charAt(0).toUpperCase() + obj.title.slice(1);
                }
                obj.$index = nextIdx;
                obj.$number = nextIdx +1;
                // simple string wrap in span.
                if(!$helpers.isHtml(obj.content) && !$helpers.isPath(obj.content))
                    obj.content = '<span>' + obj.content + '</span>';
                contentTemplates.push($helpers.loadTemplate(obj.content));
                $rootScope.$broadcast('step:add', obj);
                steps.push(obj);
            }

            // go to next step;
            function next(e) {
                var cur = active();
                if(cur)
                    to(cur.$index + 1, null, e);
            }

            // go to previous step.
            function prev(e) {
                var cur = active();
                if(cur)
                    to(cur.$index - 1, true, e);
            }

            // on header click.
            function headTo(e, idx) {
                if(options.headTo === false) return;
                var step = steps[idx];
                if(!options.breadcrumb && step.content) {
                    to(idx, null, e);
                } else {
                    // breadcrumb mode navigate
                    // to href if provided.
                    if(step && step.href && step.enabled)
                        $location.path(step.href);
                }
            }

            // submit button for last step.
            function submit(e) {
                if(angular.isFunction(options.onSubmit)){
                    options.onSubmit.call($module, { active: active() }, e);
                }
            }

            // indicates if step is first.
            function isFirst(key, value) {
                var step = find(key, value, true),
                    idx;
                step = step || active();
                idx = indexOf(step);
                return 0 === idx;
            }

            // indicates if step is last.
            function isLast(key, value) {
                var step = find(key, value, true),
                    idx;
                step = step || active();
                idx = indexOf(step);
                return steps.length -1 === idx;
            }

            // checks if is active.
            function isActive(key, value){
                var step = find(key, value, true);
                return !!(step && step.active === true);
            }

            // checks if is enabled.
            function isEnabled(key, value) {
                var step = find(key, value, true);
                return !!(step && step.enabled === true);
            }

            // step has next step.
            function hasNext() {
                var idx = indexOf(active()) + 1,
                    _next = steps[idx];
                if(_next && _next.enabled)
                    return true;
            }

            // step has previous step.
            function hasPrev() {
                var idx = indexOf(active()) - 1,
                    _prev = steps[idx];
                if(_prev && _prev.enabled)
                    return true;
            }

            // initialize the module.
            function init() {

                // if initialized with steps
                // add them to the collection.
                if(_steps) {
                    // convert string to array.
                    if(angular.isString(_steps))
                        _steps = $helpers.trim(_steps).split(',');
                    // convert object to array.
                    if(angular.isObject(_steps)){
                        var tmpArr = [];
                        angular.forEach(_steps, function (v,k){
                            if(angular.isObject(v) || angular.isString(v)){
                                if(angular.isString(v)){
                                    var tmpObj = {};
                                    tmpObj[options.key] = k;
                                    tmpObj.content = v;
                                    tmpArr.push(tmpObj);
                                } else {
                                    v[options.key] = v[options.key] || k;
                                    if(options.title)
                                        v.title = v.title || k;
                                    tmpArr.push(v);
                                }
                            }
                        });
                    }
                    angular.forEach(_steps, function (v) {
                        if(angular.isString(v))
                            v = $helpers.trim(v);
                        add(v);
                    });
                }

                if(!element)
                    return callback();

                var template, contentTemplate;

                template = '';
                contentTemplate = '<div ng-show="isActive({{INDEX}})">{{CONTENT}}</div>';

                if(options.header)
                    templates.push($helpers.loadTemplate(options.header || ''));

                if(options.content)
                    templates.push($helpers.loadTemplate(options.content || ''));

                if(options.actions)
                    templates.push($helpers.loadTemplate(options.actions || ''));

                templates = templates.concat(contentTemplates);

                // load user content/templates.

                templates = $q.all(templates);
                templates.then(function(res) {

                    if(res){
                        // load each base template
                        // which will be the template or empty string.
                        var map = {
                            header: res[0],
                            content: res[1],
                            actions: res[2],
                            steps: []
                        };

                        // load content templates.
                        for(var i = 3; i < res.length; i++){
                            map.steps.push(res[i]);
                        }
                        template += map.header;
                        if(map.content && map.content.length){
                            var content = angular.element(map.content),
                                contents = '',
                                contentHtml;
                            angular.forEach(map.steps, function(v,k) {
                                contents += contentTemplate.replace('{{INDEX}}', k).replace('{{CONTENT}}', v);
                            });
                            content.html(contents);
                            contentHtml = angular.element('<div/>').append(content).clone().html();
                            template += contentHtml;
                        }
                        template += map.actions;

                        element.html(template);
                        $helpers.compile(scope, element.contents());
                    }

                });


                // Expose methods to module and scope.
                $module.find = scope.find = find;
                $module.active = scope.active = active;
                $module.add = scope.add = add;
                $module.to = scope.to = to;
                $module.next = scope.next = next;
                $module.prev = scope.prev = prev;
                $module.submit = scope.submit = submit;
                scope.headTo = headTo;
                $module.isFirst = scope.isFirst = isFirst;
                $module.isLast = scope.isLast = isLast;
                $module.isActive = scope.isActive = isActive;
                $module.isEnabled = scope.isEnabled = isEnabled;
                $module.hasNext = scope.hasNext = hasNext;
                $module.hasPrev = scope.hasPrev = hasPrev;
                $module.steps = scope.steps = steps;

                if(angular.isFunction(options.onReady))
                    options.onReady($module);

                return $module;

            }

            return init();

        }

        return ModuleFactory;

    }];

    return {
        $get: get,
        $set: set
    };


})

.directive('aiStep', [ '$step', function ($step) {

        return {
        restrict: 'EAC',
        scope: true,
        link: function (scope, element, attrs) {

            var defaults, options, $module;

            defaults = {
                scope: scope
            };

            function init() {
                $module = $step(element, options, attrs);
            }

            options = scope.$eval(attrs.aiStep || attrs.aiStepOptions);
            options = angular.extend(defaults, options);

            init();

        }
    };

}]);
angular.module('ai.storage', [])

    .provider('$storage', function $storage() {

        var defaults = {
            ns: 'app',              // the namespace for saving cookie/localStorage keys.
            cookiePath: '/',        // the path for storing cookies.
            cookieExpiry: 30        // the time in minutes for which cookies expires.
        }, get, set;


        /**
         * Checks if cookies or localStorage are supported.
         * @private
         * @param {boolean} [cookie] - when true checks for cookie support otherwise checks localStorage.
         * @returns {boolean}
         */
        function supports(cookie) {
            if(!cookie)
                return ('localStorage' in window && window.localStorage !== null);
            else
                return navigator.cookieEnabled || ("cookie" in document && (document.cookie.length > 0 ||
                    (document.cookie = "test").indexOf.call(document.cookie, "test") > -1));
        }

        /**
         * Get element by property name.
         * @private
         * @param {object} obj - the object to parse.
         * @param {array} keys - array of keys to filter by.
         * @param {*} [def] - default value if not found.
         * @param {number} [ctr] - internal counter for looping.
         * @returns {*}
         */
        function getByProperty(obj, keys, def, ctr) {
            if (!keys) return def;
            def = def || null;
            ctr = ctr || 0;
            var len = keys.length;
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    if (p === keys[ctr]) {
                        if ((len - 1) > ctr && angular.isObject(obj[p])) {
                            ctr += 1;
                            return getByProperty(obj[p], keys, def, ctr) || def;
                        }
                        else {
                            return obj[p] || def;
                        }
                    }
                }
            }
            return def;
        }

        /**
         * Sets provider defaults.
         */
        set = function (key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend({}, defaults, obj);
        };

        /**
         * Angular get method for returning factory.
         * @type {*[]}
         */
        get = [ function () {

            function ModuleFactory(options) {

                var $module = {},
                    ns, cookie, nsLen,
                    cookieSupport, storageSupport;

                // extend defaults with supplied options.
                options = angular.extend(defaults, options);

                // set the namespace.
                ns = options.ns + '.';

                // get the namespace length.
                nsLen = ns.length;

                storageSupport = supports();
                cookieSupport = supports(true);

                // make sure either cookies or local storage are supported.
                if (!storageSupport && !cookieSupport)
                    return new Error('Storage Factory requires localStorage browser support or cookies must be enabled.');

                /**
                 * Get list of storage keys.
                 * @memberof StorageFactory
                 * @private
                 * @returns {array}
                 */
                function storageKeys() {

                    if (!storageSupport)
                        return new Error('Keys can only be obtained when localStorage is available.');
                    var keys = [];
                    for (var key in localStorage) {
                        if(localStorage.hasOwnProperty(key)) {
                            if (key.substr(0, nsLen) === ns) {
                                try {
                                    keys.push(key.substr(nsLen));
                                } catch (e) {
                                    return e;
                                }
                            }
                        }
                    }
                    return keys;
                }

                /**
                 * Set storage value.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the key to set.
                 * @param {*} value - the value to set.
                 */
                function setStorage(key, value) {
                    if (!storageSupport)
                        return setCookie(key, value);
                    if (typeof value === undefined)
                        value = null;
                    try {
                        if (angular.isObject(value) || angular.isArray(value))
                            value = angular.toJson(value);
                        localStorage.setItem(ns + key, value);
                    } catch (e) {
                        return setCookie(key, value);
                    }
                }

                /**
                 * Get storate by key
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the storage key to lookup.
                 * @param {string} [property] - the property name to find.
                 * @returns {*}
                 */
                function getStorage(key, property) {
                    var item;
                    if(property)
                        return getProperty(key, property);
                    if (!storageSupport)
                        return getCookie(key);
                    item = localStorage.getItem(ns + key);
                    if (!item)
                        return null;
                    if (item.charAt(0) === "{" || item.charAt(0) === "[")
                        return angular.fromJson(item);
                    return item;
                }

                /**
                 * Get object property.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the storage key.
                 * @param {string} property - the property to lookup.
                 * @returns {*}
                 */
                function getProperty(key, property) {
                    var item, isObject;
                    if(!storageSupport)
                        return new Error('Cannot get by property, localStorage must be enabled.');
                    item = getStorage(key);
                    isObject = angular.isObject(item) || false;
                    if (item) {
                        if (isObject)
                            return getByProperty(item, property);
                        else
                            return item;
                    } else {
                        return new Error('Invalid operation, storage item must be an object.');
                    }
                }

                /**
                 * Delete storage item.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key
                 * @returns {boolean}
                 */
                function deleteStorage (key) {
                    if (!storageSupport)
                        return deleteCookie(key);
                    try {
                        localStorage.removeItem(ns + key);
                    } catch (e) {
                        return deleteCookie(key);
                    }
                }

                /**
                 * Clear all storage CAUTION!!
                 * @memberof StorageFactory
                 * @private
                 */
                function clearStorage () {

                    if (!storageSupport)
                        return clearCookie();

                    for (var key in localStorage) {
                        if(localStorage.hasOwnProperty(key)) {
                            if (key.substr(0, nsLen) === ns) {
                                try {
                                    deleteStorage(key.substr(nsLen));
                                } catch (e) {
                                    return clearCookie();
                                }
                            }
                        }
                    }
                }


                /**
                 * Set a cookie.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the key to set.
                 * @param {*} value - the value to set.
                 */
                function setCookie (key, value) {

                    if (typeof value === undefined) return false;

                    if (!cookieSupport)
                        return new Error('Cookies are not supported by this browser.');
                    try {
                        var expiry = '',
                            expiryDate = new Date();
                        if (value === null) {
                            cookie.expiry = -1;
                            value = '';
                        }
                        if (cookie.expiry) {
                            expiryDate.setTime(expiryDate.getTime() + (options.cookieExpiry * 24 * 60 * 60 * 1000));
                            expiry = "; expires=" + expiryDate.toGMTString();
                        }
                        if (!!key)
                            document.cookie = ns + key + "=" + encodeURIComponent(value) + expiry + "; path=" +
                                options.cookiePath;
                    } catch (e) {
                        throw e;
                    }
                }


                /**
                 * Get a cookie by key.
                 * @memberof StorageFactory
                 * @private
                 * @param {string} key - the key to find.
                 * @returns {*}
                 */
                function getCookie (key) {

                    if (!cookieSupport)
                        return new Error('Cookies are not supported by this browser.');
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var ck = cookies[i];
                        while (ck.charAt(0) === ' ')
                            ck = ck.substring(1, ck.length);
                        if (ck.indexOf(ns + key + '=') === 0)
                            return decodeURIComponent(ck.substring(ns.length + key.length + 1, ck.length));
                    }
                    return null;
                }

                /**
                 * Delete a cookie by key.
                 * @memberof StorageFactory
                 * @private
                 * @param key
                 */
                function deleteCookie(key) {
                    setCookie(key, null);
                }

                /**
                 * Clear all cookies CAUTION!!
                 * @memberof StorageFactory
                 * @private
                 */
                function clearCookie() {
                    var ck = null,
                        cookies = document.cookie.split(';'),
                        key;
                    for (var i = 0; i < cookies.length; i++) {
                        ck = cookies[i];
                        while (ck.charAt(0) === ' ')
                            ck = ck.substring(1, ck.length);
                        key = ck.substring(nsLen, ck.indexOf('='));
                        return deleteCookie(key);
                    }
                }

                //check for browser support
                $module.supports =  {
                    localStorage: supports(),
                    cookies: supports(true)
                };

                // storage methods.
                $module.get = getStorage;
                $module.set = setStorage;
                $module.delete = deleteStorage;
                $module.clear = clearStorage;
                $module.storage = {
                    keys: storageKeys,
                    supported: storageSupport
                };
                $module.cookie = {
                    get: getCookie,
                    set: setCookie,
                    'delete': deleteCookie,
                    clear: clearCookie,
                    supported: cookieSupport
                };

                return $module;

            }

            return ModuleFactory;

        }];

        return {
            $set: set,
            $get: get
        };

    });


angular.module('ai.table', ['ngSanitize', 'ai.helpers'])

    /* table provider merely provides a way to globally confgure table */
    .provider('$table', [ function $table() {

        /* COLUMN OPTIONS
         * map: property to map to.
         * sortable: enables column sorting default: true.
         * draggable: column can be rearranged.

         * filter: an angular filter to apply or a function which returns the formatted value default: false.
         * string filters should be formatted as 'filter_name|filter_format' where
         * filter_name is 'date' and filter_format is 'medium' example: filter: 'date|medium'.
         * NOTE: ignored if cellTemplate is passed.

         * headerClass: the css class for header default: false.

         * cellClass: the css class for the cell if any default: false.
         * NOTE if header class is enabled assumes same for cell class,
         * makes alignment easier instead of having to decorate both classes.

         * headerTemplate: an html template to use for the column cell default: false.
         * cellTemplate: an html template to use for the header cell default: false.
         * editTemplate: the template to use for editing this overrides simple 'editType' configurations.

         * editType: the type to use for editing this column default: undefined to disabled editing.
         * NOTE: valid types are text, number, date, datetime, time, checkbox, email, password, tel
         * types must be an input element, e.g. selects etc are not currently supported.

         * editOptions: only used when editType is 'select'. this will init the options for your select.
         * NOTE: if you create a scope object in your controller called let's say 'items' you can access
         * it like such: editOptions: 'item.id as item.text as item in parent.items'.

         * exclude: when true excludes this column default: false.
         * accessible: boolean or function. when true column is displayed. good for securing editing/deleting command
         * columns based on permissions.
         */

        /* BOOTSTRAP OPTIONS
         *  enabled: whether or not to use bootstrap styling. default: true.
         *  bordered: boolean uses ai-table-bordered class when true on <table> element default: true.
         *  striped: boolean uses ai-table-striped class when true on <table> element default: true.
         *  hover: boolean uses ai-table-hover class when true on <table> element default: false.
         *  condensed: boolean uses ai-table-condensed when true on <table> element default: false.
         */

        var defaults, get, set;

        defaults = {

            // DATA & CONFIGURATION
            auto: undefined,                            // when true row columns are automatically generated with defaults datatype: boolean
                                                        // to allow only defined columns in the columns option below set this to false.
            uppercase: undefined,                       // if true headers will automatically converted to uppercase, useful when using auto
                                                        // and source properties are lowercase.
            columns: {},                                // the mapped column settings datatype: object
            source: [],                                 // the table source data can be datatype: object, array or url
            server: false,                              // enables server side paging, pass skip, take order etc in params. param { where: value }
                                                        // is merged with params when search is enabled and search input has value datatype: boolean
            serverFilter: false,                        // when true the query is passed back to the server rather than query the local batch. this will
                                                        // be ignored if batching is not enabled.
            method: 'get',                              // the http method to use when source is url datatype: string
            config: {},                                 // note when used values overwrite params & method. use for full http config datatype: object
            params: {},                                 // when url is used this object is sent with each $http request datatype: object
            mapParams: false,                           // map your server params sent when server is enabled. datatype: boolean/object
                                                        // server map object example: { where: 'your_where', sort: 'your_sort', skip: 'your_skip', limit: 'your_take' }
                                                        // replace 'your_*' with the corresponding param name for your server.
            batch: 50,                                  // to enable specify the number of records to batch in the request. ignored unless "server" is enabled.
                                                        // this feature limits redundant server calls and should likely be used for large datasets. to disable
                                                        // set the property to false datatype: boolean/integer
            loader: false,                              // if true the loader template creates a modal effect with preloader on async operations
            loaderDelay: 100,                           // set value to delay displaying loader until after specified milliseconds. 100-300 ms usually works well.
                                                        // set loader to 0 if you want it to show right away.

            // SORTING & SEARCHING & FILTERING
            actions: undefined,                         // whether or not to display actions for searching/filtering datatype: boolean
            changeable: undefined,                      // indicates if allowed to change displayed records/rows per page datatype: boolean
            sortable: undefined,                        // whether or not the table can use sorting datatype: boolean
            searchable: undefined,                      // whether or not the data is searchable datatype: boolean
            selectable: false,                          // whether or not rows can be selected, accepts true or 'multi' for multi-selection
                                                        // datatype: boolean/string NOTE: requires onSelect to be valid function.
                                                        // useful to prevent selection of row on anchor or other element click.
            selectableAll: false,                       // when true built in button displayed to select and clear all.
            editable: false,                            // indicates whether rows are editable, columns must also be specified with editType.
            exportable: false,                          // when true exportable options are displayed for export of current filtered results.
            orderable: false,                           // if true columns and rows can be re-ordered.
            orderBy: undefined,                         // initial order to display ex: 'name' or '-name' for descending datatype: string
                                                        // NOTE: with order by you can also use true or false ex: 'name true' where true means
                                                        // the order is reverse e.g. descending.

            // PAGING & COUNTS
            pager: undefined,                           // options for paging datatype: boolean
            display: 10,                                // the number of records to display per page datatype: integer
            pages: 5,                                   // the number of pages show in the pager datatype: integer
            counts: undefined,                          // when pager is enabled page/record counts are displayed datatype: boolean
            pagination: undefined,                      // this enables hiding pagination but showing counts pager must be set to true datatype: boolean
            firstLast: undefined,                       // indicates whether first and last should be shown in pager
            goto: true,                                 // allows manually entering a page directly and navigating to it datatype: boolean

            // TEMPLATING

            actionsTemplate: 'table-actions.tpl.html', // template where search input is located datatype: string
            tableTemplate: 'table.tpl.html',           // the template for the table datatype: string
            pagerTemplate: 'table-pager.tpl.html',     // the template for paging datatype: string
            nodataTemplate: 'table-nodata.tpl.html',   // presented when no data rows are present datatype: string.
            loaderTemplate: 'table-loader.tpl.html',   // loading spinner template. datatype: string

            // BOOTSTRAP TEMPLATING

            bootstrap: true,                             // when true use Twitter Bootstrap styling datatype: boolean
            bordered: true,                              // when bootstrap is true bordered styling is applied datatype: boolean
            striped: true,                               // when bootstrap is true striped styling is applied datatype: boolean
            hover: false,                                // when bootstrap is true hover styling is applied datatype: boolean
            condensed: false,                            // when bootstrap is true condensed styling is applied datatype: boolean
            responsive: true,                            // when bootstrap is true responsive wrapper div is applied datatype: boolean

            // TABLE EVENTS

            onSelected: undefined,                      // returns row, selected row(s) & event data when row is selected datatype: function
            onDeleted: undefined,                       // returns row, selected row(s) & event data. datatype: function
            onLoad: undefined,                          // fires when a data source is about to load it passes the $http config for the request datatype: function
                                                        // this is useful when needing to pass additional params or modify the config before
                                                        // requesting from the server.
            onReset: undefined,                         // callback after table has been reset.
            onReady: undefined,                         // callback after table has completely rendered.

            beforeFilter: undefined,                    // allows for custom filtering. passes filtered query and source collection.
                                                        // you may return a string, object or filtered array.
            beforeUpdate: undefined,                    // before updates are saved to row this is called can return boolean or promise with boolean if successfull.
            beforeDelete: undefined,                    // the callback to process before deleting a row. can return boolean to continue processing or promise.
            beforeDownload: undefined                   // event that is fired before download of exported data. You can use this to pass a file name,
                                                        // or perhaps prompt with a dialog. Passes the filtered collection and default fileName you should
                                                        // return an object with the filtered records to export and fileName or false to cancel download.

            // GENERIC EVENTS

            /*
             * NOTE you can pass just about any jQuery
             * event here and it will return the context (this)
             * along with the row, column and event.
             * essentially it is just a wrapper.
             * don't forget to $apply if you need
             * the table to update after using this
             * wrapper. note the example below.
             * wrapper events MUST start with on.
             * such as "onClick" which is normalized to
             * "click". or onMouseOut which is normalized to
             * "mouseout".
             */
            // onTouchStart: function(ctx, row, column, event) { // do something }

        };

        set = function set(key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        get = ['$rootScope','$http', '$q', '$templateCache', '$filter', '$timeout', '$helpers',
            function get($rootScope,$http, $q, $templateCache, $filter, $timeout, $helpers) {

                var tableTemplate, actionsTemplate, loaderTemplate,
                    pagerTemplate, nodataTemplate;

                actionsTemplate =
                    '<div class="ai-table-actions" ng-show="actions">' +
                    '<div class="ai-table-actions-row row row-fluid">' +
                    '<div class="ai-table-actions-filter col-sm-6 span-6">' +
                    '<div class="row row-fluid" ng-show="searchable">' +
                    '<div class="col-sm-8 span-8">' +
                    '<input class="form-control" type="text" placeholder="Search" ng-model="q" ng-change="filter(q)" ng-disabled="editing"/>' +
                    '</div>' +
                    '<div class="col-sm-4 span-4">' +
                    '<button class="btn btn-warning" type="button"  ng-click="reset()" ng-disabled="editing">Reset</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="ai-table-actions-options col-sm-6 span-6">' +
                    '<div class="row row-fluid form-inline" ng-show="options">' +
                    '<div class="col-sm-3 span-3">' +
                    '<div ng-show="exportable">' +
                    '<button ng-click="exportURI()" class="btn btn-warning">Export to CSV</button>' +
                    '</div>' +
                    '</div>' +
                    '<div class="col-sm-3 span-3">' +
                    '<div ng-show="goto">' +
                    '<input type="text" ng-model="gotoPage" class="form-control goto" placeholder="Goto" ng-keyup="pageToKeyUp($event, gotoPage)" ng-disabled="editing"/>  <button ng-click="pageTo(gotoPage)" class="btn btn-primary" ng-disabled="editing || (gotoPage > indices.max)">Go</button>' +
                    '</div>' +
                    '</div>' +
                    '<div class="col-sm-6 span-6 text-right">' +
                    '<label ng-show="changeable">Displayed</label>' +
                    '<select ng-show="changeable" class="form-control" ng-model="display" ng-change="changeDisplay(display)" ng-disabled="editing">' +
                    '<option ng-repeat="d in displayed">{{d}}</option>' +
                    '</select>' +
                    '<button ng-click="selectAllRows(true)" ng-show="!selectAll && selectable && selectableAll" class="btn btn-primary" ng-model="selectAll" ng-disabled="editing">Select All</button>' +
                    '<button style="min-width: 80px;" ng-click="selectAllRows(false)" ng-show="selectAll && selectable && selectableAll" class="btn btn-primary" ng-model="selectAll" ng-disabled="editing">Clear All</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>';


                tableTemplate =
                    '<table class="ai-table-table table table-bordered table-striped table-hover table-condensed" ng-class="{ \'ai-table-selectable\': selectable }">' +
                    '<thead>' +
                    '<tr>' +
                    '<th class="ai-table-header" ng-class="sortClass(column)" ng-repeat="column in columns" ng-click="sort(column)" ng-if="!column.excluded"></th>' +
                    '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                    '<tr class="ai-table-row" ng-repeat="row in filtered" ng-click="selectTableRow($event, row, $index)" ng-if="$index >= filteredRows.start && $index < filteredRows.end" ng-class="{ \'ai-table-row-selected\': row.selected,  \'ai-table-row-editing\': row.edits }">' +
                    '<td class="ai-table-cell" ng-if="!column.excluded" ng-repeat="column in columns"></td>' +
                    '</tr>' +
                    '</tbody>' +
                    '</table>';

                pagerTemplate =
                    '<div class="ai-table-pager" ng-show="pager">' +
                    '<div class="ai-table-pager-row row">' +
                    '<div class="ai-table-pager-records col-sm-6">' +
                    '<div ng-show="counts">' +
                    '<span>Page <strong>{{page}}</strong> of <strong>{{indices.filtered}}</strong></span>  -  ' +
                    ' <span>Filtered (<strong>{{filtered.length}}</strong>)</span>  -  ' +
                    ' <span>Total (<strong>{{total}}</strong>)</span>' +
                    '</div>' +
                    '</div>' +
                    '<div class="ai-table-pager-pages col-sm-6">' +
                    '<ul class="pagination" ng-show="pagination && indices.filtered > 0">' +
                    '<li ng-class="{ disabled: !hasPrev(page) || editing }"><a ng-click="pagePrev(page)">&laquo;</a></li>' +
                    '<li ng-class="{ disabled: page == 1 || editing }" ng-show="firstLast"><a ng-click="pageTo(1)">First</a></li>' +
                    '<li ng-class="{ active: pg == page, disabled: editing }" ng-repeat="pg in pages">' +
                    '<a ng-click="pageTo(pg)" ng-bind="pg"></a>' +
                    '                           </li>' +
                    '<li ng-class="{ disabled: page == indices.filtered || indices.filtered === 1 || editing }" ng-show="firstLast"><a ng-click="pageTo(indices.filtered)">Last</a></li>' +
                    '<li ng-class="{ disabled: !hasNext(page) || indices.filtered ===1 || editing }"><a ng-click="pageNext(page)">&raquo;</a></li>' +
                    '</ul>' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                nodataTemplate =
                    '<div class="ai-table-table table table-bordered table-striped table-hover table-condensed">' +
                    '<div class="ai-table-nodata">0 records found in collection or columns not specified.</div>' +
                    '</div>';

                loaderTemplate = '<div class="ai-table-loader" ng-show="loading"><div><div>&nbsp;</div></div></div>';

                $helpers.getPutTemplate(defaults.actionsTemplate, actionsTemplate);
                $helpers.getPutTemplate(defaults.tableTemplate, tableTemplate);
                $helpers.getPutTemplate(defaults.pagerTemplate, pagerTemplate);
                $helpers.getPutTemplate(defaults.nodataTemplate, nodataTemplate);
                $helpers.getPutTemplate(defaults.loaderTemplate, loaderTemplate);

                function range(start, end, step) {

                    start = +start || 1;
                    step = step || 1;
                    //step = step === undefined  ? 1 : (+step || 0);

                    if (end === null) {
                        end = start;
                        start = 0;
                    } else {
                        end = +end || 0;
                    }

                    var index = -1,
                        length = Math.max(Math.ceil((end - start) / (step || 1)), 0),
                        result = new Array(length);

                    while (++index < length) {
                        result[index] = start;
                        start += step;
                    }
                    return result;

                }

                function mapTo (from, to, levels) {
                    var ctr = 1;
                    to = to || {};
                    Object.keys(from).forEach( function( key ) {
                        if (angular.isObject(from[key])) {
                            // recurse
                            ctr +=1;
                            if(levels && levels > ctr)
                                mapTo( from[key], to );
                        }
                        else {
                            if(to[key]){
                                to[to[key]] = from[key];
                                delete to[key];
                            } else {
                                to[key] = from[key];
                            }
                        }
                    });
                    return to;
                }

                function dragSupported() {
                    var div = document.createElement('div');
                    return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
                }

                function ModuleFactory(element, options, attrs) {

                    var $module, scope, table, loadedTemplates,
                        loader, loading, isReady, nodata, initialized;

                    $module = {};
                    isReady = false;
                    initialized = false;

                    // allow passing element in options.
                    if(arguments.length < 3){
                        attrs = options;
                        options = element;
                        element = options.element;
                    }

                    attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

                    scope = options.scope || $rootScope.$new();
                    options = angular.extend({}, defaults, attrs, options);
                    options.element = options.element || element;

                    // gets list of user defined templates for table
                    function userTemplates(promises) {
                        var ctr = Object.keys(loadedTemplates).length -1;
                        angular.forEach(options.columns, function (v, k) {
                            if(v.headerTemplate){
                                promises.push($helpers.loadTemplate(v.headerTemplate));
                                loadedTemplates[k] = { index: ctr += 1, isHeader: true };
                            }
                            if(v.cellTemplate) {
                                promises.push($helpers.loadTemplate(v.cellTemplate));
                                loadedTemplates[k] = { index: ctr += 1 };
                            }
                        });
                    }

                    // configures table for Twitter Bootstrap styling
                    function bootstrapTemplate(template) {

                        var classes, regex;
                        classes = [];

                        if(!options.bootstrap) {
                            classes = [	'btn', 'btn-default', 'row', 'row-fluid', 'col-sm-8', 'col-sm-6',
                                'col-sm-4',	'span-8', 'span-6',	'span-4', 'span-12', 'pagination',	'form-control',
                                'table-striped', 'table-bordered',	'table-hover', 'table-condensed', 'table-responsive', 'table'
                            ];
                        } else {

                            if(!options.bordered) classes.push('table-bordered');
                            if(!options.hover)classes.push('table-hover');
                            if(!options.condensed)classes.push('table-condensed');
                            if(!options.striped)classes.push('table-striped');
                            if(!options.responsive)classes.push('table-responsive');
                        }

                        regex = new RegExp('(' + classes.join('|') + ')', 'g');
                        template = template.replace(regex, '');

                        return template;

                    }

                    // DATA LOAD/BINDING
                    function loadSource() {

                        var rows = [],
                            config = {
                                method: options.method,
                                params: options.params ||  {}
                            },
                            defer,
                            mapParams;

                        // if server enabled add params
                        if(options.server){

                            var minBatch = scope.display * 2,
                                orderBy = scope.orderBy || {},
                                pg = scope.page || 1,
                                last = scope.source.rows.length,
                                maxLimit,
                                adjLimit,
                                limit;

                            // must have a min of double displayed for paging
                            if(minBatch > options.batch) options.batch = minBatch;

                            // adjust when skipping pages ahead
                            maxLimit = ((pg-1) * scope.display) + options.batch;
                            adjLimit = maxLimit - last;
                            limit = options.batch && adjLimit > options.batch ? adjLimit : options.batch || undefined;

                            mapParams = {
                                limit: limit,
                                skip: last,
                                where: scope.q || undefined,
                                sort: orderBy.column ? orderBy.column + orderBy.reverse ? ' desc' : ' asc' : undefined
                            };

                            // map user defined params if specified
                            if(options.mapParams){
                                mapParams = mapTo(mapParams, options.mapParams || {});
                                angular.extend({}, config.params, mapParams);
                            }

                        }

                        if(angular.isArray(options.source) || angular.isObject(options.source)){

                            if(angular.isArray(options.source)){
                                rows = options.source;
                            } else  {
                                angular.forEach(options.source, function (v, k){
                                    // if an object add the key to the object
                                    if(angular.isObject(v))
                                        v._key = k;
                                    rows.push(v);
                                });
                            }

                            defer = $q.defer();
                            defer.resolve(rows);
                            return defer.promise;

                        } else  {

                            // build the config check for global http config and merge
                            config = angular.extend(config, options.config);
                            config.url = options.source;

                            // pass config for any additional prams etc
                            if(angular.isFunction(options.onLoad)){

                                var usrConfig = options.onLoad(config) || config,
                                    whereKey, sortKey, limitKey;

                                whereKey = options.mapParams.where || 'where';
                                sortKey = options.mapParams.sort || 'sort';
                                limitKey = options.mapParams.limit || 'limit';
                                config = angular.extend(config, usrConfig);
                                scope.q = config.params[whereKey];

                                options.limit = config.params[limitKey];
                                options.orderBy = config.params[sortKey];

                            }

                            // return the promise
                            return $http(config).then(function (resp) {
                                return resp.data || [];
                            }, function (resp) {
                                // on error be sure to disable loading vars
                                loading = true;
                                scope.loading = false;
                            });

                        }

                    }

                    function bind(callback, rebind) {

                        loading = false;

                        rebind = rebind || false;


                        // may want to use interceptor
                        // to catch on error etc.
                        // yes this isn't using $animate
                        // you could certainly change that
                        // using simple keyframe fadeIn for now.

                        if(options.loader){
                            loading = true;


                            // timeout prevents loader from firing for
                            // a few milliseconds set to 0 to show immediately.

                            $timeout(function () {
                                if(loading){
                                    if(loader)
                                        loader.addClass('loading');
                                    scope.loading = true;
                                }
                            }, options.loaderDelay || 0);
                        }


                        loadSource().then(function (result) {

                            var data, total;

                            data = result ? result.data || result: [];

                            // normalize our data
                            data = normalize(data);

                            if(rebind && options.server && options.batch) {

                                // concat data to existing source
                                scope.source.rows.push.apply(scope.source.rows, data.rows);


                            } else {

                                // populate scope variables
                                scope.source = data;

                            }

                            scope.filtered = scope.source.rows;
                            scope.columns = scope.source.columns;

                            // if server passed total record count use it for batch processing
                            total = result.total || scope.source.rows.length;
                            scope.total = total;

                            // disable loader
                            loading = false;
                            scope.loading = false;
                            if(loader) loader.removeClass('loading');

                            // all done callback
                            if(angular.isFunction(callback)){
                                callback();
                            } else {
                                applyOrderBy();
                                initPager();
                            }

                        });

                    }

                    // DATA NORMALIZATION
                    function mergeColumns(row) {

                        if(!row) return [];

                        var rowKeys = Object.keys(row),
                            colKeys = Object.keys(options.columns);


                        function unique(arrays) {
                            var arr = arrays.concat();
                            for(var i=0; i < arr.length; ++i) {
                                for(var j=i+1; j < arr.length; ++j) {
                                    if(arr[i] === arr[j])
                                        arr.splice(j--, 1);
                                }
                            }
                            return arr;
                        }

                        return unique(colKeys.concat(rowKeys));

                    }

                    function normalize(data) {

                        var columns = [],
                            rows = data,
                            cols;

                        // merge config columns with actual columns
                        cols = mergeColumns(data[0]);

                        // we use this column to temporarily store edits for the row
                        cols.edits = undefined;
                        options.columns.edits = { excluded: true };
                        options.columns.$$hashKey = { excluded: true };

                        angular.forEach(cols, function (key, idx) {

                            var colConf = options.columns[key],
                                colDefaults = {
                                    sortable: true,
                                    filter: false,
                                    headerClass:false,
                                    cellClass: false,
                                    headerTemplate: false,
                                    cellTemplate: false,
                                    draggable: false,
                                    resolve: undefined
                                },
                                loaded;

                            // no columns specified and auto is disabled nothing to do
                            if(options.auto === false && !colConf) return;

                            // extend defaults
                            colConf = colConf === false ? { excluded: true } : colConf;
                            colConf = angular.extend(colDefaults, colConf);
                            colConf.map = colConf.map || key;
                            colConf.label = colConf.label === '' || colConf.label === null  ? '' : colConf.label || key;
                            colConf.sortable = colConf.sortable === false ? false : options.sortable !== false; //options.sortable ? true : false;
                            colConf.accessible = colConf.accessible === false ? false : colConf.accessible === undefined ? true : colConf.accessible;

                            loaded = loadedTemplates[key] || undefined;

                            if(colConf.headerTemplate) {
                                if(loaded && loaded.isHeader){
                                    colConf.headerTemplate = loaded.template;
                                }
                            }

                            // check for user defined column template
                            if (colConf.cellTemplate) {
                                if (loaded && !loaded.isHeader) {
                                    colConf.cellTemplate = loaded.template;
                                }
                            }

                            columns.push(colConf);

                        });

                        return { columns: columns, rows: rows };
                    }

                    // FILTERING
                    function filter() {
                        applyFilter();
                    }

                    // filters records
                    function applyFilter(q) {

                        var orderBy = scope.orderBy;

                        if(scope.editing) {
                            scope.q = undefined;
                            return;
                        }

                        // use query passed or scope query
                        q = q || scope.q;

                        // if server filtering is enabled send query to server
                        if(options.server && options.batch && options.serverFilter){
                            bind(function () {
                                scope.q = undefined;
                                done();
                            });
                        } else {
                            done();
                        }

                        // apply local or user filter
                        function done() {

                            var filtered;


                            // check if user filter is used
                            if(angular.isFunction(options.beforeFilter)){

                                $q.when(options.beforeFilter(scope.source.rows, q))
                                    .then(function (resp) {

                                        if(angular.isArray(resp)){
                                            scope.filtered = $filter('orderBy')(resp, orderBy);
                                        } else {
                                            scope.filtered = $filter('filter')($filter('orderBy')
                                            (scope.source.rows, orderBy), resp);
                                        }

                                        // when queried we need to reset the pager
                                        scope.page = 1;
                                        initPager(1);

                                    });

                            } else if(!options.serverFilter){

                                scope.filtered = $filter('filter')($filter('orderBy')
                                (scope.source.rows, orderBy), q);

                                // when queried we need to reset the pager
                                scope.page = 1;
                                initPager(1);

                            }

                        }

                    }

                    // clears filter
                    function reset() {



                        if(scope.editing) return;

                        scope.q = undefined;
                        scope.page = 1;
                        selectAllRows(false);

                        if(angular.isFunction(options.onReset)) {
                            options.onReset();
                        }

                        applyFilter();

                    }

                    // ORDERING
                    // applies sort order
                    function sort(column) {

                        var stripped = scope.orderBy && angular.isString(scope.orderBy) ? scope.orderBy.replace('-', '') : undefined,
                            orderBy = scope.orderBy;

                        // do not sort if column or sorting is disabled
                        if(options.sortable === false || column.sortable === false) return;

                        // a simple property name may have been passed account for it
                        column = angular.isObject(column) ? column.map : column;

                        if(orderBy && stripped === column){
                            if(orderBy.charAt(0) === '-')
                                orderBy = orderBy.replace('-', '');
                            else
                                orderBy = '-' + orderBy;
                        } else {
                            orderBy = column;
                        }

                        scope.orderBy = orderBy;

                        applyOrderBy();

                    }

                    // orders records
                    function applyOrderBy(orderBy, rows) {

                        if(scope.editing) return;

                        // if null vars pass use scope vars
                        rows = rows || scope.filtered;
                        orderBy = orderBy || scope.orderBy;

                        // order the rows
                        scope.filtered = $filter('orderBy')(rows, orderBy);

                    }

                    function selectAllRows(state) {

                        if(scope.editing) return;

                        scope.selectAll = state;
                        scope.selected = [];
                        angular.forEach(scope.filtered, function(row) {
                            row.selected = state;
                            if(state === true)
                                scope.selected.push(row);
                        });
                        return scope.selected;
                    }

                    // PAGING METHODS
                    // pages to specified page
                    function pageTo(pg) {

                        var factor = scope.display * pg;

                        if(scope.editing || scope.indices.filtered === 1 || (pg > scope.indices.max)) return;

                        // set the page
                        scope.page = pg;

                        // reset goto manual page input
                        scope.gotoPage = undefined;

                        // if the page is not loaded in reinit pager
                        // if requested page is beyond max index
                        // bind to add additoinal rows

                        if(!loadedPage(pg)){
                            if(scope.source.rows.length < factor || pg > scope.indices.filtered){
                                bind(initPager, true);
                            } else {
                                initPager(pg);
                            }
                        } else {
                            setFilteredRows(pg);
                        }

                    }

                    function pageToKeyUp(event, pg) {
                        var keyCode = event.which || event.keyCode;
                        if(keyCode === 13)
                            pageTo(pg);
                    }

                    function pagePrev(pg) {
                        if(!hasPrev(pg)) return;
                        pageTo(pg -1);
                    }

                    function pageNext(pg) {
                        if(!hasNext(pg)) return;
                        pageTo(pg +1);
                    }

                    // checks if has a previous page
                    function hasPrev(pg) {
                        pg = pg || scope.page;
                        return pg - 1 > 0;
                    }

                    // checks if has next page
                    function hasNext(pg) {
                        var pageCount = Math.ceil(scope.filtered.length / options.display);
                        pg = pg || scope.page;
                        return (pg - 1) < pageCount - 1;

                    }

                    // HELPER METHODS
                    function loadedPage(pg) {
                        var maxPg = scope.indices.filtered,
                            factor = scope.display * pg;
                        if(scope.source.rows.length < factor || pg > maxPg)
                            return false;
                        return scope.pages.indexOf(pg) !== -1;
                    }

                    function setFilteredRows(pg) {

                        var start, end;
                        pg = pg || scope.page;

                        start = pg === 1 ? 0 : (pg -1) * scope.display;
                        end = start + scope.display;

                        scope.filteredRows = { start: start, end: end };

                    }

                    function changeDisplay(disp) {

                        if(scope.editing) return;

                        scope.display = parseInt(disp);
                        scope.page = 1;
                        bind(initPager, true);

                    }

                    // return the sort class to header column if enabled
                    function sortClass(column) {

                        var result, stripped, orderBy;

                        // do not sort if column or sorting is disabled
                        if (options.sortable === false || !column.sortable) return '';

                        orderBy = angular.copy(scope.orderBy) || undefined;

                        // can't set sort indicators on custom sort function
                        if(angular.isFunction(orderBy)) return;

                        // if orderby is array its a custom sort
                        if(angular.isArray(orderBy)) {
                            var match = false;
                            angular.forEach(orderBy, function (o) {
                                if(match) return;
                                stripped = o.replace('-', '');
                                if(stripped === column.map){
                                    orderBy = o;
                                    match = true;
                                }
                            });
                        } else {
                            stripped = orderBy ? orderBy.replace('-', '') : undefined;
                        }

                        if(orderBy && column.map === stripped){
                            if(orderBy.charAt(0) === '-')
                                return 'descending';
                            return 'ascending';
                        } else {
                            return 'unsorted';
                        }

                    }

                    function filterEvents (obj, regex, asObject) {
                        var objKeys = {},
                            arrKeys = [],
                            exclude = ['onSelect', 'onBind', 'onLoad', 'onDelete', 'onReset'],
                            key;
                        for (key in obj) {
                            if (obj.hasOwnProperty(key) && regex.test(key)) {
                                if(obj[key]) {
                                    if(exclude.indexOf(key) === -1){
                                        arrKeys.push(key);
                                        objKeys[key.toLowerCase().replace('on', '')] = { key: key, callback: obj[key] };
                                    }
                                }
                            }
                        }
                        if(asObject)
                            return objKeys;
                        return arrKeys;
                    }

                    // EVENTS
                    function selectRow(e, row, idx) {

                        if(scope.editing) return;

                        // get the row index
                        if(angular.isNumber(row))
                            row = scope.source.rows[row] || undefined;

                        if(row) {scope.selected = [];

                            // multi select enabled.
                            if (scope.selectable !== 'multi') {

                                angular.forEach(scope.filtered, function (r, i) {
                                    if(i !== idx)
                                        r.selected = false;
                                });
                                row.selected =! row.selected;
                                if(row.selected)
                                    scope.selected.push(row);

                            } else {

                                row.selected =! row.selected;
                                angular.forEach(scope.filtered, function (r, i) {
                                    if(i !== idx)
                                        row.active = false;
                                    if (r.selected)
                                        scope.selected.push(r);
                                });
                                row.active =! row.active;
                            }

                        }

                        if(angular.isFunction(options.onSelected)){
                            var selectedResult = scope.selected;
                            if(!options.multiple)
                                selectedResult = scope.selected[0];
                            options.onSelected(row || undefined, scope.selected, e);
                        }

                    }

                    function selectTableRow(e, row, idx) {

                        if (scope.editing || !scope.selectable) return;

                        // fire only if left click.
                        if(!e && e.button !== 0 && e.button !== 1) return;

                        var target = angular.element(e.target);

                        // make sure target is cell.
                        if(!target.hasClass('ai-table-cell') &&
                            !target.hasClass('ai-table-cell-view')){
                            return false;
                        }

                        selectRow(e, row, idx);

                    }

                    function deleteRow(row) {

                        if(scope.editing) return;

                        if(angular.isNumber(row))
                            row = scope.source.rows[row] || undefined;

                        if(row) {

                            //if before delete wrap in promise you can return promise, true or call done
                            if(angular.isFunction(options.beforeDelete)){

                                $q.when(options.beforeDelete(row, done)).then(function (resp) {
                                    if(resp) done(true);
                                });

                            } else {
                                done();
                            }
                        }

                        function done() {

                            // remove the row from the collection
                            scope.source.rows.splice(scope.source.rows.indexOf(row), 1);

                            // we might have deleted a selected item if so remove it from selected as well
                            if(scope.selected && scope.selected.length){
                                if(scope.selected.indexOf(row) !== -1)
                                    scope.selected.splice(scope.selected.indexOf(row), 1);
                            }

                            // update filtered rows have changed
                            scope.filtered = scope.source.rows;

                            scope.q = undefined;

                            // init pager counts changed
                            initPager();

                        }

                    }

                    function findRow(key, value) {

                        // key is predicate function
                        // just a convenience wrapper really
                        if(angular.isFunction(key))
                            scope.source.rows.filter(key);

                        // key is key/value pair(s) iterate find using expression
                        if(angular.isObject(key))
                            return scope.source.rows.filter(function (row) {
                                return Object.keys(key).every(function(k) {
                                    return new RegExp(key[k]).test(row[k]);
                                });
                            });

                        // key is property name, value is its property
                        if(key && value) {
                            return scope.source.rows.filter(function (row) {
                                return Object.keys(row).every(function(k) {
                                    return new RegExp(value).test(row[k]);
                                });
                            });
                        }

                        // return empty array invalid criteria
                        return [];

                    }

                    function editRow(row, cancel) {

                        var editCols, edits, idx, editIdx;

                        if(!row) return;

                        if(scope.selected.length){
                            alert('You cannot edit rows while selecting.');
                            return false;
                        }

                        if(angular.isNumber(row))
                            row = scope.source.rows[row] || undefined;

                        // index of the pass row
                        idx = scope.source.rows.indexOf(row);

                        // index of the current row being edited if any
                        if(scope.editing){
                            editIdx = scope.source.rows.indexOf(scope.editing);
                            /* not the edited row reset the previous */
                            if(editIdx !== idx){
                                scope.editing.edits = undefined;
                                scope.editing = undefined;
                            }
                        }

                        if(row){

                            editCols = scope.source.columns.filter(function (col) {
                                return !!col.editType;
                            }) || [];

                            if(editCols.length){
                                if(!row.edits){
                                    edits = mapTo(row);
                                    row.edits = edits;
                                    scope.editing = row;
                                } else {

                                    if(angular.isFunction(options.beforeUpdate)){
                                        $q.when(options.beforeUpdate(row.edits)).then(function (resp) {
                                            if(resp) done(resp);
                                            else editRowCancel(); // cancel if failed update.
                                        });
                                    } else {
                                        done();
                                    }

                                }
                            } else {
                                alert('No columns are editable.');
                            }

                        }

                        function done(resp) {
                            row = angular.extend(row, row.edits);
                            row.edits = undefined;
                            scope.editing = undefined;
                        }

                    }

                    function editRowCancel() {
                        if(!scope.editing) return;
                        scope.editing.edits = undefined;
                        scope.editing = undefined;
                    }

                    function ready(fn) {

                        var wait;

                        function done() {
                            if(angular.isFunction(fn)){
                                if(isReady) {
                                    clearInterval(wait);
                                    fn.call($module, scope);
                                }
                            }
                        }

                        wait = setInterval(done, 50);

                    }

                    function exportURI() {

                        var content = 'data:text/csv;charset=utf-8,',
                            keys,
                            link,
                            encoded;

                        if(angular.isFunction(options.beforeDownload)){
                            $q.when(options.beforeDownload(scope.filtered, 'download.csv' ))
                                .then(function (resp) {
                                    if(resp && angular.isObject(resp)) {
                                        done(resp.filtered, resp.fileName);
                                    }
                                });
                        } else {
                            done(scope.filtered, 'download.csv');
                        }

                        function done(filtered, fileName) {

                            if(!filtered || !filtered.length) return;

                            fileName = fileName || 'download.csv';

                            keys = Object.keys(filtered[0]);

                            /* create header keys */
                            keys.splice(keys.indexOf('$$hashKey'), 1);
                            content += keys.join(',') + '\n';

                            angular.forEach(filtered, function (row, idx) {
                                var str, ctr;
                                str = '';
                                ctr = 1;
                                angular.forEach(row, function (col, key) {
                                    if(key !== '$$hashKey'){
                                        if(ctr < keys.length)
                                            content += (col + ',');
                                        else
                                            content += (col + '\n');
                                    }
                                    ctr +=1;
                                });
                            });

                            encoded = encodeURI(content);

                            link = document.createElement('a');
                            link.setAttribute('href', encoded);
                            link.setAttribute('download', fileName);

                            link.click();

                        }

                    }

                    // BINDING SCOPE
                    function bindScope() {

                        scope.source =  {
                            columns: [],
                            rows: []
                        };
                        scope.columns = [];
                        scope.filtered = [];
                        scope.orderBy = options.orderBy;
                        scope.uppercase = options.uppercase;

                        scope.changeDisplay = changeDisplay;
                        scope.displayed = [5,10,25,50];
                        scope.display = options.display;

                        scope.selected = [];
                        scope.selectable = options.selectable !== false;
                        scope.selectableAll = options.selectableAll;
                        scope.changeable = options.changeable !== false;
                        scope.selectAll = false;
                        scope.selectAllRows = selectAllRows;
                        scope.selectTableRow = selectTableRow;
                        scope.deleteRow = deleteRow;
                        scope.editRow = editRow;
                        scope.cancelEdit = editRowCancel;
                        scope.editing = undefined;
                        scope.draggable = dragSupported();
                        scope.orderable = options.orderable;
                        scope.exportable = options.exportable;
                        scope.exportURI = exportURI;


                        // define actions template, searchability etc
                        scope.actions = options.actions !== false;
                        scope.searchable = options.searchable !== false;
                        scope.filter = filter;
                        scope.reset = reset;
                        scope.q = undefined;
                        scope.sort = sort;
                        scope.sortClass = sortClass;

                        /* add pager to scope */
                        scope.page = 1;
                        scope.pager = options.pager !== false;
                        scope.pages = [];
                        scope.pageTo = pageTo;
                        scope.pageToKeyUp = pageToKeyUp;
                        scope.pagePrev = pagePrev;
                        scope.pageNext = pageNext;
                        scope.hasNext = hasNext;
                        scope.hasPrev = hasPrev;
                        scope.counts = options.counts !== false;
                        scope.pagination = options.pagination !== false;
                        scope.firstLast = options.firstLast;
                        scope.goto = options.goto;
                        scope.gotoPage = undefined;

                        scope.options = options;

                        /* indicates a source is being loaded */
                        scope.loading = false;

                        /* maps event options to lower for matching jquery event.type */
                        scope.eventMap = filterEvents(options, /^on.+$/i, true);

                        scope.bind = bind;
                        scope.init = init;
                    }

                    // BIND METHODS
                    function bindMethods() {

                        $module.getSource = function getSource() { return scope.source; };
                        $module.getSelected = function getSelected() { return scope.selected; };
                        $module.getEditing = function getEditing() { return scope.editing; };
                        $module.getOrderBy = function getOrderBy() { return scope.orderBy; };

                        $module.setRows = function setRows(arr) {
                            var data = normalize(arr);
                            scope.source.rows = data.rows;
                            scope.filtered = data.rows;
                            initPager(1);
                        };

                        $module.options = options;

                        $module.isDraggable = dragSupported();

                        $module.pageTo = pageTo;
                        $module.hasPrev = hasPrev;
                        $module.hasNext = hasNext;
                        $module.pagePrev = pagePrev;
                        $module.pageNext = pageNext;
                        $module.loadedPage = loadedPage;

                        $module.filter = applyFilter;
                        $module.sort = applyOrderBy;
                        $module.reset = reset;
                        $module.exportURI = exportURI;

                        $module.findRow = findRow;
                        $module.selectRow = selectRow;
                        $module.deleteRow = deleteRow;
                        $module.selectAllRows = selectAllRows;
                        $module.editRow = editRow;
                        $module.cancelEdit = editRowCancel;

                        $module.ready = ready;
                        $module.bind = bind;
                        $module.init = init;
                    }

                    // INITIALIZATION METHODS
                    function initPager(pg) {

                        var start, end, limit, filteredTotal, serverTotal;

                        /* define update vars */
                        pg = pg || scope.page;
                        scope.display = scope.display || options.display || 10;
                        limit = scope.display;
                        filteredTotal = Math.ceil(scope.filtered.length / limit);
                        serverTotal = Math.ceil(scope.total / limit);
                        scope.pages = [];

                        applyOrderBy();

                        /* if pager is disabled build out single page */
                        if(options.pager === false){
                            scope.page = pg = 1;
                            scope.display = limit = scope.filtered.length;
                        }

                        start = pg < options.pages ? 1 : Math.ceil(pg - (options.pages / 2));
                        end = start + options.pages;

                        // make sure last page displayed full display of page options
                        if(end > filteredTotal){
                            end = filteredTotal +1;
                            start = end - options.pages;
                        }
                        if(end > serverTotal){
                            end = serverTotal +1;
                            start = end - options.pages;
                        }
                        if(start < 1) start = 1;

                        /*
                         * stores the start, end, filtered and max page numbers
                         * start: ex: 1 first page in active pager pages
                         * end: ex: 5 last page in active pages where options.pages size is 5
                         * filtered: ex: 10 the last possible for records may or may not be active.
                         * max: ex: 25 typically max = filtered however if batch/server enabled this could be higher number
                         *      to allow going back to the server but maintaining page numbers.
                         */
                        scope.indices = {
                            start: start,
                            end: end,
                            filtered: filteredTotal,
                            max: serverTotal
                        };

                        // build the array of pages
                        scope.pages = range(start, end);

                        // set index range to display.
                        setFilteredRows(pg);

                    }

                    // Initialize
                    function init() {

                        var promises,
                            templates;

                        // make sure we have a valid element
                        if(!element) return;

                        // empty the element.
                        element.empty();

                        // initialize array w/ primary templates
                        promises = [
                            $helpers.loadTemplate(options.actionsTemplate),
                            $helpers.loadTemplate(options.tableTemplate),
                            $helpers.loadTemplate(options.pagerTemplate),
                            $helpers.loadTemplate(options.nodataTemplate),
                            $helpers.loadTemplate(options.loaderTemplate)
                        ];

                        // track index/details of loaded templates
                        loadedTemplates = {
                            actions: { index: 0 },
                            table: { index: 1 },
                            pager: { index: 2 },
                            nodata: { index: 3 },
                            loader: { index: 4 }
                        };

                        // adds user templates to promises
                        userTemplates(promises);

                        // load promises
                        templates = $q.all(promises);

                        // bind scope
                        bindScope();

                        // bind table methods
                        bindMethods();

                        // resolved templates
                        templates.then(function (t) {

                            var template, tableTemplate;

                            // iterated loadedTemplates object and populate with promised template
                            angular.forEach(loadedTemplates, function (loaded) {
                                if(t[loaded.index])
                                    loaded.template = t[loaded.index];
                            });

                            bind(function() {

                                nodata = !scope.filtered || !scope.filtered.length || (options.auto === false && !Object.keys(options.columns).length);

                                // disable pager and action rows if no data present
                                if(nodata){
                                    scope.pager = false;
                                    scope.actions = false;
                                }

                                // make sure the user defined displayed is in part of array
                                if(scope.displayed.indexOf(options.display) === -1){
                                    scope.displayed.push(options.display);
                                    scope.displayed.sort(function(a,b){ return a-b; });
                                }

                                // initialize sort order
                                applyOrderBy(options.orderBy);

                                // initialize paging
                                initPager();

                                // if no rows supply nodata template
                                tableTemplate = nodata ? loadedTemplates.nodata.template :
                                '<div class="ai-table-wrapper ai-table-responsive">' + loadedTemplates.loader.template + loadedTemplates.table.template + '</div>';

                                // build the entire template
                                template = loadedTemplates.actions.template + tableTemplate + loadedTemplates.pager.template;

                                // set bootstrap classes
                                template = bootstrapTemplate(template);

                                // replace our original element
                                //element.replaceWith(table);
                                element.html(template);

                                $helpers.compile(scope, element.contents());

                                // find loader element
                                loader = $helpers.findElement('.ai-table-loader');

                                isReady = true;

                                // check for user bind event
                                if(!initialized)
                                    ready(options.onBind);

                                // prevents calling ready
                                // after already initialized.
                                initialized = true;

                            });

                        });

                    }

                    // initialize the table
                    init();

                    return $module;
                }

                return ModuleFactory;

            }];

        return {
            $get: get,
            $set: set
        };

    }])

    /*
     * TABLE DIRECTIVE
     * primary table directive.
     */
    .directive('aiTable', ['$table', function aiTable ($table) {

        return {
            restrict: 'EAC',
            scope: true,
            link: function link(scope, element, attrs) {

                var defaults, options, $module;

                defaults = {
                    scope: scope
                };

                function init() {

                    /* initialize the new table */
                    $module = $table(element, options, attrs);

                    // todo probably shouldn't live here.
                    $module.ready(function() {
                        scope.instance = this;
                    });

                }

                scope.$watch(
                    function () {
                        return attrs.aiTable || attrs.aiTableOptions;
                    }, function (newVal, oldVal) {
                        if(newVal === oldVal) return;
                    }, true);


                scope.$on('$destroy', function () {
                    element.remove();
                    $module = null;
                    options = null;
                });

                options = scope.$eval(attrs.aiTable || attrs.aiTableOptions);
                options = angular.extend(defaults, options);

                init();

            }
        };

    }])

    /*
     * TABLE HEADER
     * compiles header columns.
     */
    .directive('aiTableHeader', ['$compile', function aiTableHeader ($compile) {


        function addRemoveListener(elem, arr, remove){

            angular.forEach(arr, function (listener) {
                if(remove) {
                    elem.removeEventListener(listener.name, listener.event, false);
                } else {
                    elem.addEventListener(listener.name, listener.event, false);
                }
            });
        }

        function findParent(el) {
            var p = el.parentNode,
                parent;
            while (p !== null && !parent) {
                var o = p;
                angular.forEach(o.classList, function (c) {
                    if(!parent)
                        if(c === 'table')
                            parent = o;
                });
                p = o.parentNode;
            }
            return parent;
        }

        return {
            restrict: 'AEC',
            link: function link(scope, element) {

                var init, isAccessible;

                init = function init() {

                    var value = scope.column.label,
                        headerClass = scope.column.headerClass || null,
                        listeners = [];

                    if(scope.column.excluded || scope.column.map === '$$hashKey') return;

                    element.html('');

                    // add css if any.
                    if(headerClass)
                        element.addClass(headerClass);

                    if(angular.isFunction(scope.column.accessible))
                        isAccessible = scope.column.accessible;
                    else
                        isAccessible = function () {
                            return scope.column.accessible;
                        };


                    // check column permissions if any.
                    if(!isAccessible()){
                        scope.column.excluded = true;
                        return;
                    }

                    if(!scope.column.header) {
                        if(angular.isString(value) && scope.$parent.$parent.uppercase !== false)
                            value = value.charAt(0).toUpperCase() + value.slice(1);
                        element.text(value);

                    } else {

                        element.html(scope.column.header);
                        $compile(element.contents())(scope);
                    }

                };

                init();

            }
        };

    }])

    /*
     * TABLE CELL
     * compiles cell columns.
     */
    .directive('aiTableCell', [ '$compile', '$filter', '$parse', '$q', function aiTableCell ($compile, $filter, $parse, $q) {

        function findParent(el) {
            var p = el.parentNode,
                parent;
            while (p !== null && !parent) {
                var o = p;
                angular.forEach(o.classList, function (c) {
                    if(!parent)
                        if(c === 'table')
                            parent = o;
                });
                p = o.parentNode;
            }
            return parent;
        }

        return {
            restrict: 'AEC',
            link: function link(scope, element) {

                var	row = scope.row,
                    column = scope.column,
                    value = row[column.map],
                    cellClass = column.cellClass || column.headerClass || null,
                    events = Object.keys(scope.eventMap),
                    filter = column.filter,
                    cellTemplate = column.cellTemplate || undefined,
                    viewTemplate = '<div class="ai-table-cell-view" ng-show="!row.edits || !column.editType" ng-bind="viewValue"></div>',
                    editTemplate = column.editTemplate || undefined,
                    editInputTemplate = '<div class="ai-table-cell-edit" ng-show="row.edits"><input ng-model="modelValue" type="{{type}}" class="form-control" /></div>',
                    editSelectTemplate = '<div class="ai-table-cell-edit" ng-show="row.edits"><select class="form-control" ng-model="modelValue" ng-options="{{options}}" ></select></div>',
                    editTextareaTemplate = '<div class="ai-table-cell-edit" ng-show="row.edits"><textarea ng-model="modelValue" class="form-control" /></textarea>',
                    getter = $parse(column.map),
                    isAccessible;

                // create string of events sep. by space
                events = events.join(' ');

                column.editType = column.editTemplate ? 'custom' : column.editType;

                // get a reference to the tables parent scope
                scope.parent = angular.element(findParent(element[0])).scope();

                // parse using getter and filter if required
                function parse(filter) {
                    filter = filter || false;
                    if(filter)
                        return applyFilter(getter(row));
                    return getter(row);
                }

                function applyFilter(val) {

                    if(filter) {

                        if(angular.isFunction(filter)){
                            val = filter(val, scope.column);
                        }else {
                            filter = filter.replace(/\s?([|])\s?/, '|').replace(/^\s?|\s?$/g, '');
                            filter = filter.split('|');
                            if($filter(filter[0]))
                                val = $filter(filter[0])(val, filter[1]);
                        }
                    }

                    return val;
                }

                function compile() {

                    // add scope var parse and filter
                    scope.viewValue = parse(true);
                    scope.modelValue = parse();

                    if(angular.isFunction(column.accessible))
                        isAccessible = column.accessible;
                    else
                        isAccessible = function () {
                            return column.accessible;
                        };

                    // define the default or cell template
                    if(cellTemplate)
                        viewTemplate = '<div class="ai-table-cell-view" ng-show="!row.edits || !column.editType">' + cellTemplate + '</div>';

                    if(editTemplate){
                        editTemplate = '<div class="ai-table-cell-edit" ng-show="row.edits">' + editTemplate + '</div>';
                        viewTemplate += editTemplate;
                    }

                    // check for editTemplate append to viewTemplate
                    if(column.editType && !editTemplate) {
                        if(column.editType !== 'select' && column.editType !== 'textarea'){
                            editInputTemplate = editInputTemplate.replace('{{type}}', column.editType);
                            viewTemplate += editInputTemplate;
                        }else {
                            if(column.editType === 'select' && column.editOptions){
                                editSelectTemplate = editSelectTemplate.replace('{{options}}', column.editOptions);
                                viewTemplate += editSelectTemplate;
                            }
                            if(column.editType === 'textarea') {
                                viewTemplate += editTextareaTemplate;
                            }
                        }
                    }


                    // check column permissions if any
                    if(!isAccessible()){
                        column.excluded = true;
                        return;
                    }

                    // compile the template and add html
                    element.html(viewTemplate);
                    $compile(element.contents())(scope);

                }

                function init() {

                    if(scope.column.excluded || scope.column === false || scope.column.map === '$$hashKey') return;

                    // clear contents if any and disable events
                    element.html('');
                    element.off(events);

                    // add css class if any
                    if(cellClass)
                        element.addClass(cellClass);

                    if(events && events.length) {
                        element.on(events, function (e) {

                            var ev = scope.eventMap[e.type],
                                selected = [];

                            // return if not a valid callback
                            if(!ev || !ev.callback || !angular.isFunction(ev.callback)) return;

                            // apply to scope and callback the request event(s)
                            scope.$digest(function () {
                                ev.callback.call(this, row, scope.column, e);
                            });

                        });
                    }


                    // if resolve value is required use promise then compile column
                    // scope.resolvedValue will te set to the returned value

                    if(angular.isFunction(column.resolve)) {
                        $q.when(column.resolve(row, column)).then(function (resp) {
                            if(resp)
                                scope.resolvedValue = resp;
                            compile();
                        });
                    } else {
                        compile();
                    }

                }

                scope.$watch(function () {
                    return scope.row[scope.column.map];
                }, function (newValue, oldValue) {
                    if(newValue === oldValue) return;
                    if(!scope.editing){
                        scope.viewValue = parse(newValue, true);
                        if(angular.isFunction(column.resolve)){
                            $q.when(column.resolve(row, column)).then(function (resp) {
                                if(resp)
                                    scope.resolvedValue = resp;
                            });
                        }
                    }
                });

                scope.$watch('modelValue', function (newValue, oldValue) {
                    if(newValue === oldValue) return;
                    if(scope.editing){
                        row.edits[column.map] = newValue;
                    }
                });


                init();

            }
        };

    }]);
angular.module('ai.tree', ['ai.helpers'])
    .provider('$tree', function $tree() {

        var defaults = {
            template: 'ai-tree.html',                   // the template to be used, accepts, html, path, or cashed view name.
            labelTemplate: 'ai-tree-label.html',        // the template used for the tree element's label.
            label: 'label',                             // the property used for display.
            value: 'value',                             // the property used for value.
            children: 'children',                       // the property used for child elements.
            active: 'active',                           // the property used to indicated the element is checked or active.
            method: 'get',                              // when and endpoint is specified in model.
            params: {},                                 // params to be passed when model is an endpoint.
            icon: true,                                 // when NOT false icon is displayed left of label.
            expanded: false,                            // when true tree loads with all nodes expanded.
            expandAll: false,                           // when true all child nodes are expanded when either expanded or parent selects all.
            onSelect: undefined,                        // callback when item is clicked returns node, treeModel & event.
            onToggle: undefined,                        // callback when expanded/collapsed returns node, treeModel & event.
            onReady: undefined                          // callback when loaded.
        }, get, set;

        set = function set(key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        get = [ '$helpers', '$q', '$http', '$rootScope', function get($helpers, $q, $http, $rootScope) {

            var treeTemplate =
                '<ul>' +
                    '<li ng-repeat="node in nodes track by $index">' +
                        '<span class="ai-tree-caret" ng-class="{expanded: node.expanded}" ng-show="node.toggle" ' +
                            'ng-click="toggle($event, node)"></span>' +
                        '<div class="ai-tree-item" ng-click="select($event, node)" ng-class="node.state">' +
                            '<span class="ai-tree-icon" ng-if="node.icon"></span>' +
                            '{{LABEL_TEMPLATE}}' +
                        '</div>' +
                        '<ai-tree ng-if="node.children" ' +
                            'ng-show="node.expanded" ' +
                            'ng-model="node.children" ' +
                            'ai-tree-options="options" ' +
                            'class="ai-tree-child"' +
                            '>' +
                        '</ai-tree>' +
                    '</li>' +
                '</ul>';

            var labelTemplate = '<span class="ai-tree-label" ng-bind="node.label"></span>';

            $helpers.getPutTemplate(defaults.template, treeTemplate);
            $helpers.getPutTemplate(defaults.labelTemplate, labelTemplate);

            function ModuleFactory(element, options, attrs){

                var $module = {},
                    treeModel,
                    model,
                    scope;

                if(!element)
                    return console.error('Cannot configure tree with element of undefined.');

                attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

                options = options || {};
                scope = $module.scope = options.scope || $rootScope.$new();
                options = $module.options = scope.options = angular.extend({}, defaults, options, attrs);
                $module.element = scope.element = element;

                // the current model may be nested.
                model = options.model;

                // the root tree model.
                treeModel = options.tree.options.model;

                // get templates.
                function getTemplates() {
                    var promises = [
                        $helpers.loadTemplate(options.template),
                        $helpers.loadTemplate(options.labelTemplate)
                    ];
                    return $q.all(promises);
                }

                // get data collection.
                function loadData(m, cb) {

                    if(angular.isArray(m))
                        return cb(m);

                    // if string get via http
                    if(angular.isString(m)){
                        $http.get(m, {
                            params: options.params
                        }).then(function (res) {
                            model = res.data;
                            treeModel = options.tree.options.model = res.data;
                            cb(res.data);
                        }, function (res) {
                            console.error(res);
                            cb();
                        });
                    } else {
                        cb();
                    }

                }

                // check if node is a parent node.
                function isParent(node){
                    return (node.children && node.children.length);
                }

                // iterate children and set active.
                function toggleChildren(arr, value){
                    angular.forEach(arr, function (n) {
                        if(n.children)
                            toggleChildren(n.children, value);
                        n.active = value;
                    });
                }

                // normalize data and properties.
                function normalizeData(arr) {
                    angular.forEach(arr, function (node) {
                        // support specifying only values.
                        // set label to value if label is absent.
                        node.label = node[options.label || options.value];
                        node.value = node[options.value];
                        node.children = node[options.children];
                        node.active = node[options.active] || false;
                        node.toggle = false;
                        node.icon = options.icon === false ? false : true;
                        if(isParent(node)){
                            node.options = options;
                            node.expanded = options.expanded || node.expanded || false;
                            node.toggle = true;
                        }
                    });
                }

                // gets all child nodes
                function getChildren(arr) {
                    var children = [];
                    angular.forEach(arr, function (n) {
                        if(isParent(n)){
                            var nestedChildren = getChildren(n.children);
                            children = children.concat(nestedChildren);
                        } else {
                            children.push(n);
                        }
                    });
                    return children;
                }

                // sets tree checked state.
                function setState(arr) {
                    var selected = [];
                    angular.forEach(arr, function(n) {
                        if(isParent(n)){
                            var activeChildren = setState(n.children);
                            var maxChildren = getChildren(n.children);
                            if(maxChildren.length === activeChildren.length)
                                n.state = 'checked';
                            else if(activeChildren.length > 0)
                                n.state = 'intermediate';
                            else
                                n.state = 'unchecked';
                            selected = selected.concat(activeChildren);
                        }else {
                            if(n.active){
                                n.state = 'checked';
                                selected.push(n);
                            } else {
                                n.state = 'unchecked';
                            }
                        }
                    });
                    options.tree.selected = selected;
                    return selected;
                }

                // expands children nodes if any.
                function expandChildren(arr, state) {
                    angular.forEach(arr, function (n) {
                        if(isParent(n)){
                            if(state !== undefined)
                                n.expanded = state
                            else
                                n.expanded =! n.expanded;
                            expandChildren(n.children, state);
                        }
                    });
                }

                // when child nodes are expanded/collapsed.
                function toggle(event, node, state) {
                    var isClick = event && event.type === 'click';
                    if(!isClick){
                        state = node;
                        node = event;
                        event = null;                    }
                    if(state === undefined)
                        node.expanded =! node.expanded;
                    else
                        node.expanded = state;
                    if(undefined !== state || options.expandAll)
                        expandChildren(node.children, state);
                    if(angular.isFunction(options.onToggle)){
                        options.onToggle(node, treeModel, event);
                    }
                }

                // get the selected nodes.
                function selected() {
                    return options.tree.selected;
                }

                // select a node
                function select(event, node) {
                    var isClick = event && event.type === 'click';
                    if(!isClick){
                        node = event;
                        event = null;
                    }
                    if(isParent(node)) {
                        node.active =! node.active;
                        toggleChildren(node.children, node.active);
                        if(node.active)
                            toggle(event, node, true);
                    } else {
                        node.active =! node.active;
                    }
                    setState(treeModel);
                    if(angular.isFunction(options.onSelect)){
                        options.onSelect(node, treeModel, event);
                    }
                }

                $module.select = scope.select = select;
                $module.toggle = scope.toggle = toggle;
                $module.selected = scope.selected = selected;

                // initialize the tree view.
                function init() {

                    loadData(model, function (data) {

                        if(!data) return;

                        // normalize the model properties.
                        normalizeData(data);

                        // set initial check state.
                        setState(treeModel);

                        $module.nodes = scope.nodes = data;

                        getTemplates().then(function(t) {

                            var _template = t[0],
                                _labelTemplate = t[1];
                            _template = _template.replace('{{LABEL_TEMPLATE}}', _labelTemplate);
                            element.empty().append($helpers.compile(scope, _template));

                            if(angular.isFunction(options.onReady) && !options.tree.ready){
                                options.onReady(options.tree, treeModel);
                                options.tree.ready = true;
                            }

                        });

                        // don't wait for templates.
                        return $module;

                    });
                }

                init();

                return $module;

            }

            return ModuleFactory;

        }];

        return {
            $get: get,
            $set: set
        };

    })
    .directive('aiTree', ['$tree', '$helpers', function ($tree, $helpers) {

        return {
            restrict: 'EAC',
            scope: true,
            link: function (scope, element, attrs, ngModel) {

                var defaults, options, $module, tmpModel;
                defaults = {
                    scope: scope
                };

                function init() {
                    $module = $tree(element, options, attrs);
                }

                // get local options
                options = (scope.$eval(attrs.aiTree || attrs.aiTreeOptions)) || {};

                // make sure parent scope
                // doesn't polute child.
                delete options.scope;

                // save the original scope.
                options.tree = options.tree || scope;

                options = angular.extend(defaults, options);
                options.model = attrs.ngModel || options.model;
                if(angular.isString(options.model) && !/\//g.test(options.model))
                    options.model = scope.$eval(options.model);

                init();

            }
        };

    }]);
var form = angular.module('ai.validate', ['ai.helpers'])
.provider('$validate', function $validate() {

    var defaults = {
            elements: ['input','textarea','select'],
            exclude: [],                                                        // array of name attributes to exclude from mapping.
            template: '<span class="ai-validate-message">{{message}}</span>',   // the template to use for ai-validation-message. can be html string,
                                                                                // 'tooltip top' where "top" is the bootstrap position
                                                                                // of the tooltip. positions ('top', 'right', 'bottom', 'left')
            tooltipClass: 'animated fadeIn',                                    // the additional classes to add. if null no classes are added.
            tooltipAdj: { top: -2.5, left: 0 },                                 // there are cases where a slight adjustment is needed when using tooltips. This adjusts the adjusted position offset.
            tooltipFallback: 'top',                                             // when tooltip gets pushed off screen fallback to this position. if that doesn't work sorry - bout - ur - luck!
                                                                                // default leverages animate.css see http://daneden.github.io/animate.css/

            prefixes: ['ai'],                                                   // validation expressions for angular by default strip "ng" from the expression,
                                                                                // hence if you have custom validators you may need this to be stripped as well.
                                                                                // for example if you have a directive "myValidator" which in markup would be my-validator

            validateOnDirty: false,                                             // validation is throw when message is dirty and has error.
            validateOnTouched: undefined,                                       // validation is thrown when has error and has lost focus e.g. been touched.
            validateOnSubmit: undefined,                                        // throw validation on form submission.
            validateOnDirtyEmpty: undefined,                                    // when validate on dirty is true then dirty validation events fire even if model value is undefined/null.
            pristineOnReset: undefined,                                         // when form is reset return to pristine state.

            messageTitlecase: undefined,                                        // when validation messages are show convert to title case (useful when ng-model properties are lower case).
            novalidate: true,                                                   // when true adds html5 novalidate tag.
          
            onReady: null,                                                       // callback called after the form is initialized returns the form object.

            validators: {
                'required': '{{name}} is required.',
                'minlength': '{{name}} must be at least {{value}} characters in length.',
                'maxlength': '{{name}} must not exceed {{value}} characters in length.',
                'ng-required': '{{name}} is required.',
                'ng-minlength': '{{name}} must be at least {{value}} characters in length.',
                'ng-maxlength': '{{name}} must not exceed {{value}} characters in length.',
                'min': '{{name}} must be at least {{value}}.',
                'max': '{{name}} must must not exceed {{value}}.',
                'ng-pattern': '{{name}} must match the pattern {{value}}.',
                'email': '{{name}} must be a valid email address.',
                'tel': '{{name}} must be a valid phone number.',
                'url': '{{name}} must be a valid url web address.',
                'date': '{{name}} must be a valid date.',
                'time': '{{name}} must be a valid time.',
                'datetime': '{{name}} must be a valid date/time value.',
                'ai-compare': '{{name}} must be equal to {{value}} field.'
            }
        },
        get, set;

    set = function set(value) {
        angular.extend(defaults, value);
    };

    get = [ '$helpers', function get($helpers) {


        function ModuleFactory(options, attrs) {

            var $module = {};
            options = options || {};
            // set user validators to alt property.
            if(options && options.validators){
                options._validators = options.validators;
                delete options.validators;
            }

           attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);
            
            options._validators = options._validators || {};
            $module.options = angular.extend({}, defaults, attrs, options);

            return $module;
        }

        //return ModuleFactory;

        return {
            elements: defaults.elements,
            factory: ModuleFactory
        };

    }];

    return {
        $get: get,
        $set: set
    };

})

.controller('AiValidateFormController', ['$scope', '$helpers', '$timeout', function ($scope, $helpers, $timeout) {

    var form, defaultTemplate, tooltipTemplate, summaryTemplate,
        resetting, submitting,  initializing;

    summaryTemplate = '<div ai-validate-summary>' +
                        '<ul class="ai-validate-summary" ng-show="{{form}}.summary">' +
                        '<li ng-repeat="(expression,message) in {{form}}.validators">{{message}}</li>' +
                        '</ul>' +
                        '</div>';

    tooltipTemplate = '<div class="tooltip">' +
                        '<div class="tooltip-inner">{{message}}</div>' +
                        '<div class="tooltip-arrow"></div>' +
                        '</div>';

    defaultTemplate = '<span class="ai-validate-message">{{message}}</span>';

    initializing = false;

    // Local Methods

    // find summary in form if exists.
    function findSummary() {

        // tooltips cannot be used with summary
        if(form.tooltipEnabled) return;

        var summary, element;
        element = $scope.formElement;
        summary = element[0].querySelectorAll('ai-validate-summary');
        if(!summary.length)
            summary = element[0].querySelectorAll('[ai-validate-summary]');

        summary = summary && summary.length ?
            angular.element(summary) : undefined;

        if(summary) {
            summaryTemplate = $scope.options.summaryTemplate || summaryTemplate;
            summaryTemplate = summaryTemplate.replace(/{{form}}/g, $scope.formName);
            form.summaryElement = $helpers.compile($scope, summaryTemplate);
            summary.replaceWith(form.summaryElement);
        }

    }

    function findElement(q, element) {
        var elements;
        if(element.querySelectorAll)
            elements = element.querySelectorAll(q);
        else if(!elements || !elements.length && element[0].querySelectorAll)
            elements = element[0].querySelectorAll(q);
        else if(!elements || !elements.length && document)
            elements = document.querySelectorAll(q);
        else
            elements = undefined;
        if(elements)
            return angular.element(elements);
        else
            return undefined;
    }

    function getScrollbarWidth() {
        var div, width = getScrollbarWidth.width;
        if (width === undefined) {
            div = document.createElement('div');
            div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
            div = div.firstChild;
            document.body.appendChild(div);
            width = getScrollbarWidth.width = div.offsetWidth - div.clientWidth;
            document.body.removeChild(div);
        }
        return width;
    }

    function positionTooltip(input, tooltip, pos) {

        var tooltipAdj, tooltipFallback;

        // add additional classes if specified
        if($scope.options.tooltipClass)
            tooltip.addClass($scope.options.tooltipClass);

        // used for disabling error border on input
        input.addClass('ai-validate-tooltip');

        tooltipAdj = $scope.options.tooltipAdj || { top: -2.5, left: 0 };
        tooltipFallback = $scope.options.tooltipFallback || null;

        function calculatePosition(_pos) {

             // need to look into better way of doing this
             // can't use .is() in jqlite.
            tooltip.removeClass('top');
            tooltip.removeClass('right');
            tooltip.removeClass('left');
            tooltip.removeClass('bottom');
            tooltip.css({ left: 0, top: 0 });
            tooltip.addClass(_pos);

            var position, tooltipSize, inputSize, inputOffset,
                windowSize, offset, scrollbarWidth;

            tooltipSize = { height: tooltip[0].clientHeight, width: tooltip[0].offsetWidth };
            inputSize = { height: input[0].clientHeight, width: input[0].offsetWidth };
            inputOffset = { top: input[0].offsetTop, left: input[0].offsetLeft };
            scrollbarWidth = getScrollbarWidth();
            windowSize = { width: window.innerWidth - scrollbarWidth, height: window.innerHeight };
            offset = {};

            position = {
                top: function () {
                    offset.top = inputOffset.top - tooltipSize.height;
                    offset.left = (inputOffset.left + inputSize.width) - (tooltipSize.width /2 + inputSize.width / 2) + tooltipAdj.left;
                },
                right: function () {
                    offset.top = (inputSize.height - tooltipSize.height) / 2 + (inputOffset.top + tooltipAdj.top);
                    offset.left = (inputOffset.left + inputSize.width);
                },
                bottom: function () {
                    offset.top = inputOffset.top + inputSize.height;
                    offset.left = (inputOffset.left + inputSize.width) - (tooltipSize.width /2 + inputSize.width / 2) + tooltipAdj.left;
                },
                left: function () {
                    offset.top = (inputSize.height - tooltipSize.height) / 2 + (inputOffset.top + tooltipAdj.top);
                    offset.left = inputOffset.left - tooltipSize.width;
                }
            };

            // assign the position and calculate offset
            position[_pos]();

            // check overflow
            if(offset.left < 0)
                if(tooltipFallback && tooltipFallback !== 'left')
                    return calculatePosition(tooltipFallback);
                else
                    return { top: offset.top, left: offset.left + Math.abs(offset.left) };

            if((offset.left + tooltipSize.width) > windowSize.width)
                if(tooltipFallback && tooltipFallback !== 'right')
                    return calculatePosition(tooltipFallback);
                else
                    return { top: offset.top, left: offset.left - Math.abs((offset.left + tooltipSize.width) - windowSize.width)};

            if((offset.top + tooltipSize.height) > windowSize.height)
                if(tooltipFallback && tooltipFallback !== 'bottom')
                    return calculatePosition(tooltipFallback);
                else
                    return { top: offset.top - Math.abs(((offset.top + tooltipSize.height) - windowSize.height)), left: offset.left };

            if((offset.top - tooltipSize.height) < 0)
                if(tooltipFallback && tooltipFallback !== 'top')
                    return calculatePosition(tooltipFallback);
                else
                    return { top: Math.abs(offset.top - tooltipSize.height), left: offset.left };


            return { top: offset.top, left: offset.left };

        }

        // store some day for use in window resize
        tooltip.data({input: input, pos: pos });

        // add the caclulated position in form of offset to the tooltip
        tooltip.css(calculatePosition(pos));

    }

    function attachEvents() {

        // apply scope for form submission
        if ($scope.options.validateOnSubmit !== false) {
            $scope.formElement.on('submit', function () {
                $scope.$apply(function () {
                    $scope.submitForm();
                });
            });
        }

        if ($scope.options.pristineOnReset !== false) {
            $scope.formElement.on('reset', function () {
                $scope.$apply(function () {
                    $scope.resetForm();
                });
            });
        }

    }

    function hasValidator(attr) {
        var validators = $scope.options.validators;
        return validators[attr] || undefined;
    }

    function getTitlecase(str){
        str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
        str = str.replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3');
        str = str.replace(/([A-Z]+)*([A-Z][a-z])/g, "$1 $2");
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function onDirtyRequireValue (name) {

        if(form.submitted) return;

        var input = form[name] || null;
        if(input.$modelValue === undefined){
            input.$invalid = false;
            input.$valid = true;
            input.$setPristine(true);
            return false;
        }
        return true;
    }

    function getValidator(name, attr, value) {

        var valMsg, cust, def;

        // lookup the validation message expression
        // for custom validators lookup by name
        cust = $scope.options._validators[name];

        // for internal lookup by attr.
        def = $scope.options.validators[attr];

        // if custom we need to check for the attr
        if(cust)
            cust = cust[attr];

        // default to the custom validator expression if present
        valMsg = cust || def;

        // check if title case is enabled
        if($scope.options.messageTitlecase !== false)
            name = getTitlecase(name);

        // check if expression is a function
        if(angular.isFunction(valMsg))
            valMsg = valMsg({ attr: attr, value: value }, form);

        // replace "name" with the normalized field name
        if(/{{name}}/.test(valMsg))
            valMsg = valMsg.replace(/{{name}}/g, name || '');

        // replace attribute is passed
        if(/{{attr}}/.test(valMsg))
            valMsg = valMsg.replace(/{{attr}}/g, attr || '');

        // if a value is passed replace it also
        if(/{{value}}/.test(valMsg))
            valMsg = valMsg.replace(/{{value}}/g, value || '');

        return valMsg;

    }

    function getExpression(name, attr, valMsg, valTemplate) {

        var valExp, valElem, watch, msgTemplate, prefixes, prefixRegex;

        msgTemplate = $scope.options.template || defaultTemplate;

        $scope.options.prefixes.push('ng');
        prefixes = $scope.options.prefixes.join('|');
        prefixRegex = new RegExp('(' + prefixes + ')\-', 'gi');

        // check if tooltips are enabled
        if(form.tooltipEnabled)
            msgTemplate = tooltipTemplate;


        watch = valTemplate ? false : true;

        valTemplate = valTemplate || '{{form}}.{{name}}.$error.{{attr}}';

        if ($scope.options.validateOnDirty) {

            if($scope.options.validateOnDirtyEmpty === false)
                valTemplate += ' && {{form}}.{{name}}.$dirty && {{form}}.requireValue("' + name + '")';
            else
                valTemplate += ' && {{form}}.{{name}}.$dirty';
        }

        if($scope.options.validateOnTouched !== false)
            valTemplate += ' && {{form}}.{{name}}.$touched';

        if ($scope.options.validateOnSubmit !== false)
            valTemplate += ' || {{form}}.submitted && {{form}}.{{name}}.$error.{{attr}}';


        //attr = attr.replace('ng-', '');
        attr = attr.replace(prefixRegex, '');

        // the validation expression used with by default ng-show
        valExp = valTemplate.replace(/{{form}}/g, $scope.formName).replace(/{{name}}/g, name).replace(/{{attr}}/g, attr);

        // replace the placeholder with the validation message
        msgTemplate = msgTemplate.replace(/{{message}}/, valMsg);

        // add the expression to the new element via template
        valElem = angular.element(msgTemplate).attr('ng-show', valExp);

        // just in case we for got to add the required class in the template
        if(!valElem.hasClass('ai-validate-message'))
            valElem.addClass('ai-validate-message');

        // add watcher
        if(watch)
            $scope.watchExpression(valExp, valMsg);

        return valElem;

    }

    function compileValidator(input, valElem, name) {

        var inputGroup;

         // need to check parent as bootstrap clobbers positioning be
         // sure to append after input groups.
         // to bad we can't use .is() here no joy in jqlite.

        if(input.parent()){
            var parent = input.parent();
            inputGroup = parent.hasClass('input-group') ||
            parent.hasClass('input-prepend') ||
            parent.hasClass('input-append') ||
            undefined;
        }

        // check if summary element exists
        if (form.summaryElement)
            valElem.addClass('ai-summary');

        // check if generated class exists
        if (!valElem.hasClass('ai-generated'))
            valElem.addClass('ai-generated');

        if(inputGroup)
            input.parent().after(valElem);
        else
            input.after(valElem);

        valElem = $helpers.compile($scope, valElem);

        if(form.tooltipEnabled){
            var pos = $scope.options.template.split(' ').pop() || 'top';
            positionTooltip(angular.element(input), valElem, pos);
            form.validationElements.push(valElem);
        }

    }

    // Scope Methods

    $scope.findElement = findElement;

    $scope.buildExpression = getExpression;

    $scope.init = function init(initForm) {

        if(initializing) return;

        initializing = true;

        // this resets the form objects.
        // pass true so we don't init twice
        // from a modal etc.
        $scope.reinitForm(true);

        // save ref to form
        form = form || initForm;

        form.resetForm = $scope.resetForm;
        form.submitForm = $scope.submitForm;
        form.reinitForm = $scope.reinitForm;
        form.validators = {};
        form.inputElements = [];
        form.validationElements = [];

        // get the form inputs and any existing generated validation messages.
        var inputElements = findElement($scope.options.elements, $scope.formElement);
        form.inputElements = inputElements = inputElements && inputElements.length > 0 ? inputElements : [];

        // check if tooltip is used
        form.tooltipEnabled = $scope.options.template && $scope.options.template.indexOf('tooltip') !== -1;

        // find and compile the summary
        findSummary();

        // add validation function to require value on dirty if enabled
        if($scope.options.validateOnDirtyEmpty === false)
            form.requireValue = onDirtyRequireValue;

        // nothing to do if no inputs exists
        if(!inputElements.length) {
            initializing = false;
            return;
        }

        // attach submit and reset event listeners
        attachEvents();

        // iterate inputElements and inspect attributes
        angular.forEach(inputElements, function (input) {

            // convert to ng/jqlite element
            input = angular.element(input);

            var name, attrs, model, type;

            // get the input's attributes
            attrs = input[0].attributes;
            type = input[0].type;

            // get name, model and type vars
            name = attrs.name ? attrs.name.value : undefined;

            // we must have a name to ref. if no element name or is excluded return
            if(!name || $scope.options.exclude.indexOf(name) !== -1)
                return;

            if (!input.hasClass('ai-validate-input'))
                input.addClass('ai-validate-input');

            // iterate attributes inspect for validation
            angular.forEach(attrs, function (attr) {


                var attrName = attr.name || undefined,
                    isType = false;

                if(attrName === 'type')	{
                    attrName = attr.value;
                    isType = true;
                }

                if(attrName && hasValidator(attrName)) {

                    // get the validator expression message for type
                    var valMsg, valElem;

                    if(isType)
                        valMsg = getValidator(name, attrName, undefined);
                    else
                        valMsg = getValidator(name, attrName, attr.value);

                    // get the validation element w/ built expression
                    valElem = getExpression(name, attrName, valMsg);

                    // compile the validation message/expression for the input
                    compileValidator(input, valElem, name);

                }

            });

        });

        // callback when bind is complete maybe should call this bound
        if($scope.options.onReady) $scope.options.onReady(form, $scope);

        initializing = false;

        if (form.tooltipEnabled) {

            form.positionTooltips = function positionTooltips() {
                angular.forEach(form.validationElements, function (elem) {
                    var data = elem.data();
                    positionTooltip(data.input, elem, data.pos);
                });
            };

            angular.element(window).bind('resize', function () {
                form.positionTooltips();
            });
        }

    };

    $scope.watchExpression = function watchExpression(exp, msg) {

        $scope.$watch(
            function () {
                return $scope.$eval(exp);
            },
            function (newVal, oldVal) {

                // check if the validation exists
                var exists = form.validators.hasOwnProperty(exp);

                // add message if doesn't exist
                if (!exists && newVal)
                    form.validators[exp] = msg;

                // remmove messages no longer invalid
                if (exists && !newVal)
                    delete form.validators[exp];

                if (Object.keys(form.validators).length === 0) {
                    form.summary = false;
                } else {
                    if (form.submitted)
                        $scope.set.dirty();
                    if (form.summaryElement)
                        form.summary = true;
                }

            });

    };

    $scope.set = {

        pristine: function (defaults) {

            // must have form and element
            if (!form || !$scope.formElement || !form.inputElements.length) return;

            form.summary = false;
            form.submitted = false;

            // iterate inputs and set to pristine
            angular.forEach(form.inputElements, function (input) {

                input = angular.element(input);

                var name, formProp;

                // just in case
                if(!input[0].attributes || !input[0].attributes.name) return;

                // get the name attr
                name = input[0].attributes.name.value || undefined;
                formProp = form[name] || undefined;

                // should never hit this but just in case
                if(!name || !formProp)
                    throw new Error('Form property could not be found or has an invalid name attribute. Cannot set pristine.');

                if(defaults) {
                    if(angular.isObject(defaults)) {
                        if(defaults[formProp.$name]) {
                            var val = defaults[formProp.$name];
                            formProp.$setViewValue(val);
                            input.val(val);
                        } else {
                            formProp.$setViewValue(undefined);
                            input.val(undefined);
                        }
                    } else {
                        formProp.$setViewValue(undefined);
                        input.val(undefined);
                    }
                }

                formProp.$setPristine(true);
                formProp.$setUntouched(true);
                formProp.$dirty = false;
                input.addClass('ng-pristine').removeClass('ng-dirty');


            });

            // timeout important to fix issue where
            // form re-evals when setting form defaults
            $timeout(function () {
                form.$dirty = false;
                form.$setPristine(true);
                form.$setUntouched(true);
                form.submitted = false;
                resetting = false;
            });

        },

        dirty: function () {

            // must have form and element
            if (!form || !$scope.formElement || !form.inputElements.length) return;

            // iterate inputs and set to pristine
            angular.forEach(form.inputElements, function (input) {

                input = angular.element(input);

                var name, formProp;

                // just in case
                if (!input[0].attributes || !input[0].attributes.name) return;

                // get the name attr
                name = input[0].attributes.name.value || undefined;
                formProp = form[name] || undefined;

                // should never hit this but just in case
                if(!name || !formProp)
                    throw new Error('Form property could not be found or has an invalid name attribute. Cannot set pristine.');


                formProp.$setPristine(false);
                formProp.$dirty = true;
                input.removeClass('ng-pristine').addClass('ng-dirty');

            });

            form.$pristine = false;
            form.$setUntouched(false);
            form.$setDirty(true);
            submitting = false;

        }

    };

    // resets the form back to its pristine state
    $scope.resetForm = function (defaults) {
        defaults = defaults || false;
        if(resetting) return;
        resetting = true;
        $scope.set.pristine(defaults);
    };

     // forces form to $dirty to trigger any invalid elements
     // can pass true to also trigger the jquery event
    $scope.submitForm = function submit(trigger) {
        if(submitting) return;
        submitting = true;
        form.submitted = true;
        if(trigger === true)
            $scope.formElement.submitForm();
        $scope.set.dirty();
    };

    // destroy all validation objects.
    $scope.destroyForm = function destroyForm() {
        $scope.removeValidations();
        delete $scope.formName;
        delete $scope.formElement;
        delete form.validators;
        delete form.inputElements;
        delete form.validationElements;
    };

    // remove all generated messages.
    $scope.removeValidations = function removeValidations(elements) {
        elements = elements || findElement('.ai-validate-message.ai-generated', $scope.formElement[0]);
        if(elements && elements.length)
            elements.remove();
    };

    // destroy then reinit form.
    $scope.reinitForm = function reinitForm(suppressInit) {
        suppressInit = suppressInit || false;
        $scope.removeValidations();
        if(form){
            form.validators = {};
            form.inputElements = [];
            form.validationElements = [];
        }
        if(!suppressInit)
            $scope.init();
    };

}])

.directive("aiValidateForm", ['$validate', function ($validate) {

    var elements, factory;
        elements = $validate.elements;
        factory = $validate.factory;

        if(angular.isArray(elements))
            elements = elements.join(',');

    return {
        restrict: 'AC',
        controller: 'AiValidateFormController',
        compile: function (tElement) {

            var inputs = tElement[0].querySelectorAll(elements);

            if (inputs && inputs.length) {
                angular.forEach(inputs, function (input) {
                    input = angular.element(input);
                    var attrs = input[0].attributes,
                        name,
                        model;
                    if(!attrs.name){
                        model = attrs['ng-model'] || attrs['data-ng-model'] || undefined;
                        name = model ? model.value.split('.').pop() : null;
                        if(name){
                            input.attr('name', name);
                        }
                    }
                });
            }

            return function (scope, element, attrs, ctrl) {

                var form, formName, options, $module;

                formName = element.attr('name') || null;

                // formName is required.
                if(!formName)
                    throw new Error('Form name is invalid or missing. Please use name="some_value" to name your form.');

                // add form to scope.
                form = scope[formName] || undefined;

                if(!form)
                    throw new Error('Scope does not contain the requested form.');

                // save vars to scope.
                scope.formElement = element;
                scope.formName = formName;
                scope.parentScope = scope.$parent;

                // extend options.
                options = attrs.aiValidateForm || attrs.aiValidateOptions || attrs.aiValidateFormOptions;
                $module = factory(scope.$eval(options), attrs);
                scope.options = $module.options;

                // add the validation element types to scope options.
                scope.options.elements = elements;

                if(scope.options.novalidate)
                    element.attr('novalidate', '');

                // watch for option changes.
                scope.$watch(
                    function () {
                        return attrs.aiValidateForm || attrs.aiValidateOptions || attrs.aiValidateFormOptions;
                    },
                    function (newVal, oldVal) {
                        if(newVal === oldVal) return;
                        scope.options = angular.extend(scope.options, newVal);
                }, true);

                // init the form.
                scope.init(form);

            };

        }

    };

}])

.directive("aiValidateMessage", [function () {

    return {
        restrict: "EAC",
        require: '?aiValidateForm',
        link: function (scope, element, attrs, ctrl) {

            var input;

            // ngShow requried to show/hide val msgs return if not present
            if (!attrs.ngShow) return;

            // if validate for find element and add class
            if (attrs.aiValidateMessage) {
                input = scope.findElement('[name="' + attrs.aiValidateMessage + '"]', document);
                if (input)
                    input.addClass('ai-validate-input');
            }

            // make sure the element has the ai-validate-message class
            if (!element.hasClass('ai-validate-message'))
                element.addClass('ai-validate-message');

            // watch expression for summary
            scope.watchExpression(attrs.ngShow, element.text());

            // add watcher for manual validation errors so
            // summary/local message are properly updated
            scope.$watch(function () {
                var form = scope[scope.formName];
                return form.summaryElement;
            }, function (newVal, oldVal) {
                if (newVal)
                    element.addClass('ai-summary');
                else
                    element.removeClass('ai-summary');
            });

        }

    };

}]);



angular.module('ai.widget', [])

.provider('$widget', function $widget() {

    var defaults = {            
            number: {
                defaultValue: undefined,        // default value if initialized undefined.
                places: 2,                      // default decimal places.
                event: 'blur'                   // event that triggers formatting.
            },            
            case: {
                casing: 'first',
                event: 'blur'
            },
            compare: {
                defaultValue: undefined,        // the default value when undefined.
                compareTo: undefined,           // the html name attribute of the element or form scope property to compare to.
                dataType: 'string',             // options are string, date, time, datetime, integer
                precision: 'minutes'            // only valid when evaluating time when dataType is time or datetime.
                                                // valid options 'minutes', 'seconds', 'milliseconds'
            },
            lazyload: {
                src: undefined,                 // placeholder option.
                parent: 'head',                 // the parent element where the script should be insert into.
                position: 'append'              // either append, prepend or integer to insert script at.
            }
            //nicescroll: {
            //    horizrailenabled: false         // disables horizontal scroll bar.
            //},
            //redactor: {
            //    focus: true,
            //    plugins: ['fullscreen']
            //},
        },
        get, set;

    set = function set(key, options) {
        if(angular.isObject(key)){
            options = key;
            key = undefined;
            defaults = angular.extend(defaults, options);
        } else {
            defaults[key] = angular.extend(defaults[key], options);
        }
    };

    get = [ function get() {

        // factory allows for globally
        // setting widget options.
        function ModuleFactory(key, options) {
            options = options || {};
            if(!defaults[key]) return options;
            options = angular.extend({}, defaults[key], options);
            return options;
        }
        return ModuleFactory;

    }];

    return {
        $get: get,
        $set: set
    };

})

// simple directive to prevent default
// on click, for use as attribute/class only.
.directive('aiPrevent',[ function() {
    return {
        restrict: 'AC',
        link: function(scope, element, attrs) {
            if(attrs.ngClick){
                element.on('click', function(e){
                    e.preventDefault();
                });
            }
        }
    };
}])
    
//
//.directive('aiNicescroll', ['$widget', '$timeout', function($widget, $timeout) {
//
//    return {
//        restrict: 'AC',
//        link: function(scope, element, attrs) {
//
//            var defaults, options, $module, _attrs;
//
//            console.assert(window.NiceScroll, 'ai-nicescroll requires the NiceScroll library ' +
//                'see: http://areaaperta.com/nicescroll');
//
//            defaults = angular.copy($widget('nicescroll'));
//
//            function init() {
//                $timeout(function () {
//                    $module = element.niceScroll(options);
//                },0);
//            }
//
//            options = attrs.aiNicescroll || attrs.aiNicescrollOptions;
//            options = angular.extend(defaults, _attrs, scope.$eval(options));
//            init();
//        }
//    };
//}])

// ensures handling decimal values.
.directive('aiNumber', [ '$widget', '$helpers', '$timeout', function($widget, $helpers, $timeout) {
    return {
        restrict: 'AC',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel) {

            var defaults, options, _attrs, lastVal;

            defaults = angular.copy($widget('number'));
            _attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);
            
            function parseVal(val){
                val = $helpers.tryParseFloat(val);  
                if(val) 
                    val = val.toFixed(options.places);
                return val;
            }
            
            // format and set value.
            function format(val) {
                if(val !== undefined)  {
                    val = parseVal(val);
                    if(!val)
                        val = parseVal(lastVal);                
                }
                if(val === undefined)
                    val = options.defaultValue !== undefined ? options.defaultValue : '';
                element.val(val);           
                ngModel.$modelValue = val;
                lastVal = val;
            }

            function init() {
                
                // bind event call apply
                // format the value. 
                // use simple event binding instead
                // of adding watchers etc.
                element.unbind(options.event);
                element.on(options.event, function (e) {
                    scope.$apply(function () {
                        format(e.target.value);
                    });
                });
                
                // use timeout make sure dom is ready.
                $timeout(function () {
                    var val = element.val();
                    if(!val)
                        if(options.defaultValue !== undefined)
                            val = options.defaultValue;
                    format(val);
                }, 0);                
            }
            
            options = attrs.aiNumber|| attrs.aiNumberOptions;
            options = angular.extend(defaults, _attrs, scope.$eval(options));
            
            init();
        }
    };
}])

//// Angular wrapper for using Redactor.
//.directive('aiRedactor', [ '$widget', '$helpers', function ($widget, $helpers) {
//    return {
//        restrict: 'AC',
//        scope: true,
//        require: '?ngModel',
//        link: function (scope, element, attrs) {
//            var defaults, options, $directive, _attrs;
//
//            defaults = angular.copy($widget('redactor'));
//
//            _attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);
//
//            console.assert(window.jQuery && (typeof ($.fn.redactor) !== 'undefined'), 'ai-redactor requires the ' +
//                'jQuery redactor plugin. see: http://imperavi.com/redactor.');
//
//            function init() {
//                $directive = element.redactor(options);
//            }
//            options = attrs.aiRedactor || attrs.aiRedactorOptions;
//            options =  angular.extend(defaults, _attrs, scope.$eval(options));
//
//            init();
//        }
//    };
//}])

.directive('aiCase', [ '$timeout', '$widget', '$helpers', function ($timeout, $widget, $helpers) {

    return {
        restrict: 'AC',
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {

            var defaults, options, casing, _attrs;

            defaults = angular.copy($widget('case'));
            options = {};
            _attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

            function getCase(val) {
                if (!val) return;

                if (casing === 'title')
                    return val.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
                else if (casing === 'first')
                    return val.charAt(0).toUpperCase() + val.slice(1);
                else if (casing === 'camel') {
                    return val.toLowerCase().replace(/-(.)/g, function (match, group1) {
                        return group1.toUpperCase();
                    });
                }
                else if (casing === 'pascal')
                    return val.replace(/\w+/g, function (w) { return w[0].toUpperCase() + w.slice(1).toLowerCase(); });
                else if (casing === 'lower')
                    return val.toLowerCase();
                else if (casing === 'upper')
                    return val.toUpperCase();
                else return val;
            }

           function applyCase(e){

               scope.$apply(function () {
                   var val = element.val(),
                       cased = getCase(val);
                   if (ngModel) {
                       ngModel.$modelValue = cased;
                   } else {
                       element.val(getCase(val));
                   }
               });

            }

            function init() {

                casing = options.casing;

                element.on(options.event, function (e) {
                    applyCase(e);
                });

                element.on('keyup', function (e) {
                    var code = e.which || e.keyCode;
                    if(code === 13){
                        /* prevent default or submit could happen
                        prior to apply case updates model */
                        e.preventDefault();
                        applyCase(e);
                    }
                });

                $timeout(function () {
                    applyCase();
                },100);

            }

            var tmpOpt = attrs.aiCase || attrs.aiCaseOptions;
            if(angular.isString(tmpOpt))
                options.casing = tmpOpt;
            if(angular.isObject(tmpOpt))
                options = scope.$eval(tmpOpt);
            options = angular.extend(defaults, _attrs, options);

            init();

        }

    };

}])

.directive('aiCompare', [ '$widget', '$helpers', function ($widget, $helpers) {

    function checkMoment() {
        try{
            var m = moment();
            return true;
        } catch(ex) {
            return false;
        }
    }

    function isNumber(val) {
        return !isNaN(parseInt(val,10)) && (parseFloat(val,10) === parseInt(val,10));
    }

    return {
        restrict: 'AC',
        require: '^ngModel',
        link: function (scope, element, attrs, ngModel) {

            var defaults, options, formElem, form, momentLoaded,
                ngModelCompare, _attrs;

            // check moment is loaded for datetime compares.
            momentLoaded = checkMoment();
            defaults = angular.copy($widget('compare'));

            _attrs = $helpers.parseAttrs(Object.keys(defaults), attrs);

            function validate(value) {

                var valid;

                if(!ngModelCompare.$viewValue || !ngModel.$viewValue){

                    valid = options.defaultValue || '';

                } else {

                    if(options.dataType === 'string') {

                        valid = ngModelCompare.$viewValue === value;

                    } else if(options.dataType === 'integer'){

                        if(!isNumber(ngModelCompare.$viewValue) || !isNumber(ngModel.$viewValue)){
                            valid = false;
                        } else {
                            valid = parseInt(ngModelCompare.$viewValue) === parseInt(value);
                        }

                    } else if(/^(date|time|datetime)$/.test(options.dataType)) {

                        var comp, model, diff, diffMin;

                        comp = ngModelCompare.$viewValue;
                        model = ngModel.$viewValue;

                        if(options.dataType === 'time'){
                            comp = '01/01/1970 ' + comp;
                            model = '01/01/1970 ' + model;
                        }
                        comp = moment(comp);
                        model = moment(model);

                        if(options.dataType === 'date'){

                            diff = model.diff(comp, 'days');
                            valid = diff === 0;

                        } else if(options.dataType === 'time'){

                            diff = model.diff(comp, options.precision);
                            valid = diff === 0;

                        } else if(options.dataType === 'datetime') {

                            diff = model.diff(comp, 'days');
                            diffMin = model.diff(comp, options.precision);
                            valid = (diff === 0) && (diffMin === 0);

                        } else {

                            valid = false;

                        }

                    } else {

                        valid = false;

                    }

                }

                ngModel.$setValidity('compare', valid);
                return valid;
            }

            function init() {

                formElem = element[0].form;

                /* can't continue without the form */
                if(!formElem) return;

                form = scope[formElem.name];
                ngModelCompare = form[options.compareTo] || options.compareTo;

                /* must have valid form in scope */
                if(!form || !options.compareTo || !ngModelCompare) return;

                if(/^(date|time|datetime)$/.test(options.dataType) && !momentLoaded)
                    return console.warn('ai-compare requires moment.js, see http://momentjs.com/.');

                ngModel.$formatters.unshift(validate);
                ngModel.$parsers.unshift(validate);

            }

            var tmpOpt = attrs.aiCompare || attrs.aiCompareOptions;
            if(angular.isString(tmpOpt) && tmpOpt.indexOf('{') === -1)
                tmpOpt = { compareTo: tmpOpt };
            else
                tmpOpt = scope.$eval(tmpOpt);

            options = angular.extend({}, defaults, _attrs, tmpOpt);

            init();

        }
    };
        
}])

.directive('aiPlaceholder', [ '$widget', function($widget) {

    // get the previous sibling
    // to the current element.
    function prevSibling(elem, ts) {
        try {
            var parents = elem.parent(),
                prevIdx;
            angular.forEach(parents.children(), function (v,k) {
                var child = angular.element(v),
                    _ts = child.attr('_ts_');
                if(ts.toString() === _ts){
                    prevIdx = k -1;
                }
            });
            elem.removeAttr('_ts_');
            if(prevIdx < 0)
                return { element: angular.element(elem.parent()), method: 'prepend' };
            return { element: angular.element(parents.children().eq(prevIdx)), method: 'after' };
        } catch(ex) {
            return false;
        }
    }

    // capitalize a string.
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // test if placeholder is supported.
    function placeholderSupported() {
        var test = document.createElement('input');
        return ('placeholder' in test);
    }

    return {
        restrict: 'AC',
        link: function(scope, element, attrs) {

            var placeholder, isNative;

            function init() {

                var label = '<label>{{NAME}}</label>',
                    ts = new Date().getTime(),
                    prev;

                placeholder = capitalize(placeholder);
                
                if(!isNative && placeholder)
                    element.attr('placeholder', placeholder);

                // since angular doesn't support .index()
                // set attr so we can find it when iterating.
                element.attr('_ts_', ts);
                prev = prevSibling(element, ts);

                // test if dot notation model name.
                if(placeholder.indexOf('.') !== -1){
                    placeholder = placeholder.split('.');
                    placeholder = placeholder[1] ? placeholder[1] : placeholder[0];
                }

                if(!placeholderSupported() && prev) {
                    label = label.replace('{{NAME}}', placeholder);
                    label = angular.element(label);
                    prev.element[prev.method](label);
                }

            }

            isNative = element.attr('placeholder');
            placeholder = element.attr('placeholder') ||  attrs.aiPlaceholder || attrs.ngModel;

            init();

        }
    };
}])

.directive('aiLazyload', [ '$widget', '$helpers', '$rootScope', function($widget, $helpers, $rootScope) {
    return {
        restrict: 'EA',
        scope: false,
        link: function(scope, elem, attrs) {

            var script, scripts, defaults, options, parentElem, childElem;

            defaults = angular.copy($widget('lazyload'));
            options = $helpers.parseAttrs(Object.keys(defaults), attrs);
            options = angular.extend({}, defaults, options);

            // the parent element where
            // scripts will be inserted.
            parentElem = $helpers.findElement(options.parent)[0];

            if(!parentElem || !parentElem.appendChild)
                return console.error('Cannot lazy load script using parent ' + options.parent +
                                      '. Ensure the dom element exists.');

            // get all scripts in element.
            scripts = $helpers.findElement('script', document[options.parent]) || [];

            if(options.position === 'prepend')
                options.position = 0;

            // insert at this position wihtin children.
            childElem = angular.isNumber(options.position) ? scripts[options.position] : undefined;

            // if no scripts in element just use append.
            if(!scripts.length || childElem === undefined)
                options.position = 'append';

            // create script element
            script = document.createElement('script');

            // check if inline or
            // is external file.
            if(undefined === options.src){
                script.text = elem.text();
            } else {
                script.src = options.src;
            }

            // add the script to parent.
            if(childElem)
                parentElem.insertBefore(script, childElem);
            else
                parentElem.appendChild(script);

            // remove original element
            elem.remove();

            function removeScript() {
                if(script && parentElem.contains(script))
                    parentElem.removeChild(script);
            }

            // remove script on route change, prevents dups.
            $rootScope.$on('$routeChangeSuccess', removeScript);

            // remove lazy loaded script on destroy.
            scope.$on('destroy', removeScript);

        }
    };
}]);

function sayHello() {
    alert('Hello lazy loaded script!');
}
})(window, document);
