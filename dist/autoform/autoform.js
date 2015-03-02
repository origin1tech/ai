angular.module('ai.autoform', [])

.provider('$autoform', function $autoform() {

    var defaults = {

            prefix: 'model',           // value to prepend to models.
            labels: true,              // when true labels are created.
            type: 'text',              // the default type for elements.
            addClass: false,           // specify class to be added to form for styling.
            placeholders: true,        // when true placeholders are created for text elements.
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

    get = ['$rootScope', '$compile', function get($rootScope, $compile) {

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

        // tests if value is boolean.
        function isBoolean(value) {
            if(typeof value === 'boolean')
                return true;
            return !!(value == 'true' || value == 'false');
        }

        // tests if array contains value.
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
            if(isBoolean(value))
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
                var radOpts = '\t\t<label class="checkbox-inline"><input {{ATTRS}}/>' +
                    ' {{NAME}}</label>\n\t</div>';
                radios += (tab(3) + radOpts
                    .replace('{{ATTRS}}', trim(radAttrs + ' value="' + v + '"')))
                    .replace('{{NAME}}', v);
            });
            return radios;
        }

        function ModuleFactory(element, options) {

            var $module = {},
                template = '',
                scope,
                elements;

            options = options || {};
            $module.scope = scope = options.scope || $rootScope.$new();
            $module.options = scope.options = options = angular.extend(angular.copy(defaults), options);
            elements = options.elements || {};

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
                    var origType = attrs.type || elem.type;
                    attrs.type = origType;

                    // normalize name attribute.
                    attrs.name = attrs.name || k;

                    // set value.
                    attrs.value = v || attrs.value || elem.value;
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
                    if(!contains(['textarea', 'checkbox', 'radio'], attrs.type))
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
                    if(attrs.type !== 'checkbox')
                        group += (tab(1) + '<div class="form-group">');
                    else
                        group += (tab(1) + '<div class="checkbox">');

                    // generate labels.
                    if(attrs.type !== 'radio') {
                        var label = (tab(2) + '<label{{FOR}}>');
                        if(attrs.type !== 'checkbox')
                            label = label.replace('{{FOR}}', ' for="' + k + '"') + capName + '</label>';
                        else   
                            label = label.replace('{{FOR}}', ' class="checkbox"');

                        // labels are required for checkboxes.
                        if(options.labels || attrs.type === 'checkbox')
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
                                var opt = (tab(4) + '<option {{VALUE}}>{{TEXT}}</option>');
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

                        }

                    } else {
                        el = '<input {{ATTRS}}/>';
                    }

                    // add attribute string.
                    if(el) {
                        el = (tab(3) + el.replace('{{ATTRS}}', attrsStr));
                        // add element to group.
                        group += el;
                    }

                    // close label if radio or checkbox.
                    if(attrs.type === 'checkbox')
                        group += (tab(2) + capName + '</label>');
                    
                    // close markup group.
                    //if(!contains(['radio', 'checkbox'], attrs.type))
                        group += (tab(1) + '</div>');
                    
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
                $compile(wrapper.contents())(scope);

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
        //priority: -1,
        link: function (scope, element, attrs) {

            var defaults, options, $module;

            defaults = {
                scope: scope
            };

            function init() {
                // create the directive.
                $module = $autoform(element, options);
            }

            // get options and model.
            options = angular.extend(defaults, scope.$eval(attrs.aiAutoform || attrs.options));

            // define the source.
            options.source = options.source || scope.$eval(attrs.source);

            init();

        }

    };

}]);
