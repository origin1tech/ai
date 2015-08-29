angular.module('ai.list', ['ai.helpers'])

    .provider('$list', function $list(){

        var defaults = {

            text: 'text',                           // property to use for text values.
            value: 'value',                         // property to use for model values default is text.
            display: false,                         // alt property to use for display values.
            capitalize: undefined,                  // if true display is capitalized. (group is cap also if used).
            searchable: false,                      // indicates that the list is searchable.
            placeholder: 'Please Select',           // placeholder text shown on null value.
            btnClass: 'btn-default',                // the class to add to the button which triggers list.
            allowNull: undefined,                   // when true user can select placeholder/null value.
            addClass: undefined,                    // class to add to ai-list primary element.

            template: 'list.tpl.html',              // the template to use for the list control.
            itemTemplate:
                'list-item.tpl.html',               // template used for list items.
            itemGroupTemplate:
                'list-item-group.tpl.html',
            searchTemplate:
                'list-search.tpl.html',             // template used for searching list.

            source: [],                             // data source can be csv, object, array of string/object or url.
            params: {},                             // object of data params to pass with server requests.
            queryParam: 'q',                        // the param key used to query on server requests.
            method: 'get',                          // the method to use for requests.

            groupKey: undefined,                    // the parent primary key to find children by.
            groupDisplay: undefined,                // used to display the group name.

            selectClose: undefined,                 // if not false list is closed after selection.
            selectClear: undefined,                 // after selecting value clear item.
            closeClear: undefined,                  // when searchable and on toggle close clear query filter.
            blurClose: undefined,                   // when true list is closed on blur event.
            closePrevious: undefined,               // when not false previously opened lists are closed.

            // all callbacks are returned
            // with $module context.
            onToggled: false,                       // on toggle list state. injects(toggle state, event).
            onSelected: false,                      // callback on select. injects(selected, ngModel, event).
            onFilter: false,                        // callback on filter. injects (filter, event).
            onReady: false                          // callback on directive loaded. returns

        }, get, set;

        set = function set(key, value) {
            var obj = key;
            if(arguments.length > 1){
                obj = {};
                obj[key] = value;
            }
            defaults = angular.extend(defaults, obj);
        };

        get = [ '$q', '$parse', '$filter', '$http', '$helpers', '$timeout', function get($q, $parse, $filter, $http, $helpers, $timeout) {

            var baseTemplate = '<button type="button" class="btn ai-list-toggle" ng-click="toggle($event, ts)" ' +
                'ng-class="{expanded: expanded}">' +
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


            var searchTemplate =  '<input type="text" ng-model="q" ng-change="filter($event, q)" ' +
                'class="ai-list-search form-control" placeholder="search"/>';

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
                     //if data object is object literal
                     //convert to an array of objects.

                    if(angular.isObject(data) && !angular.isArray(data)){
                        var tmpData = [];
                        angular.forEach(data, function (v,k) {
                            var obj = {};
                            obj[options.text] = v;
                            obj[options.value] = k;
                            tmpData.push(obj);
                        });
                        data = tmpData;
                    }

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
                            }

                            else {
                                var groupKey = $helpers.findByNotation(v, options.groupKey),
                                    groupDisplay = $helpers.findByNotation(v, options.groupDisplay || options.groupKey);
                                if(groupKey === undefined)
                                    return console.error('Cannot initialize ai.list using groupKey of ' + groupKey);
                                if(options.capitalize !== false)
                                    groupDisplay = groupDisplay.charAt(0).toUpperCase() + groupDisplay.slice(1);
                                _collection[groupKey] = _collection[groupKey] ||
                                { key: groupKey, display: groupDisplay, hidden: false };
                                _collection[groupKey].items = data.filter(function(i) {
                                    return $helpers.findByNotation(i, options.groupKey) === groupKey;
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
                function loadData(q, source) {
                    source = source || options.source;
                    if(angular.isString(source)){
                        var method = options.method,
                            params = buildParams(options.params, q);
                        return $q.when($http[method](source, { params: params }))
                            .then(function(res) {
                                return normalizeData(res.data);
                            });
                    } else {
                        var defer = $q.defer();
                        defer.resolve(normalizeData(source));
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
                    if(!options.groupKey && scope.items){
                        found = scope.items.filter(function (item){
                            return item.value === value;
                        })[0];
                    } else {
                        angular.forEach(scope.items, function (group) {
                            if(!found) {
                                found = group.items.filter(function(item) {
                                    return item.value === value;
                                })[0];
                            }
                        });

                    }
                    return found;
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
                    if(!scope.expanded && options.closeClear === true){
                        clearFilter();
                        button[0].blur();
                    }

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

                // removes item from collection.
                function remove(obj, asIndex) {

                    var idx;

                    if(asIndex){

                        idx = obj;

                    }

                    else {

                        // if obj is value find
                        // and get element.
                        if(typeof obj !== 'object')
                            obj = find(obj);

                        if(typeof obj === 'object' && !(obj instanceof Array))
                            obj = find(obj.value || '');


                        // get the index of the element.
                        idx = scope.source.indexOf(obj);

                    }

                    if(idx !== -1){
                        scope.source.splice(idx, 1);
                        scope.clearFilter();
                    }

                }

                // adds item to collection.
                function add(obj) {
                    obj = normalizeData([obj]);
                    if(obj && obj.length > 1){
                        scope.source.push(obj.pop());
                        scope.clearFilter();
                    }
                }

                // modify the source collection.
                function modify(source) {
                    if(!source){
                        (console && console.warn('Failed to update list using source of undefined.'));
                        return;
                    }
                    // load data and apply filter.
                    loadData(null, source).then(function(res) {
                        $module.source = scope.source = res;
                        scope.clearFilter();
                    });
                }

                // initialize the module.
                function init() {

                    var promises = [];

                    // set scope/method vars.
                    $module.selected = scope.selected = nullItem;
                    $module.expanded = scope.expanded = false;
                    $module.clearFilter = scope.clearFilter = clearFilter;
                    $module.q = scope.q = undefined;
                    $module.add = scope.add = add;
                    $module.remove = scope.remove = remove;
                    $module.modify = scope.modify = modify;

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

                                // todo probably need to monitor other ng- class states.
                                scope.$watch(function () {
                                        return options.model.$invalid;
                                    },
                                    function (newVal, oldVal) {
                                    var model = options.model;
                                    if(model.$touched){
                                        button.addClass('ng-invalid');
                                        button.removeClass('ng-valid');
                                    }
                                    if(model.$valid){
                                        button.removeClass('ng-invalid');
                                        button.addClass('ng-valid');
                                    }
                                });

                                // compile the contents.
                                $helpers.compile(scope, list.contents());

                                $module.initialized = scope.initialized = true;

                                // if onload callback.
                                if(angular.isFunction(options.onReady)){
                                    options.onReady.call($module, $module, scope);
                                }

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
                    tagName, ts, initialized;

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

                    // we need to monitor ngDisabled if exists
                    // as it may change all other attrs
                    // are applied to either outer div with parent
                    // scope or remain on the original input element.
                    if(attrs.ngDisabled) {
                        scope.$watch(function () { return attrs.ngDisabled; }, function (newVal, oldVal){
                            if(newVal === oldVal) return;
                            scope.parseDisabled(newVal);
                        });
                    }

                    // watch list changes.
                    scope.$watch(function() {
                        return (scope.items && scope.items.length);
                    }, function (newVal, oldVal){
                        var item = scope.find(ngModel.$modelValue);
                        if(!item || (item.value === scope.selected.value))
                            return;
                        scope.select(null, item, true);
                    });

                    // watch model changes.
                    scope.$watch(function() {
                        return ngModel.$modelValue;
                    }, function (newVal, oldVal) {
                        if((!initialized && undefined !== newVal) || newVal !== oldVal){
                            var item = scope.find(newVal);
                            if(!item || (item.value === scope.selected.value)) return;
                            scope.select(null, item, true);
                            initialized = true;
                        }
                    });

                    //scope.$watch(function() {
                    //    return scope.source;
                    //}, function (newVal, oldVal){
                    //    //if($module.initialized){
                    //        scope.clearFilter();
                    //    //}
                    //});

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