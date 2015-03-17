angular.module('ai.tree', ['ai.helpers'])
    .provider('$tree', function $tree() {

        var defaults = {
            template: 'ai-tree.html',       // the template to be used, accepts, html, path, or cashed view name.
            label: 'label',                 // the property used for display.
            value: 'value',                 // the property used for value.
            children: 'children',           // the property used for child elements.
            active: 'active',               // the property used to indicated the element is checked or active.
            method: 'get',                  // when and endpoint is specified in model.
            params: {},                     // params to be passed when model is an endpoint.
            icon: undefined,                // when NOT false icon is displayed left of label.
            expanded: false,                // when true tree loads with all nodes expanded.
            expandAll: false,               // when true all child nodes are expanded when either expanded or parent selects all.
            onSelect: undefined,            // callback when item is clicked returns node, treeModel & event.
            onToggle: undefined             // callback when child node is expanded or collapsed. returns
                                            // node, treeModel & event.
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
                        '<span class="ai-tree-toggle" ng-class="{expanded: node.expanded}" ng-show="node.toggle" ' +
                            'ng-click="toggle($event, node)"></span>' +
                        '<div class="ai-tree-item" ng-click="select($event, node)" ng-class="node.state">' +
                            '<span class="ai-tree-icon" ng-show="node.icon"></span>' +
                            '<span class="ai-tree-label" ng-bind="node.label"></span>' +
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

            $helpers.getPutTemplate(defaults.template, treeTemplate);

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

                model = options.model;
                treeModel = options.treeScope.options.model;

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
                        node.label = node[options.label];
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
                            treeModel = options.treeScope.options.model = res.data;
                            cb(res.data);
                        }, function (res) {
                            console.error(res);
                            cb();
                        });
                    } else {
                        cb();
                    }

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
                    options.treeScope.selected = selected;
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
                    var isMouseEvent = event instanceof MouseEvent;
                    if(!isMouseEvent){
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
                        options.onToggle(node, node.expanded, treeModel, event);
                    }
                }

                // select a node
                function select(event, node) {
                    var isMouseEvent = event instanceof MouseEvent;
                    if(!isMouseEvent){
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

                // initialize the tree view.
                function init() {

                    loadData(model, function (data) {

                        if(!data) return;

                        // normalize the model properties.
                        normalizeData(data);

                        // set initial check state.
                        setState(treeModel);

                        $module.nodes = scope.nodes = data;
                        $module.select = scope.select = select;
                        $module.toggle = scope.toggle = toggle;

                        $helpers.loadTemplate(options.template).then(function(template) {
                            element.empty().append($helpers.compile(scope, template));
                        });

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
    .directive('aiTree', ['$tree', function ($tree) {

        return {
            restrict: 'EAC',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {

                var defaults, options, $module;
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
                options.treeScope = options.treeScope || scope;

                // collection of selected items.
                options.treeScope.selected = options.treeScope.selected || [];

                options = angular.extend(defaults, options);
                options.model = scope.$eval(attrs.ngModel);
                init();

            }
        };

    }]);