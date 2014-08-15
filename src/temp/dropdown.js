var dropdown = angular.module('ai.widget.dropdown', []);

dropdown.directive('aiDropdown', [ '$http', '$q', '$compile', '$timeout', '$document', 'filterFilter', '$parse', function ($http, $q, $compile, $timeout, $document, filterFilter, $parse) {

	var findElement;

	findElement = function findElement(q, element) {
		return angular.element(element.querySelectorAll(q));
	};

	return {
		restrict: 'AE',
		scope: {
			options: '&aiDropdown'
		},
		require: '^ngModel',
		link: function (scope, element, attrs, ngModel) {

			var defaults, init, dropdown, normalizeCollection, bindEvents, bind,
				searchInput, expElem, loadCollection, lookupItem, buildQuery, searching;

			defaults = {
				template:  '<div class="ai-dropdown" tabindex="-1">' +
					'<button type="button" class="ai-dropdown-button" ng-click="toggle()"><span class="ai-dropdown-value" ng-bind="selected.display"></span><span class="ai-dropdown-caret"></span></button>' +
					'<div class="ai-dropdown-items" ng-show="showing" >' +
					'<div class="ai-dropdown-search" tabindex="-1" ng-show="searchable"><input type="text" ng-model="q" ng-change="filtering(q)"/></div>' +
					'<ul>' +
					'<li ng-repeat="item in collection" ng-click="select(item)" ng-class="{ active: selected.value == item.value }">{{item.text}}</li>' +
					'</ul>' +
					'</div>' +
					'</div>',
				groupTemplate: '<div class="ai-dropdown" tabindex="-1">' +
					'<button type="button" class="ai-dropdown-button" ng-click="toggle()"><span class="ai-dropdown-value" ng-bind="selected.display"></span><span class="ai-dropdown-caret"></span></button>' +
					'<div class="ai-dropdown-items" ng-show="showing" >' +
					'<div class="ai-dropdown-search" ng-show="searchable"><input type="text" ng-model="q" ng-change="filtering(q)"/></div>' +
					'<div class="ai-dropdown-group" ng-repeat="group in collection"  ng-hide="group.hidden">' +
					'<h4>{{group.name}}</h4>' +
					'<ul>' +
					'<li ng-repeat="item in group.items" ng-click="select(item)" ng-class="{ active: selected.value == item.value }">{{item.text}}</li>' +
					'</ul>' +
					'</div>' +
					'</div>' +
					'</div>',
				text: 'text',                           /* the text property to show when displaying the selected value */
				value: null,                            /* the value property to set the model to when an item is selected, if null the text option is used. */
				display: 'text',                        /* can be text or value default is text to display the value on the toggle button set to 'value' */
				placeholder: 'Please Select',           /* when no value is selected the placeholder text is used */
				source: [],                             /* the data source to use for the dropdown, can be object, array of string or array of objects. */
				params: {},                             /* additional params to pass */
				groupByKey: null,                       /* the primary key field to match children to. */
				groupByProperty: null,                  /* the property that contains primary key values */
				groupByName: null,                      /* the property to use as the title of the group. */
				addClass: undefined,                    /* additional class to add to dropdown */
				searchable: true,                       /* when true a search input will be displayed for searching items */
				selectClose: true,                      /* when an item is selected close the dropdown */
				selectClear: false,                     /* when true the value is cleared and reset to the placeholder. */
				multiple: false,                        /* when true multiple selections are allowed. */
				method: 'get',                          /* only used when data is remote url. */
				typeahead: false,                       /* when true and source is url dropdown is created dynamically via ajax call.*/
				typeaheadParams: null,                  /* pass params as key value pairs, they will be added to the query string. */
				typeadheadMin: 2,                       /* minimum chars before typeahead ajax call is made. */
				onShow: undefined,                      /* triggers when dropdown is shown */
				onHide: undefined,                      /* triggered when hidden */
				onSelect: undefined,                    /* callback when a selection is made */
				onBind: undefined                       /* callback after directive is bound */
			};

			normalizeCollection = function normalizeCollection(data) {

				scope.collection = scope.options.groupByKey ? {} : [];

				var text, value, display;
				text = scope.options.text;
				value = scope.options.value || scope.options.text;
				display = scope.options.display || scope.options.text;

				if(scope.options.append)
					data.push(scope.options.append);

				/* check if first object is simple string array or object */
				angular.forEach(data, function (item, idx) {

					if(!angular.isObject(item)) {

						item = { text: item, value: item, display: item };
						scope.collection.push(item);

					} else if (angular.isObject(item)) {

						if(angular.isFunction(text))
							item.text = text(item);
						else
							item.text = item[text];

						item.value = item[value];

						if(angular.isFunction(display))
							item.display = display(item);
						else
							item.display = item[display];


						if(!scope.options.groupByKey){

							scope.collection.push(item);

						} else {

							var groupName = item[scope.options.groupByName || scope.options.groupByKey],
								groupItems,
								group;

							groupName =  groupName.charAt(0).toUpperCase() + groupName.slice(1);

							groupItems = data.filter(function (child) {
								//console.log(item[scope.options.groupByKey] + ' - ' + child[scope.options.groupByProperty])
								return item[scope.options.groupByKey] === child[scope.options.groupByProperty];
							}) || undefined;

							if(groupItems && groupItems.length){

								if(!scope.collection[groupName])
									scope.collection[groupName] = { name: groupName, items: groupItems };
								else
									scope.collection[groupName].items = groupItems;

							}


						}

					}

				});

				return scope.collection;

			};

			buildQuery = function buildQuery(params, q) {
				params = params || {};
				if(q) {
					params.q = q;
				}
				return params;
			};

			loadCollection = function loadCollection(q) {

				if(angular.isString(scope.options.source)){
					/* source is url try to resolve */
					var method = scope.options.method.toLowerCase() || 'get',

						params = buildQuery(scope.options.params, q),
						url =  scope.options.source;

					return $q.when($http[method](url, params))
						.then(function(res) {
							if(res.data)
								return normalizeCollection(res.data);
							else
								return [];
						});
				} else {
					var defer = $q.defer();
					defer.resolve(normalizeCollection(scope.options.source));
					return defer.promise;
				}

			};

			bind = function bind() {
				scope.collection = undefined;
				var collection = loadCollection();
				collection.then(function (result) {
					scope.collection = result;
					$timeout(function () {
						scope.selected = lookupItem(ngModel.$modelValue) || { display:scope.options.placeholder };
					});
				});
			};

			lookupItem = function lookupItem(value) {
				if(!value) return;
				if(!scope.options.groupByKey) {
					return scope.collection.filter(function (item) {
						return item.value === value;
					})[0] || null;
				}else {
					var found;
					angular.forEach(scope.collection, function (group) {
						if(!found) {
							found = group.items.filter(function (item) {
								return item.value === value;
							})[0] || null;
						}
					});
					return found;
				}
			};

			init = function () {

				if(!scope.options.source || !scope.options.text)
					return;

				var exp, template, next;

				next = element.next();
				if(next.hasClass('ai-dropdown')){
					next.remove();
				}

				/* destroy the dropdown if it exists */
				if(dropdown) {
					dropdown.remove();
					dropdown = null;
				}

				template = scope.options.template;

				if(scope.options.groupByKey)
					template = scope.options.groupTemplate;

				/* create the dropdown element */
				dropdown = angular.element(template);

				dropdown.on('mousedown', function (e) {
					if(e.target.tagName === 'INPUT')
						searching = true;
				});

				dropdown.on('blur', function (e) {
					if(searching) return false;
					scope.$apply(function () {
						scope.showing = false;
						scope.q = null;
					});
				});

				/* find some elements */
				searchInput = findElement('[ng-model="q"]', dropdown[0]);
				expElem = dropdown.find('li');
				exp = expElem.attr('ng-repeat');

				if(scope.options.searchable) {

					scope.searchable = true;
					exp += ' | filter:q';
					expElem.attr('ng-repeat', exp);
					/* set focus of parent to simulate bootstrap input focus */
					searchInput.on('focusin', function () {
						searchInput.parent().addClass('focus');
					});
					searchInput.on('focusout', function () {
						searchInput.parent().removeClass('focus');
						searching = false;
					});
				} else {

					scope.searchable = false;
					searchInput.off('focusin');
					searchInput.off('focusout');

				}


				if(attrs.disabled) {
					dropdown.find('button').attr('disabled', attrs.disabled || 'disabled');
				}

				if(attrs.readonly)  {
					dropdown.find('button').attr('readonly', attrs.readonly || 'readonly');
				}

				if(attrs.ngDisabled || scope.options.ngDisabled){
					if(scope.options.ngDisabled) {
						exp = angular.isFunction(scope.options.ngDisabled)
							? 'options.ngDisabled()'
							: 'options.ngDisabled';
						dropdown.attr('ng-show', exp );
					} else {
						var isDisabled = $parse(attrs['ngDisabled'])(scope.$parent);
						if(isDisabled === undefined)
							isDisabled = attrs.ngDisabled;
						dropdown.find('button').attr('ng-disabled', isDisabled);
					}
				}

				if(attrs.ngShow || scope.options.ngShow) {
					if(scope.options.ngShow) {
						exp = angular.isFunction(scope.options.ngShow)
							? 'options.ngShow()'
							: 'options.ngShow';
						dropdown.attr('ng-show', exp);
					} else {
						var isVisible; $parse(attrs['ngShow'])(scope.$parent);
						if(isVisible === undefined)
							isVisible = attrs.ngShow;
						dropdown.attr('ng-show', isVisible);
					}
				}

				/* append the dropdown */
				element.css({ display: 'none'}).before(dropdown);

				/* resolve the collection */
				if(!scope.options.typeahead){
					/* load the data collection after normalizing */
					bind();
				} else {
					scope.collection = [];
					scope.selected =  { display:scope.options.placeholder };
				}

				if(scope.options.addClass)
					dropdown.addClass(scope.options.addClass);

				/* compile the dropdown */
				$compile(dropdown)(scope);

				/* add scope var for binding */
				scope.bind = bind;

				if(angular.isFunction(scope.options.onBind))
					scope.options.onBind(scope);


			};

			/* scope variables */
			scope.q = null;
			scope.selected = null;
			scope.showing = false;

			scope.toggle = function toggle () {
				scope.showing =! scope.showing;
				if(scope.showing) {
					dropdown.focus();
					if(scope.options.onShow)
						scope.options.onShow(scope.selected);

				} else {
					if(scope.options.onHide)
						scope.options.onHide(scope.selected);

				}
			};

			scope.select = function select (item) {
				ngModel.$setViewValue(item.value);
				ngModel.$modelValue = item.value;
				if(!scope.options.selectClear)
					scope.selected = item;
				if(scope.options.onSelect) scope.options.onSelect(item);
				if(scope.options.selectClose === true)
					scope.showing = false;
			};

			scope.filtering = function filtering(q) {

				/* handling filtering of groups if enabled */
				if(!scope.options.typeahead && scope.options.groupByKey) {
					if(!q) {
						angular.forEach(scope.collection, function(group) {
							group.hidden = false;
						});
					} else {
						angular.forEach(scope.collection, function (group) {
							var items = filterFilter(group.items, q);
							if(items.length === 0)
								group.hidden = true;
						});
					}
				}

				/* typehead is enabled */
				if(scope.options.typeahead && angular.isString(scope.options.source)) {

					if(!q || (q.length < scope.options.typeadheadMin)){
						scope.collection = [];
						return;
					}

					searchInput.addClass('searching');
					var collection = loadCollection(q);

					collection.then(function (result) {
						scope.collection = result;
						searchInput.removeClass('searching');
					});

				}

			};

			scope.$watch(attrs.aiDropdown, function (newVal, oldVal) {

				if(newVal === oldVal) return;

				/* merge new options with defaults */
				scope.options = angular.extend({}, defaults, newVal);

				/* re-initialize */
				init();

			}, true);

			scope.$watch(function () {
				return ngModel.$modelValue;
			}, function (newVal, oldVal) {
				if(newVal === undefined || newVal === null)
					scope.selected = { display: scope.options.placeholder };
				if(newVal && scope.collection){
					scope.selected = lookupItem(newVal);
				}

			});

			scope.$watch(function () {
				return scope.collection;
			}, function (newVal, oldVal) {
				if(newVal === oldVal) return;
				if(ngModel.$modelValue) {
					scope.selected = lookupItem(ngModel.$modelValue);
				}
			});

			/* merge defaults with options */
			scope.options = angular.extend(defaults, scope.$eval(scope.options));

			/* initialize */
			init();


		}

	}

}]);