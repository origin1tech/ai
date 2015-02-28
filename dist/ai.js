
/**
* @license
* Ai: <http://github.com/origin1tech/ai>
* Version: 0.0.7* Author: Origin1 Technologies <origin1tech@gmail.com>
* Copyright: 2014 Origin1 Technologies
* Available under MIT license <http://github.com/origin1tech/stukko-client/license.md>
*/

(function(window, document, undefined) {
'use strict';
require([
    'step/step',
    'table/table',
    'widget/widget',
    'flash/flash',
    'modal/modal',
    'validate/validate',
    'viewer/viewer',
    'storage/storage',
    'passport/passport',
    'dropdown/dropdown',
    'autoform/autoform',
    'tab/tab'
], function () {
    require(['common/app'], function () {
        
        
    });
});
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

    set = function (options) {
        defaults = angular.extend(defaults, options);
    };

    get = ['$rootScope', '$compile', function ($rootScope, $compile) {

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

angular.module('ai.dropdown', [])

.provider('$dropdown', function $dropdown(){

    var defaults = {

            text: 'text',                           // property to use for text values.
            value: 'value',                         // property to use for model values default is text.
            display: false,                         // alt property to use for display values.
            capitalize: true,                       // if true display is capitalized. (group is cap also if used).
            searchable: true,                       // indicates that the dropdown is searchable.
            placeholder: 'Please Select',           // placeholder text shown on null value.
            allowNull: true,                        // when true user can select placeholder/null value.
            inline: false,                          // positions element inline.
            shadow: true,                           // when true adds shadow to bottom of list.

            template: 'dropdown.tpl.html',          // the template to use for the dropdown control.
            itemTemplate:
                'dropdown-item.tpl.html',           // template used for list items.
            itemGroupTemplate:
                'dropdown-item-group.tpl.html',
            searchTemplate:
                'dropdown-search.tpl.html',         // template used for searching list.
            addClass: false,                        // adds a class the top level of the component.

            source: [],                             // data source can be csv, object, array of string/object or url.
            params: {},                             // object of data params to pass with server requests.
            queryParam: 'q',                        // the param key used to query on server requests.
            method: 'get',                          // the method to use for requests.

            groupKey: false,                        // the parent primary key to find children by.
            groupDisplay: false,                    // used to display the group name.

            selectClose: true,                      // if true list is closed after selection.
            selectClear: false,                     // after selecting value clear item.
            closeClear: true,                       // when searchable and on toggle close clear query filter.
            blurClose: true,                        // when true list is closed on blur event.

                                                    // all callbacks are returned with $module context.
            onToggled: false,                       // on toggle dropdown state. injects(toggle state, event).
            onSelected: false,                      // callback on select. injects(selected, ngModel, event).
            onFilter: false,                        // callback on filter. injects (filter, event).
            onGroup: false,                         // callback fired on grouping injects (distinct groups, data).
            onLoad: false                           // callback on directive loaded. returns

        }, get, set;

    set = function(value) {
        angular.extend(defaults, value);
    };

    get = [ '$templateCache', '$q', '$http', '$compile', '$parse', '$filter',
        function ( $templateCache, $q, $http, $compile, $parse, $filter) {

         var baseTemplate = '<button type="button" class="btn btn-warning toggle" ng-click="toggle()">' +
                                '<span class="selected" ng-bind="selected.display">Please Select</span>' +
                                '<span class="caret" ng-class="{ down: !expanded, up: expanded }"></span>' +
                            '</button>' +
                            '<div class="wrapper">' +
                                '<div class="items" ng-show="expanded">' +
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


        var searchTemplate =  '<input type="text" ng-model="q" ng-change="filter($event, q)" class="search form-control" placeholder="search"/>';

        $templateCache.get(defaults.template) || $templateCache.put(defaults.template, baseTemplate);
        $templateCache.get(defaults.itemTemplate) || $templateCache.put(defaults.itemTemplate, itemTemplate);
        $templateCache.get(defaults.itemGroupTemplate) || $templateCache.put(defaults.itemGroupTemplate, itemGroupTemplate);
        $templateCache.get(defaults.searchTemplate) || $templateCache.put(defaults.searchTemplate, searchTemplate);

        // check if is HTML
        function isHtml(str) {
            return /<(br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|wbr|!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video).*?<\/\2>/.test(str);
        }

        // check if is path.
        function isPath(str) {
            if(!str || !angular.isString(str)) return false;
            var ext = str.split('.').pop();
            return ext === 'html' || ext === 'tpl';
        }

        // trim string.
        function trim(str) {
            return str.replace(/^\s+/, '').replace(/\s+$/, '');
        }

        // check if is HTMLElement.
        function isElement(elem) {
            if(elem instanceof HTMLElement)
                return true;
            return !!(elem && elem[0] && (elem[0] instanceof HTMLElement));
        }

        // find an element.
        function findElement(q, element, single) {
            var selector = 'querySelectorAll';
            if(single)
                selector = 'querySelector';
            if(isElement(element))
                return element[selector](q);
            return angular.element(element || document)[selector](q);

        }

        // load template using promise.
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

        // module factory.
        function ModuleFactory(element, options) {

            if((!element && !isElement(element)) || !options.source)
                return;

            var $module = {},
                scope,
                dropdown,
                button,
                search,
                items,
                nullItem;

            options = options || {};
            $module.scope = scope = options.scope || $rootScope.$new();
            $module.options = scope.options = options = angular.extend(angular.copy(defaults), options);

            nullItem = { text: options.placeholder, value: '', display: options.placeholder };

            // normalize source data to same type.
            function normalizeData(data) {
                if(!data)
                    return [];
                var _collection = options.groupKey ? {} : [],
                    display;
                // if string split to array.
                if(angular.isString(data))
                    data = trim(data).split(',');
                if(options.allowNull && angular.isArray(_collection))
                    _collection.push(nullItem);
                if(options.allowNull && angular.isObject(_collection))
                    _collection._placeholder = {
                        key: 'placeholder',
                        display: false,
                        hidden: false,
                        items: [nullItem]
                    };
                angular.forEach(data, function (v,k) {
                    if(angular.isString(v)) {
                        display = v = trim(v);
                        if(options.capitalize)
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
                        if(options.capitalize)
                            item.display =  item.display.charAt(0).toUpperCase() + item.display.slice(1);
                        if(!options.groupKey) {
                            _collection.push(item);
                        } else {
                            var groupKey = v[options.groupKey],
                                groupDisplay = v[options.groupDisplay || options.groupKey];
                            if(options.capitalize)
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

            // loosely check if value is url
            function isUrl(value) {
                value = value || options.source;
                return angular.isString(value) && value.indexOf('/') !== -1;
            }

            // load data using promise.
            function loadData(q) {
                if(isUrl()){
                    var method = options.method,
                        params = buildParams(options.params, q);
                    return $q.when($http[method](options.source, params))
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
                if(options.selectClose && !suppress)
                    toggle();
                // clear the filter.
                clearFilter();
                // callback on select funciton.
                if(angular.isFunction(options.onSelected))
                    options.onSelected.call($module, _item, options.model, event);
            }

            // toggle the list.
            function toggle(event) {
                scope.expanded =! scope.expanded;
                $module.expanded = scope.expanded;
                if(!scope.expanded && options.closeClear)
                    clearFilter();
                if(scope.expanded)
                    dropdown[0].focus();
                // if a function callback on toggle.
                if(angular.isFunction(options.onToggled))
                    options.onToggled.call($module, scope.expanded, event);
                // closing so clear filter.
                if(options.searchable && !scope.expanded && angular.isFunction(options.closeClear))
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

                // set scope/module methods.
                $module.toggle = scope.toggle = toggle;
                $module.find = scope.find = find;

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
                    promises.push(loadTemplate(options.template || ''));
                    promises.push(loadTemplate(options.searchTemplate || ''));

                    // add group or base items template.
                    if(options.groupKey)
                        promises.push(loadTemplate(options.itemGroupTemplate || ''));
                    else
                        promises.push(loadTemplate(options.itemTemplate || ''));

                    // build the templates.
                    $q.all(promises).then(function(res) {

                        // replace with new template.
                        if(res && res.length) {

                            var vis = options.visibility,
                                visAttrs = '',
                                itemsHtml = '';

                            // create outer wrapper element.
                            dropdown = '<div tabindex="-1"{{ATTRS}}></div>';

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
                            dropdown = dropdown.replace('{{ATTRS}}', visAttrs);

                            // compile with parent scope for ng-attrs.
                            dropdown = angular.element($compile(dropdown)(scope.$parent));

                            // add primary class for styling.
                            dropdown.addClass('ai-dropdown');

                            // check if block display.
                            if(options.inline)
                                dropdown.addClass('inline');

                            // if group add class to main element.
                            if(options.groupKey)
                                dropdown.addClass('group');

                            // if additional class add it.
                            if(options.addClass)
                                dropdown.addClass(options.addClass);

                            // replace the orig. element.
                            // use after as jqlite doesn't
                            // support .before();
                            var prev = options.before;
                            prev.element[prev.method](dropdown);

                            // set content to template html.
                            dropdown.html(res[0]);

                            // get the items container.
                            items = findElement('.items', dropdown[0], true);
                            items = angular.element(items);

                            if(options.shadow)
                                items.addClass('shadow');

                            // add items and search if required.
                            if(options.searchable)
                                itemsHtml += res[1];

                            // add items template.
                            itemsHtml += res[2];
                            items.html(itemsHtml);

                            // get reference to button.
                            button = findElement('button.toggle', dropdown[0], true);
                            button = angular.element(button);

                            if(options.blurClose) {
                                // find search input
                                // add listener if blurClose
                                search = findElement('input', dropdown[0], true);
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
                                dropdown.on('blur', function (e) {
                                    e.preventDefault();
                                    if(!e.relatedTarget && scope.expanded){
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

                            // compile the contents.
                            $compile(dropdown.contents())(scope);

                            // if onload callback.
                            if(angular.isFunction(options.onLoad))
                                options.onLoad.call($module);

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

.directive('aiDropdown', [ '$dropdown', function ($dropdown) {

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
        require: '^ngModel',
        link: function (scope, element, attrs, ngModel){

            var defaults, options, $module, model,
                tagName, initialized, ts;

            initialized = false;
            ts = new Date().getTime();

            defaults = {
                scope: scope
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
                $module = $dropdown(element, options);

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

            }

            // verify valid element type.
            tagName = element.prop('tagName').toLowerCase();
            if(tagName !== 'input')
                return console.error('Invalid element, ai-dropdown requires an input element with ng-model.');

            // get options and model.
            options = scope.$eval(attrs.aiDropdown || attrs.options);
            options = angular.extend(defaults, options);

            // define the source & model data.
            options.source = options.source || scope.$eval(attrs.source);
            options.model = ngModel;

            if(undefined === options.source)
                return console.error('ai-dropdown failed to initialize, invalid model.');
            init();

        }

    };

}]);

angular.module('ai.modal', [])

.provider('$modal', function $modal() {

    var defaults = {

            title: 'Dialog',                      // the default template's title.
            template: 'modal.tpl.html',           // a custom template string.
            content: null,                        // the default template's text or html body.
            locals: {},                           // locals that are passed to scope.

            show: false,                          // show the modal on init.
            container: 'body',                    // the html container to attach the modal to.
            animation: false,                     // true, comma separated string, false or object { in: 'fadeIn', out: 'fadeOut' } (default: true which is equal to > 'fadeInDownBig,fadeOutUpBig')
            backdropAnimation: true,              // true, comma separated string, false or object { in: 'fadeIn', out: 'fadeOut' } (default: true which is equal to > 'fadeIn,fadeOut')
            backdrop: true,                       // when true on backdrop click modal is closed static to disable backdrop click event.
            backdropCss: 'rgba(51,51,51,0.7)',    // adds 'background:' css style, can use url, rgba, solid color.
            keyboard: true,                       // when true esc closed modal if backdrop is not equal to 'static'
            header: true,                         // whether to show the default template's header.
            footer: true,                         // whether to show the default template's footer.

            /* default template options */
            closeIcon: '&times;',                 // the text/html to use for the default template's close icon. can pass font awesome or glyphicon if desired.
            closeText: 'Close',                   // the text to use for the default template's close button.
            okText: 'Ok',                         // the text to use for the default template's ok button.
            closeClass: 'btn btn-default',        // the class to use for the default template's close button.
            okClass: 'btn btn-primary',           // the class to use for the default template's ok button.
            closeIconClass: 'close',              // the class to add to the close icon.

            /* scope and controller */
            controller: angular.noop,             // angular controller.
            controllerAs: null,                   // define controller as.
            scope: null,                          // pass existing scope.

            /* events */
            onCloseDestroy: false,                // when true the modal will be destroyed on close. Good when modal is initialized and shown from click event.
            onClose: null,                        // callback on close.
            onShow: null,                         // callback on show.
            onOk: null,                           // callback on ok.
            onDestroy: null,                      // callback on scope destroy.
            onBind: null                          // callback when modal is bound.

        }, get, set;

    set = function set(value) {
        angular.extend(defaults, value);
    };

    get = ['$rootScope', '$http', '$q', '$compile', '$controller', '$templateCache', '$timeout', '$document',
           '$animate', '$window', '$injector',
        function ($rootScope, $http, $q, $compile, $controller, $templateCache, $timeout, $document, $animate,
                  $window, $injector) {


            var defaultTemplate,
                instances = [],
                body,
                sce;

            sce = $injector.get('$sce');

            function isHtml(str) {
                return /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(str);
            }

            function isPath(str) {
                var ext = str.split('.').pop();
                return ext === 'html';
            }

            function htmlReady() {
                if(!sce) return false;
                try {
                    angular.module('ngSanitize');
                    return true;
                } catch (ex) {
                    return false;
                }
            }

            function findElement(q, element) {
                return angular.element((element || document).querySelectorAll(q));
            }

            defaultTemplate =
                '<div class="modal">' +
                    '<div class="modal-dialog" >' +
                        '<div class="modal-content">' +
                            '<div class="modal-header" ng-show="header">' +
                                '<button type="button" ng-class="closeIconClass" aria-hidden="true" ng-click="close()" ng-bind="closeIcon"></button>' +
                                '<h4 ng-show="title"class="modal-title" ng-bind="title"></h4>' +
                                '</div>' +
                            '<div class="modal-body" ng-bind="content"></div>' +
                            '<div class="modal-footer" ng-show="footer">' +
                                '<button type="button" ng-class="closeClass" ng-click="close()" ng-bind="closeText"></button>' +
                                '<button type="button" ng-class="okClass" ng-click="ok()" ng-bind="okText"></button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            $templateCache.get(defaults.template) || $templateCache.put(defaults.template, defaultTemplate);

            $rootScope.$on('$routeChangeStart', function (event, next, current) {
                angular.forEach(instances, function (instance) {
                    if(instance.visibility() === 1)
                        instance.close();
                });
            });

            function ModuleFactory(options) {

                var self, ctrl, isDefault, closing,
                    scope, element, opts,
                    backdrop, initializing, dialog,
                    _requestAnimationFrame, _cancelAnimationFrame,
                    lastAnimation;

                    self = this;

                initializing = false;

                _requestAnimationFrame =
                    $window.requestAnimationFrame ||
                    $window.webkitRequestAnimationFrame ||
                    $window.mozRequestAnimationFrame ||
                    function (callback) {
                        $window.setTimeout(callback, 1000 / 60);
                    };

                _cancelAnimationFrame =
                    $window.cancelAnimationFrame || $window.mozCancelAnimationFrame;

                // gets the html content for the modal */
                function getTemplate() {

                    if (!opts.template) throw new Error('ai-modal requires a template but was not specified.');

                    // var to note using default built in template
                    isDefault = opts.template === 'modal.tpl.html';

                    return loadTemplate(opts.template);
                }

                // resolves the content if exists
                function getContent() {

                    // add some default html in case no content was provided
                    opts.content = opts.content || '';

                    return loadTemplate(opts.content);

                }

                function loadTemplate(template) {

                    var isElement;

                    isElement = document.getElementById(template) || undefined;

                    if (isHtml(template) || !isPath(template)) {

                        var markup = template;

                        if (isElement) {

                            /* make sure we hide the in page element */
                            isElement = angular.element(isElement).css('display', 'none');

                            /* local element in page used as template store in cache */
                            markup = $templateCache.get(template) || angular.element('<div></div>')
                                .append(isElement).html();
                            $templateCache.put(template, markup);
                        }

                        /* if html is present return promise */
                        var defer = $q.defer();
                        defer.resolve(markup);
                        return defer.promise;

                    } else {

                        /* html was not loaded use $http.get to load */
                        return $q.when($templateCache.get(template) || $http.get(template))
                            .then(function (res) {
                                if (res.data) {
                                    $templateCache.put(template, res.data);
                                    return res.data;
                                }
                                return res;
                            });

                    }
                }

                function normalizeAnimation() {

                    var ani,
                        backAni,
                        tmp;

                    ani = { in: null, out: null };
                    backAni = { in: null, out: null };

                    if (angular.isObject(opts.animation)) {
                        ani = opts.animation;
                    } else if (angular.isString(opts.animation)) {
                        tmp = opts.animation.replace(/\s+/g, ',').split(',');
                        if (tmp.length === 2)
                            ani = { in: tmp[0], out: tmp[1] };
                    } else {
                        if (opts.animation === true)
                            ani = { in: 'fadeInDownBig', out: 'fadeOutUpBig' };
                    }
                    opts.animation = ani;

                    if (angular.isObject(opts.backdropAnimation)) {
                        backAni = opts.backdropAnimation;
                    } else if (angular.isString(opts.backdropAnimation)) {
                        tmp = opts.backdropAnimation.replace(/\s+/g, ',').split(',');
                        if (tmp.length === 2)
                            backAni = { in: tmp[0], out: tmp[1] };
                    } else {
                        if (opts.backdropAnimation === true)
                            backAni = { in: 'fadeIn', out: 'fadeOut' };
                    }
                    opts.backdropAnimation = backAni;

                }

                // returns the visibility state of the modal
               function visibility() {
                    return scope.visibility;
                }

                // show the modal
                function show() {

                    /* prevents flicker on reinit */
                    var check = setInterval(function () {

                        if (!initializing) {
                            clearInterval(check);
                            scope.$apply(function () {
                                ready();
                            });
                        }

                    }, 10);

                    function ready() {

                        scope.visibility = 1;

                        if (opts.animation.in) {

                            if (lastAnimation)
                                _cancelAnimationFrame(lastAnimation);

                            lastAnimation = _requestAnimationFrame(function () {

                                if (opts.backdropAnimation.in)
                                //backdrop.addClass(opts.backdropAnimation.in);
                                    $animate.setClass(backdrop, opts.backdropAnimation.in, opts.backdropAnimation.out, function () {

                                    });

                                if (opts.animation.in)
                                    $animate.setClass(dialog, opts.animation.in, opts.animation.out, function () {
                                        showComplete();
                                    });

                            });

                        } else {
                            showComplete();
                        }
                    }

                }

                // modal has been shown
                function showComplete() {
                    if (opts.onShow && angular.isFunction(opts.onShow))
                        opts.onShow(self);
                }

                // close the modal
                function close($event, callback, preventAnimation) {

                    // if click event make sure only the background closes the modal
                    if ($event) {
                        if (opts.backdrop === 'static') return;
                        var target = angular.element($event.target);
                        if (!target.parent().hasClass('ai-modal-background') && !target.hasClass('ai-modal-background')) return;
                    }

                    if (closing) return;
                    closing = true;

                    if (opts.animation.out && !preventAnimation) {

                        if (opts.backdropAnimation.out)
                            $animate.setClass(backdrop, opts.backdropAnimation.out, opts.backdropAnimation.in, function () {
                            });
                        if (opts.animation.out)
                            $animate.setClass(dialog, opts.animation.out, opts.animation.in, function () {
                                closeComplete(callback);
                            });
                        else
                            closeComplete(callback);

                    } else {
                        scope.visibility = 0;
                        closing = false;
                        if (opts.onCloseDestroy)
                            self.destroy();
                        closeComplete(callback);
                    }

                }

                // modal close complete function
                function closeComplete(callback) {

                    if (!callback) {
                        if (opts.onClose && angular.isFunction(opts.onClose))
                            opts.onClose(self);
                    } else {
                        callback();

                    }

                }

                // calls close then triggers ok callback if not null
                function ok(callback) {

                    close(null, function () {
                        if (angular.isFunction(opts.onOk))
                            opts.onOk(self);
                    });

                }

                // calls close when keyup is triggered usually esc key
                function onKey() {

                    if (opts.backdrop === 'static' || !opts.keyboard) return;
                    $document.bind('keyup', function (e) {
                        var code = e.which || e.keyCode;
                        if (code === 27) {
                            scope.$apply(function () {
                                close();
                            });
                        }
                    });

                }

                // destroys the modal
                function destroy() {

                    if (lastAnimation) _cancelAnimationFrame(lastAnimation);

                    element.remove();
                    var idx = instances.indexOf(self);

                    if (idx !== -1)
                        instances.splice(idx, 1);

                    if (opts.onDestroy && angular.isFunction(opts.onDestroy))
                        opts.onDestroy(self, scope);

                    scope.$destroy();

                }

                function setOptions(key, value, reinit) {

                    var obj = {},
                        finishShow;
                    if (angular.isObject(key)) {
                        obj = key;
                        if (value && typeof (value) === 'boolean') {
                            reinit = value;
                        }
                    } else if (key && value) {
                        obj[key] = value;
                    }

                    if(scope.isHtml && obj.content) {
                        var contentDiv = findElement('.ai-modal-content', dialog[0]);
                        if(contentDiv)
                            contentDiv.html(obj.content);
                    }

                    // extend options
                    opts = angular.extend(opts, obj);

                    // rebind the scope
                    bindScope();

                    // check for show after update
                    finishShow = opts.show || false;

                    // we need to reinit to change many config options. if you don't want to reinit
                    // you can pass true for "suppressInit" to change the options only. Only some
                    // options can be set without reinit.
                    if (reinit) {
                        element.remove();
                        init(finishShow);
                    } else {
                        compile();
                        if(finishShow)
                            self.show();
                    }

                }

                // resets the visibility of the modal after animation has completed.
                function resetVisibility() {
                    if (closing) {
                        $timeout(function () {
                            scope.visibility = 0;
                            closing = false;
                            if (lastAnimation) _cancelAnimationFrame(lastAnimation);
                            if (opts.onCloseDestroy)
                                self.destroy();
                        });
                    }
                }

                function compile() {
                    $compile(element)(scope);
                }

                function bindScope() {

                    var locals = opts.locals;
                    locals.visibility = 0;

                    locals.title = opts.title;
                    locals.header = opts.header;
                    locals.footer = opts.footer;

                    locals.ok = ok;
                    locals.close = close;

                    locals.okText = opts.okText;
                    locals.okClass = opts.okClass;
                    locals.closeText = opts.closeText;
                    locals.closeIcon = opts.closeIcon;
                    locals.closeClass = opts.closeClass;
                    locals.closeIconClass = opts.closeIconClass;
                    locals.content = opts.content;

                    /* iterate the locals */
                    if (locals) {
                        for (var prop in locals) {
                            if (locals.hasOwnProperty(prop))
                                scope[prop] = locals[prop];
                        }
                    }

                }

                // attach methods.
                function bindMethods() {

                    self.show = show;
                    self.close = close;
                    self.ok = ok;
                    self.destroy = destroy;
                    self.visibility = visibility;
                    self.setOptions = setOptions;
                    self.compile = compile;
                    self.scope = scope;

                }

                // initializes the modal
                function init(finishShow) {

                    initializing = true;

                    /* normalize animation to object */
                    normalizeAnimation();

                    var backdropTemplate = '<div class="ai-modal-background" ng-cloak></div>',
                        backdropCss = {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            'z-index': 1040,
                            overflow: 'hidden'
                        };

                    if (opts.backdrop !== 'static')
                        backdropTemplate = '<div class="ai-modal-background" ng-click="close($event)"></div>';

                    if(!body)
                        body = findElement('body', document);

                    /* create the backdrop template */
                    backdrop = angular.element(backdropTemplate);
                    if (opts.backdropCss && opts.backdropCss !== false)
                        backdropCss.background = opts.backdropCss;
                    backdrop.css(backdropCss);

                    scope = (opts.scope && opts.scope.$new()) || $rootScope.$new();
                    scope.options = opts;
                    scope.visibility = 0;
                    ctrl = $controller(opts.controller, { $scope: scope });

                    /* check for controller as */
                    if (opts.controllerAs)
                        scope[opts.controllerAs] = ctrl;

                    /* attach locals to scope */
                    finish(finishShow);

                }

                function finish(finishShow) {

                    // bind locals and helper methods
                    bindScope();
                    bindMethods();

                    var html = getTemplate(),
                        container = findElement(opts.container, document),
                        contentHtml = getContent();

                    contentHtml.then(function (content) {

                        scope.content = content;

                        html.then(function (template) {

                            if (!htmlReady()){
                                console.log('Modal could not enable ng-bind-html. ngSanitize is not loaded.');
                            } else {
                                template = template.replace(/ng-bind/g, 'ng-bind-html');
                            }

                            // create the dialog element
                            dialog = angular.element(template);

                            var bindType = htmlReady() ? 'ng-bind-html' : 'ng-bind',
                                bindAttr = '[' + bindType + '="content"]',
                                contentDiv = findElement(bindAttr, dialog[0]).addClass('ai-modal-content');

                            // check for content
                            if (content) {
                                if (htmlReady()) {
                                    contentDiv.removeAttr(bindType).html(content);
                                    scope.isHtml = true;
                                } else {
                                    contentDiv.text(content);
                                }
                            }

                            /* handle bootstrap modal templates */
                            if (dialog.hasClass('modal'))
                                dialog.css({ display: 'block', overflow: 'hidden' });

                            if (opts.animation.in || opts.animation.out) {

                                if (opts.animation.in)
                                    dialog.addClass('animated');

                                if (opts.backdropAnimation.in)
                                    backdrop.addClass('animated');

                                /* add animation listener when complete reset visibility */
                                dialog.bind('animationend webkitAnimationEnd oAnimationEnd', resetVisibility);

                            }

                            /* add the dialog template to the backdrop */
                            element = backdrop.append(dialog);
                            element.attr('ng-show', 'visibility == 1');

                            /* check on key close */
                            onKey();

                            /* compile the modal element */
                            $compile(element)(scope);

                            /* prepend to our container */
                            container.prepend(element);

                            /* add to instances */
                            instances.push(self);

                            /* listen for destroy */
                            scope.$on('destroy', function () {
                                destroy();
                            });

                            /* if on bind callback return instance */
                            if (opts.onBind && angular.isFunction(opts.onBind))
                                opts.onBind(self);

                            initializing = false;

                            if (finishShow)
                                self.show();

                        });

                    });

                }

                // merge options
                opts = angular.extend(defaults, options);

                // initialize modal.
                init(opts.show);

            }

            return ModuleFactory;

    }];

    return {
        $get: get,
        $set: set
    };

})


.directive('aiModal', ['$modal', function ($modal) {

    return {
        restrict: 'AE',
        link: function (scope, element, attrs) {

            var $module, options;

            options = { };

           function bindEvents() {

                element.unbind('click');

                // add click event
                element.on('click', function () {
                    scope.$apply(function () {
                        $module.show();
                    });
                });

            }

            function init() {

                var tmpOpt = attrs.aiModal || attrs.options;
                scope.options = options = scope.$eval(tmpOpt);

                if (!$module)
                    $module = new $modal(scope.options);

                // check if additional css styles
                if (scope.options.cssClass)
                    element.addClass(scope.options.cssClass);

                // unbind/bind jqlite events
                bindEvents();

            }

            scope.$watch(attrs.aiModal, function (newVal, oldVal) {

                if (newVal === oldVal) return;

                if (angular.isObject(newVal)) {

                    angular.extend(scope.options, scope.$eval(newVal));

                    if ($module) {
                        $module.destroy();
                        $module = null;
                        init();
                    } else {
                        init();
                    }
                }

            }, true);

            scope.$on('destroy', function () {
                $module.destroy();
            });

            // get data dash attributes model will override these
            //angular.forEach(defaults, function (v, k) {
            //
            //    if (attrs[k]) {
            //
            //        var val = attrs[k],
            //            isBool = /^(true|false)$/i.test(val) || false,
            //            isInt = parseInt(val) || undefined;
            //
            //        // convert bools/ints
            //        if (isBool) val = JSON.parse(val);
            //        else if (isInt) val = isInt;
            //        dataOptions[k] = val;
            //    }
            //
            //});

            init();

        }


    };

}]);


angular.module('ai.flash.factory', [])

    .provider('$flash', function $flash() {

        var defaults, get, set;

        // default settings.
        defaults = {
            template: 'flash.html',                 // the template for flash message.
            html: true,                             // when true html flash messages can be used.(requires ngSanitize)
            errors: true,                           // when true flash is shown automatically on http status errors.
            errorKey: 'err',
            validationKey: undefined,               // this is the property contained in the error used for displaying
                                                    // validation error messages. for example mongoose uses 'errors'.
                                                    // if undefined validation errors are undefined.
            excludeErrors: [401, 403, 404],         // exclude errors by status type.           
            errorName: 'Unknown Exception',         // the error name to use in event and error.name is not valid.
            errorMessage: 'An unknown exception ' + // default error message in event one is not provided.
                          'has occurred, if the ' +
                          'problem persists ' +
                          'please contact the ' +
                          'administrator.',
            title: true,                            // when true flash error messages use the error name as the title
                                                    // in the flash message.
            stack: false,                           // when true stack trace is shown.
            multiple: false,                        // whether to allow multiple flash messages at same time.
            type: 'info',                           // the default type of message to show also the css class name.
            typeError: 'danger',                    // the error type or class name for error messages.
            animation: false,                       // provide class name for animation.
            timeout: 3500,                          // timeout to auto remove flashes after period of time..
                                                    // instead of by timeout.
            onError: undefined                      // callback on error before flashed, return false to ignore.

        };

        // set global provider options.
        set = function (key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        // get provider
        get = ['$rootScope', '$q', '$templateCache', '$http', '$timeout', '$compile',
            function ($rootScope, $q, $templateCache, $http, $timeout, $compile) {

            var flashTemplate, $module;
 
            flashTemplate = '<div class="ai-flash-item" ng-repeat="flash in flashes" ng-mouseenter="enter(flash)" ' +
                            'ng-mouseleave="leave(flash)" ng-class="flash.type">' +
                                '<a class="ai-flash-close" type="button" ng-click="remove(flash)">&times</a>' +
                                '<div class="ai-flash-title" ng-if="flash.title" ng-bind-html="flash.title"></div>' +
                                '<div class="ai-flash-message" ng-bind-html="flash.message"></div>' +
                            '</div>';

            $templateCache.get(defaults.template) || $templateCache.put(defaults.template, flashTemplate);

            function isHtml(str) {
                return /<(br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|wbr|!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video).*?<\/\2>/.test(str);
            }

            function isPath(str) {
                if(!str || !angular.isString(str)) return false;
                var ext = str.split('.').pop();
                return ext === 'html' || ext === 'tpl';
            }

            function findElement(q, element) {
                return angular.element((element || document).querySelectorAll(q));
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
            
            function overflow(body) {
                var x, y;
                x = body[0].style.overflow || undefined;
                y = body[0].style.overflowY || undefined;
                return {x:x,y:y};
            }

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
                        }, flash, tmpTitle;
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
                            type: type,
                            title: title,
                            timeout: timeout
                        };
                    }
                    // extend object with defaults.
                    flash = angular.extend({}, angular.copy(flashDefaults), flash);
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
                
                // get overflows and body.
                body = findElement('body');
                overflows = overflow(body);
                
                function init(_element, _options) {
                    
                    element = _element;
                    options = _options;

                    // extend options
                    options = options || {};
                    $module.scope = scope = options.scope || $rootScope.$new();
                    $module.options = scope.options = options = angular.extend(defaults, options);

                    scope.add = add;
                    scope.remove = remove;
                    scope.removeAll = removeAll;
                    scope.flashes = flashes;
                    scope.leave = leave;
                    scope.enter = enter;

                    $module.add = add;
                    $module.remove = remove;
                    $module.removeAll = removeAll;            

                    // load the template.
                    loadTemplate(options.template).then(function (res) {
                        if(res) {
                            element.html(res);
                            $compile(element.contents())(scope);
                            element.addClass('ai-flash');
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
                    
                }                
            
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
                    $module = $flash.init(element, options);
                }

                options = scope.$eval(attrs.options) || scope.$eval(attrs.aiFlash);
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
                
                function handleFlashError(errObj){
                    console.log(errObj);
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
                    if(flash.options.title)
                        flash.add(message, flash.options.typeError, name);
                    else
                        flash.add(message, flash.options.typeError);
                    return $q.reject(res);
                }
                if(res.status && excludeErrors.indexOf(res.status) === -1){
                    // handle error using flash.
                    if(!res.data){                        
                        if(flash.options.title)
                            flash.add(res.statusText, flash.options.typeError || 'flash-danger', res.status);
                        else
                            flash.add(res.statusText, flash.options.typeError || 'flash-danger');
                        return $q.reject(res);
                    } else {
                        var err = res.data;
                        if(flash.options.onError){
                            $q.when(flash.options.onError(res, flash)).then(function (result) {                                
                                if(result){
                                    if(angular.isObject(result)){
                                        handleFlashError(result);                                        
                                    } else {
                                        handleFlashError(err);
                                    }
                                }    
                            });
                        } else {
                            handleFlashError(err);
                        }
                    }
                }
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


angular.module('ai.passport.factory', [])

    .provider('$passport', function $passport() {

        var defaults, get, set;

        defaults = {
            levels: {
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
            refreshAction: 'get /api/passport/refresh',         // when the page is loaded the user may still be
                                                                // logged in this calls the server to ensure the
                                                                // active session is reloaded.

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

        set = function (options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$rootScope', '$location', '$http', '$route', function ($rootScope, $location, $http, $route) {

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
                    $module.options = angular.extend(defaults, options);

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
         * @param {object} options - the options to be merged with defaults.
         */
        set = function (options) {
            defaults = angular.extend(defaults, options);
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

angular.module('ai.step', [])

.provider('$step', function $step() {

    var defaults = {

            key: '$id',                     // the primary key for the collection of steps.
            start: 0,                       // the starting index of the step wizard.
            title: 'true',                  // when true title is auto generated if not set in step object.
            continue: true,                 // when true if called step is disabled continue to next enabled.
            breadcrumb: false,              // when true only header is shown, used as breadcrumb.
                                            // breadcrumb mode looks for property 'href' to navigate to.

                                            // html templates, can be html or path to template.

            header: 'step-header.tpl.html',   // the header template when using directive.
            content: 'step-content.tpl.html', // the content template to use when using directive.
            actions: 'step-actions.tpl.html', // the actions template when using directive.

                                            // hide/show buttons, disable/enable header click events.

            showNumber: true,               // when true step number show next to title.
            showNext: true,                 // when true next button is created.
            showPrev: true,                 // when true prev button is created.
            showSubmit: true,               // when true submit button is created.
            headTo: true,                   // when true header can be clicked to navigate.

                                            // all events are called with $module context except onload which passes it.

            onBeforeChange: undefined,      // callback event fired before changing steps.
            onChange: undefined,            // callback on changed step, returns ({ previous, active }, event)
            onSubmit: undefined,            // callback on submit returns ({ active }, event)
            onLoad: undefined               // callback on load returns ($module)

        }, get, set;

    set = function set(obj) {
        angular.extend(defaults, obj);
    };

    get = [ '$rootScope', '$templateCache', '$compile', '$http', '$q', '$location',
        function($rootScope, $templateCache, $compile, $http, $q, $location) {

        var headerTemplate, contentTemplate, actionsTemplate;

        headerTemplate = '<div class="ai-step-header" ng-show="steps.length">' +
                            '<ul>' +
                                '<li ng-click="headTo($event, $index)" ng-repeat="step in steps" ' +
                                'ng-class="{ active: step.active, disabled: !step.enabled, ' +
                                'clickable: options.headTo && step.enabled, nonum: !options.showNumber }">' +
                                    '<span class="title">{{step.title}}</span>' +
                                    '<span class="number">{{step.$number}}</span>' +
                                '</li>' +
                            '</ul>' +
                         '</div>';

        contentTemplate = '<div ng-if="!options.breadcrumb" class="ai-step-content" ng-show="steps.length">' +
                            '<div ng-show="isActive($index)" ng-repeat="step in steps" ng-bind-html="step.content"></div>' +
                          '</div>';

        actionsTemplate = '<div ng-if="!options.breadcrumb" class="ai-step-actions" ng-show="steps.length">' +
                            '<hr/><button ng-show="options.showPrev" ng-disabled="isFirst()" class="btn btn-warning" ' +
                                'ng-click="prev($event)">Previous</button> ' +
                            '<button ng-show="options.showNext" ng-disabled="isLast()" class="btn btn-primary" ' +
                                'ng-click="next($event)">Next</button> ' +
                            '<button ng-show="isLast() && options.showSubmit" class="btn btn-success submit" ' +
                                'ng-click="submit($event)">Submit</button>' +
                          '</div>';

        $templateCache.get(defaults.header) || $templateCache.put(defaults.header, headerTemplate);
        $templateCache.get(defaults.content) || $templateCache.put(defaults.content, contentTemplate);
        $templateCache.get(defaults.actions) || $templateCache.put(defaults.actions, actionsTemplate);

        function isHtml(str) {
            return /<(br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|wbr|!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video).*?<\/\2>/.test(str);
        }

        function isPath(str) {
            if(!str || !angular.isString(str)) return false;
            var ext = str.split('.').pop();
            return ext === 'html' || ext === 'tpl';
        }

        function isElement(elem) {
                return !!(elem && elem[0] && (elem[0] instanceof HTMLElement));
            }

        function findElement(q, element) {
            return angular.element(element || document).querySelectorAll(q);
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

        function ModuleFactory(element, options) {

            var $module = {},
                steps = [],
                templates =[],
                contentTemplates = [],
                _steps,
                scope,
                _previous;

            // shift args if needed.
            if(!isElement(element) && angular.isObject(element)){
                options = element;
                element = undefined;
            }

            // extend options
            options = options || {};
            $module.scope = scope = options.scope || $rootScope.$new();
            $module.options = scope.options = options = angular.extend(defaults, options);

            // check if options contain steps.
            if(options.steps){
                _steps = options.steps;
                delete options.steps;
            }

            // Private Methods.

            // trim string
            function trim(str) {
                return str.replace(/^\s+/, '').replace(/\s+$/, '');
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
                }

                function done() {

                    if(nextActive) {
                        if(!nextActive.enabled && options.continue){

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
                if(!isHtml(obj.content) && !isPath(obj.content))
                    obj.content = '<span>' + obj.content + '</span>';
                contentTemplates.push(loadTemplate(obj.content));
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
                if(!options.headTo) return;
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
                        _steps = trim(_steps).split(',');
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
                            v = trim(v);
                        add(v);
                    });
                }

                if(!element)
                    return callback();

                var template, contentTemplate;

                template = '';
                contentTemplate = '<div ng-show="isActive({{INDEX}})">{{CONTENT}}</div>';

                if(options.header)
                    templates.push(loadTemplate(options.header || ''));

                if(options.content)
                    templates.push(loadTemplate(options.content || ''));

                if(options.actions)
                    templates.push(loadTemplate(options.actions || ''));

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
                        $compile(element.contents())(scope);
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

                if(angular.isFunction(options.onLoad))
                    options.onLoad($module);

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
                $module = $step(element, options);
            }

            options = scope.$eval(attrs.aiStep || attrs.options);
            options = angular.extend(defaults, options);

            init();

        }
    };

}]);
angular.module('ai.tab', [])
.provider('$tab', function $tab() {

    var defaults = {

        }, get, set;

    set = function set(key, value) {
        if(arguments.length === 2)
           defaults[key] = value;
        if(arguments.length === 1 && angular.isObject(key))
            defaults = angular.extend(defaults, key);
    };

    get = [function () {

        function ModuleFactory(element, options){

            var $module = {},
                scope;

            options = options || {};
            $module.scope = scope = options.scope || $rootScope.$new();
            $module.options = scope.options = options = angular.extend(angular.copy(defaults), options);



            return $module;
        }

        return ModuleFactory;

    }];

    return {
        $get: get,
        $set: set
    };

})
.directive('aiTab', ['$tab', function ($tab) {

    return {
        restrict: 'AC',
        scope: true,
        link: function (scope, element, attrs) {

            var defaults, options, $module;
            defaults = {
                scope: scope
            };

            function init() {
                $module = $tab(element, options);
            }

            options = scope.$eval(attrs.aiTab || attrs.options);
            options = angular.extend(defaults, options);

            init();

        }
    };

}]);

angular.module('ai.table', ['ngSanitize'])

    /* table provider merely provides a way to globally confgure table */
    .provider('$table', [ function $table() {

        /* COLUMN OPTIONS
         * map: property to map to.
         * sortable: enables column sorting default: true.
         * draggable: column can be rearranged.

         * filter: an angular filter to apply or a function which returns the formatted value default: false.
           string filters should be formatted as 'filter_name|filter_format' where
           filter_name is 'date' and filter_format is 'medium' example: filter: 'date|medium'.
           NOTE: ignored if cellTemplate is passed.

         * headerClass: the css class for header default: false.

         * cellClass: the css class for the cell if any default: false.
           NOTE if header class is enabled assumes same for cell class,
           makes alignment easier instead of having to decorate both classes.

         * headerTemplate: an html template to use for the column cell default: false.
         * cellTemplate: an html template to use for the header cell default: false.
         * editTemplate: the template to use for editing this overrides simple 'editType' configurations.

         * editType: the type to use for editing this column default: undefined to disabled editing.
           NOTE: valid types are text, number, date, datetime, time, checkbox, email, password, tel
           types must be an input element, e.g. selects etc are not currently supported.

         * editOptions: only used when editType is 'select'. this will init the options for your select.
           NOTE: if you create a scope object in your controller called let's say 'items' you can access
           it like such: editOptions: 'item.id as item.text as item in parent.items'.

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
            auto: true,                                 // when true row columns are automatically generated with defaults datatype: boolean
                                                        // to allow only defined columns in the columns option below set this to false.
            uppercase: true,                            // if true headers will automatically converted to uppercase, useful when using auto
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
            loader: true,                               // if true the loader template creates a modal effect with preloader on async operations
            loaderDelay: 100,                           // set value to delay displaying loader until after specified milliseconds. 100-300 ms usually works well.
                                                        // set loader to 0 if you want it to show right away.

            // SORTING & SEARCHING & FILTERING 
            actions: true,                              // whether or not to display actions for searching/filtering datatype: boolean
            changeable: true,                           // indicates if allowed to change displayed records/rows per page datatype: boolean
            sortable: true,                             // whether or not the table can use sorting datatype: boolean 
            searchable: true,                           // whether or not the data is searchable datatype: boolean
            selectable: false,                          // whether or not rows can be selected, accepts true or 'multi' for multi-selection
                                                        // datatype: boolean/string NOTE: requires onSelect to be valid function.
                                                        // useful to prevent selection of row on anchor or other element click.
            selectableAll: false,                       // when true built in button displayed to select and clear all.
            deleteable: false,                          // indicates rows can be deleted.
            editable: false,                            // indicates whether rows are editable, columns must also be specified with editType.
            exportable: false,                          // when true exportable options are displayed for export of current filtered results.
            orderable: false,                           // if true columns and rows can be re-ordered.

            options: true,                              // indicates if display, goto & select/clear options should be visible
            orderBy: undefined,                         // initial order to display ex: 'name' or '-name' for descending datatype: string
                                                        // NOTE: with order by you can also use true or false ex: 'name true' where true means
                                                        // the order is reverse e.g. descending.

            // PAGING & COUNTS
            pager: true,                                // options for paging datatype: boolean 
            display: 10,                                // the number of records to display per page datatype: integer 
            pages: 5,                                   // the number of pages show in the pager datatype: integer 
            counts: true,                               // when pager is enabled page/record counts are displayed datatype: boolean 
            pagination: true,                           // this enables hiding pagination but showing counts pager must be set to true datatype: boolean 
            firstLast: true,                            // indicates whether first and last should be shown in pager 
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
            onReady: undefined,                         // callback after table as completely rendered.

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

        set = function $set(options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$rootScope','$http', '$q', '$templateCache', '$compile', '$filter', '$timeout', 
            function $get($rootScope,$http, $q, $templateCache, $compile, $filter, $timeout) {

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

            /* makes sure we have the default templates loaded */
            $templateCache.get(defaults.actionsTemplate) || $templateCache.put(defaults.actionsTemplate, actionsTemplate);
            $templateCache.get(defaults.tableTemplate) || $templateCache.put(defaults.tableTemplate, tableTemplate);
            $templateCache.get(defaults.pagerTemplate) || $templateCache.put(defaults.pagerTemplate, pagerTemplate);
            $templateCache.get(defaults.nodataTemplate) || $templateCache.put(defaults.nodataTemplate, nodataTemplate);
            $templateCache.get(defaults.loaderTemplate) || $templateCache.put(defaults.loaderTemplate, loaderTemplate);

            function isHtml(str) {
                return /<(br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|wbr|!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video).*?<\/\2>/.test(str);
            }

            function isPath(str) {
                var ext = str.split('.').pop();
                return ext === 'html' || ext === 'tpl';
            }

            function find(q, element) {
                return angular.element((element || document).querySelectorAll(q));
            }

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

            function isPlainObject(obj) {
                try{
                    return JSON.stringify(obj).indexOf('{') !== -1;
                } catch(e){
                    return false;
                }
            }

            function ModuleFactory(element, options) {

                var $module, scope, table, loadedTemplates, 
                    loader, loading, isReady, nodata, initialized;
                
                $module = {};
                isReady = false;
                initialized = false;

                // allow passing element in options.
                if(isPlainObject(element)){
                    options = element;
                    element = options.element;
                }

                scope = (options.scope && options.scope.$new()) || $rootScope.$new();
                //scope = options.scope || $rootScope.$new();
                //options = scope.options = angular.extend(defaults, options);
                options = angular.extend({}, defaults, options);

                // TEMPLATING
                function loadTemplate(t) {

                    if (isHtml(t) && !isPath(t)) {

                        /* if html is present return promise */
                        var defer = $q.defer();
                        defer.resolve(t);
                        return defer.promise;

                    } else {

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

                // gets list of user defined templates for table 
                function userTemplates(promises) {
                    var ctr = Object.keys(loadedTemplates).length -1;
                    angular.forEach(options.columns, function (v, k) {
                        if(v.headerTemplate){
                            promises.push(loadTemplate(v.headerTemplate));
                            loadedTemplates[k] = { index: ctr += 1, isHeader: true };
                        }
                        if(v.cellTemplate) {
                            promises.push(loadTemplate(v.cellTemplate));
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
                            angular.extend(config.params, mapParams);
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
                        if(!options.auto && !colConf) return;

                        // extend defaults 
                        colConf = colConf === false ? { excluded: true } : colConf;
                        colConf = angular.extend(colDefaults, colConf);
                        colConf.map = colConf.map || key;
                        colConf.label = colConf.label === '' || colConf.label === null  ? '' : colConf.label || key;
                        colConf.sortable = colConf.sortable === false ? false : options.sortable ? true : false;
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
                    if(!options.sortable || column.sortable === false) return;

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
                    if (!options.sortable || !column.sortable) return '';

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
                    scope.selectable = options.selectable;
                    scope.selectableAll = options.selectableAll;
                    scope.changeable = options.changeable;
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
                    scope.actions = options.actions;
                    scope.searchable = options.searchable;
                    scope.filter = filter;
                    scope.reset = reset;
                    scope.q = undefined;
                    scope.sort = sort;
                    scope.sortClass = sortClass;

                    /* add pager to scope */
                    scope.page = 1;
                    scope.pager = options.pager;
                    scope.pages = [];
                    scope.pageTo = pageTo;
                    scope.pageToKeyUp = pageToKeyUp;
                    scope.pagePrev = pagePrev;
                    scope.pageNext = pageNext;
                    scope.hasNext = hasNext;
                    scope.hasPrev = hasPrev;
                    scope.counts = options.counts;
                    scope.pagination = options.pagination;
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
                    if(!options.pager){
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
                        loadTemplate(options.actionsTemplate),
                        loadTemplate(options.tableTemplate),
                        loadTemplate(options.pagerTemplate),
                        loadTemplate(options.nodataTemplate),
                        loadTemplate(options.loaderTemplate)
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

                            nodata = !scope.filtered || !scope.filtered.length || (!options.auto && !Object.keys(options.columns).length);

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
                            $compile(element.contents())(scope);

                            // find loader element 
                            loader = find('.ai-table-loader', document);

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
            link: function link(scope, element, attrs) {

                var defaults, options, $module;

                defaults = {
                    scope: scope
                };

                function init() {

                    /* initialize the new table */
                    $module = $table(element, options);

                    $module.ready(function() {
                        scope.instance = this;
                    });

                }

                scope.$watch(
                    function () {
                        return attrs.aiTable || attrs.options;
                    }, function (newVal, oldVal) {
                        if(newVal === oldVal) return;
                    }, true);


                scope.$on('$destroy', function () {
                    element.remove();
                    $module = null;
                    options = null;
                });         

                options = scope.$eval(attrs.aiTable || attrs.options);
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
                        if(angular.isString(value) && scope.$parent.$parent.uppercase)
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
                            scope.$apply(function () {
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

angular.module('ai.widget', [])

.provider('$widget', function $widget() {

    var defaults = {
            nicescroll: {
                horizrailenabled: false         // disables horizontal scroll bar.
            },
            decimal: {
                places: 2                       // default decimal places.
            },
            redactor: {
                focus: true,
                plugins: ['fullscreen']
            },
            case: {
                casing: 'first',
                event: 'blur'
            },
            compare: {
                compareTo: undefined,           // the html name attribute of the element or form scope property to compare to.
                requireValue: true,             // should always be true, rare cases where you may need it to be false.
                                                // throws false when values are empty/undefined.
                dataType: 'string',             // options are string, date, time, datetime, integer
                precision: 'minutes'            // only valid when evaluating time when dataType is time or datetime.
                                                // valid options 'minutes', 'seconds', 'milliseconds'
            }
        },
        get, set;

    set = function (key, options) {
        if(angular.isObject(key)){
            options = key;
            key = undefined;
            defaults = angular.extend(defaults, options);
        } else {
            defaults[key] = angular.extend(defaults[key], options);
        }
    };

    get = [ function () {

        // factory allows for globally
        // setting widget options.
        function ModuleFactory(key, options) {
            options = options || {};
            if(!defaults[key]) return options;
            options = angular.extend(defaults[key], options);
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

.directive('aiNicescroll', ['$widget', '$timeout', function($widget, $timeout) {

    return {
        restrict: 'AC',
        link: function(scope, element, attrs) {

            var defaults, options, $directive;

            console.assert(window.NiceScroll, 'ai-nicescroll requires the NiceScroll library ' +
                'see: http://areaaperta.com/nicescroll');

            defaults = angular.copy($widget('nicescroll'));

            function init() {
                $timeout(function () {
                    $directive = element.niceScroll(options);
                },0);
            }

            options = attrs.aiNicescroll || attrs.options;
            options = angular.extend(defaults, scope.$eval(options));
            init();
        }
    };
}])

// ensures handling decimal values.
.directive('aiDecimal', [ '$widget', function($widget) {
    return {
        restrict: 'AC',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel) {

            var defaults, options, format, formatted, regex;

            defaults = angular.copy($widget('decimal'));
            regex = new RegExp('^[0-9]+\.\d{2}$');
            formatted = false;
            format = function (val) {
                if(val !== undefined && !regex.test(val))  {
                    val = parseFloat(val).toFixed(options.places);
                    element.val(val);
                    ngModel.$setViewValue(val);
                }
            };
            scope.$watch(attrs.ngModel, function (newVal, oldVal) {
                if(newVal === undefined) formatted = false;
                if(newVal !== undefined && !regex.test(newVal) && !formatted){
                    format(newVal);
                    formatted = true;
                }
            });
            function init() {
                element.unbind('blur');
                element.on('blur', function (e) {
                    scope.$apply(function () {
                        format(e.target.value);
                    });
                });
                format();
            }
            options = attrs.aiDecimal || attrs.options;
            options = angular.extend(defaults, scope.$eval(options));
            init();
        }
    };
}])

// Angular wrapper for using Redactor.
.directive('aiRedactor', [ '$widget', function ($widget) {
    return {
        restrict: 'AC',
        scope: true,
        require: '?ngModel',
        link: function (scope, element, attrs) {
            var defaults, options, $directive;

            defaults = angular.copy($widget('redactor'));

            console.assert(window.jQuery && (typeof ($.fn.redactor) !== 'undefined'), 'ai-redactor requires the ' +
                'jQuery redactor plugin. see: http://imperavi.com/redactor.');

            function init() {
                $directive = element.redactor(options);
            }
            options = attrs.aiRedactor || attrs.options;
            options =  angular.extend(defaults, scope.$eval(options));

            init();
        }
    };
}])

.directive('aiCase', [ '$timeout', '$widget', function ($timeout, $widget) {

    return {
        restrict: 'AC',
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {

            var defaults, options, casing;

            defaults = angular.copy($widget('case'));
            options = {};

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

                //angular.element(document).ready(function (e) {
                $timeout(function () {
                    applyCase();
                },100);

               // });
            }

            var tmpOpt = attrs.aiCase || attrs.options;
            if(angular.isString(tmpOpt))
                options.casing = tmpOpt;
            if(angular.isObject(tmpOpt))
                options = scope.$eval(tmpOpt);
            options = angular.extend(defaults, options);

            init();

        }

    };

}])

.directive('aiCompare', [ '$widget', function ($widget) {

    function checkMoment() {
        try{
            var m = moment();
            return true;
        } catch(ex) {
            return false;
        }
    }

    function isInteger(val) {
        return !isNaN(parseInt(val,10)) && (parseFloat(val,10) === parseInt(val,10));
    }

    return {
        restrict: 'AC',
        require: '^ngModel',
        link: function (scope, element, attrs, ngModel) {

            var defaults, options, formElem, form, momentLoaded,
                ngModelCompare;

            // check moment is loaded for datetime compares.
            momentLoaded = checkMoment();
            defaults = angular.copy($widget('compare'));

            function validate(value) {

                var valid;

                if(!ngModelCompare.$viewValue || (!ngModel.$viewValue && options.requireValue)){

                    valid = false;

                } else {

                    if(options.dataType === 'string') {

                        valid = ngModelCompare.$viewValue === value;

                    } else if(options.dataType === 'integer'){

                        if(!isInteger(ngModelCompare.$viewValue) || !isInteger(ngModel.$viewValue)){
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

            var tmpOpt = attrs.aiCompare || attrs.options;
            if(angular.isString(tmpOpt) && tmpOpt.indexOf('{') === -1)
                tmpOpt = { compareTo: tmpOpt };
            else
                tmpOpt = scope.$eval(tmpOpt);

            options = angular.extend({}, defaults, tmpOpt);

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

            var placeholder;

            function init() {

                var label = '<label>{{NAME}}</label>',
                    ts = new Date().getTime(),
                    prev;

                // since angular doesn't support .index()
                // set attr so we can find it when iterating.
                element.attr('_ts_', ts);
                prev = prevSibling(element, ts);

                // test if dot notation model name.
                if(placeholder.indexOf('.') !== -1){
                    placeholder = placeholder.split('.');
                    placeholder = placeholder[1] ? placeholder[1] : placeholder[0];
                }
                placeholder = capitalize(placeholder);

                if(!placeholderSupported() && prev) {
                    label = label.replace('{{NAME}}', placeholder);
                    label = angular.element(label);
                    prev.element[prev.method](label);
                }

            }

            placeholder = element.attr('placeholder') ||  attrs.aiPlaceholder || attrs.ngModel;

            init();

        }
    };
}]);

var form = angular.module('ai.validate', [])
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
            validateOnTouched: true,                                            // validation is thrown when has error and has lost focus e.g. been touched.
            validateOnSubmit: true,                                             // throw validation on form submission.
            validateOnDirtyEmpty: true,                                         // when validate on dirty is true then dirty validation events fire even if model value is undefined/null.
            pristineOnReset: true,                                              // when form is reset return to pristine state.

            messageTitlecase: true,                                             // when validation messages are show convert to title case (useful when ng-model properties are lower case).
            novalidate: true,                                                   // when true adds html5 novalidate tag.
          
            onLoad: null,                                                       // callback called after the form is initialized returns the form object.

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

    get = [function () {


        function ModuleFactory(options) {

            var $module = {};
            options = options || {};
            // set user validators to alt property.
            if(options && options.validators){
                options._validators = options.validators;
                delete options.validators;
            }
            options._validators = options._validators || {};
            $module.options = angular.extend(defaults, options);

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

.controller('AiValidateFormController', ['$scope', '$compile', '$timeout', function ($scope, $compile, $timeout) {

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
            form.summaryElement = $compile(summaryTemplate)($scope);
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
        if ($scope.options.validateOnSubmit) {
            $scope.formElement.on('submit', function () {
                $scope.$apply(function () {
                    $scope.submitForm();
                });
            });
        }

        if ($scope.options.pristineOnReset) {
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
        if($scope.options.messageTitlecase)
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

            if(!$scope.options.validateOnDirtyEmpty)
                valTemplate += ' && {{form}}.{{name}}.$dirty && {{form}}.requireValue("' + name + '")';
            else
                valTemplate += ' && {{form}}.{{name}}.$dirty';
        }

        if($scope.options.validateOnTouched)
            valTemplate += ' && {{form}}.{{name}}.$touched';

        if ($scope.options.validateOnSubmit)
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

        valElem = $compile(valElem)($scope);

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
        if(!$scope.options.validateOnDirtyEmpty)
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
        if($scope.options.onLoad) $scope.options.onLoad(form, $scope);

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
                options = attrs.aiValidateForm || attrs.options;
                $module = factory(scope.$eval(options));
                scope.options = $module.options;

                // add the validation element types to scope options.
                scope.options.elements = elements;

                if(scope.options.novalidate)
                    element.attr('novalidate', '');

                // watch for option changes.
                scope.$watch(
                    function () {
                        return attrs.aiValidateForm || attrs.options;
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



angular.module('ai.viewer', [])

    .provider('$viewer', function $viewer() {

        var defaults = {
                template: '<div class="ai-viewer" ng-view />',
                viewCss: 'ai-viewer-view',
                animate: 'slide'
            },
            get, set;

        set = function $set(options) {
            defaults = angular.extend(defaults, options);
        };

        get = ['$rootScope', '$compile', '$location', function $get($rootScope, $compile, $location) {

            var prevRoutes = [],
                initialized = false,
                state;

            // store previous route set in/out state.
            $rootScope.$on('$routeChangeStart', function (event, next, current) {

                var prevRoute = prevRoutes.slice(0).pop(),
                    route = next.$$route.originalPath;

                current = current || {
                    $$route: '/'
                };

                if(initialized) {
                    if(route === prevRoute) {
                        state = 'back';
                        prevRoutes.pop();
                    } else {
                        state = 'forward';
                        prevRoutes.push(current.$$route.originalPath);
                    }
                } else {
                    initialized = true;
                }

            });

            function ModuleFactory(element, options) {

                var $module = {},
                    view,
                    scope;

                scope = options.scope || $rootScope.$new();
                options = scope.options = angular.extend(defaults, options);

                view = angular.element(options.template);
                view.addClass(options.viewCss);

                // only add ng-class state if animate is enabled.
                if(scope.options.animate)
                    view.attr('ng-class', 'state');

                view = $compile(view)(scope);

                element.append(view);

                // gets previous view.
                $module.getView = function () {
                    return angular.element(document.querySelectorAll('.' + options.viewCss)[0]);
                };

                // gets current state.
                $module.getState = function () {
                    return state;
                };

                $module.forward = function (path) {
                    $location.path(path);
                };

                $module.backward = function (path) {
                    // push route view will see as return path or backward.
                    prevRoutes.push(path);
                    $location.path(path);
                };

                return $module;
            }

            return ModuleFactory;

        }];

        return {
            $get: get,
            $set: set
        };

    })

    .directive('aiViewer', ['$rootScope', '$viewer', function($rootScope, $viewer) {

        return {
            restrict: 'EA',
            link: function(scope, element) {

                var defaults, options, $module;

                defaults = {
                    scope: scope
                };

                function init() {

                    $module = $viewer(element, options);

                    // listen for route change and update state when animation is enabled.
                    $rootScope.$on('$routeChangeSuccess', function () {

                        var state = $module.getState(),
                            prevView = $module.getView();

                        if(state && scope.options.animate) {
                            // check for previously rendered views.
                            if(prevView)
                                prevView.removeClass(state === 'forward' ? 'back' : 'forward').addClass(state);
                        }

                        scope.state = state;

                    });

                }

                options = attrs.aiViewer || attrs.options;
                options = angular.extend(defaults, scope.$eval(options));

                init();
            }
        };

    }]);

})(window, document);
