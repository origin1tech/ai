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

            onChange: undefined,            // callback on changed step, returns (index, active step, event)
            onHead: undefined,              // callback on header clicked returns (index, active step, event)
            onSubmit: undefined,            // callback on submit returns (index, active step, event)
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
                scope;

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
                    curIdx = indexOf(active()),
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
                        $rootScope.$broadcast('step:to', nextIdx, nextActive);
                    }
                }
                $rootScope.$broadcast('step:to', curIdx, curActive);
                if(angular.isFunction(options.onChange)){
                    options.onChange.call($module, nextIdx, nextActive, e);
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
                    if(angular.isFunction(options.onHead))
                        options.onHead.call($module, curIdx, curActive, e);
                } else {
                    // breadcrumb mode navigate
                    // to href if provided.
                    if(step && step.href && step.enabled)
                        $location.path(step.href);
                }
            }

            // submit button for last step.
            function submit(e) {
                var curActive, curIdx;
                curActive = active();
                curIdx = indexOf(curActive);
                if(angular.isFunction(options.onSubmit)){
                    options.onSubmit.call($module, curIdx, curActive, e);
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