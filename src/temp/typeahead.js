
var typeahead = angular.module('ai.widget.typeahead', []);

typeahead.directive('aiTypeahead', [function () {

    return {
        restrict: 'A',
        scope: {
            options: '&aiTypeahead',
            typeahead: '=ngModel'
        },
        link: function (scope, element, attrs) {

            var twitterTypeahead = typeof ($.fn.typeahead) !== undefined
              , plugin = null
              , target
              , selDataset
              , defaults
              , options;

            if (!twitterTypeahead) {
                console.log('ai-typeahead requires Twitter\'s Typeahead which could not be found. See http://twitter.github.io/typeahead.js/.')
                return;
            }

            target = element;

            defaults = {
                cache: true,
                validOptions: [],
                freeInput: true
            };

            function checkConstraints(result) {
                if (options.freeInput === true) return true;
                if (!options.validTags || options.validTags.length === 0) return false;
                var valid = false
                  , isString = angular.isString(options.validTags[0])
                  , valueKey = getValueKey();
                if (isString) {
                    if (options.validTags.indexOf(result) !== -1) valid = true;
                } else {
                    for (var i = 0; i < options.validTags.length; i++) {
                        var tag = options.validTags[i];
                        if (!valid && tag[valueKey] == result) valid = true;
                    }
                }
                return valid;
            }

            function getValueKey() {

                var valueKey = null;

                if (angular.isArray(options)) {
                    for (var i = 0; i < options.length; i++) {
                        if (options[i].name == selDataset) {
                            valueKey = options[i].valueKey || 'value';
                            break;
                        }
                    }
                } else {
                    valueKey = options.valueKey || 'value';
                }

                return valueKey;

            }

            function setTypeaheadValue(object, datum, dataset) {

                var valueKey = getValueKey();
                selDataset = dataset;

                if (datum && valueKey && datum.hasOwnProperty(valueKey))
                    result = datum[valueKey];

                scope.typeahead = result;
            }

            function attachEvents() {

                /* update model when selected from list */
                target.on('typeahead:selected', function (object, datum, dataset) {
                    scope.$apply(function () {
                        setTypeaheadValue(object, datum, dataset);
                        if (options.onSelected) options.onSelected(object, datum, dataset);
                    });
                });

                /* update model when autocompleted */
                target.on('typeahead:autocompleted', function (object, datum, dataset) {
                    scope.$apply(function () {
                        setTypeaheadValue(object, datum, dataset);
                        if (options.onComplete) options.onComplete(object, datum, dataset);
                    });
                });

                target.on('typeahead:closed', function (e) {
                    scope.$apply(function () {
                        var result = target.val() || null;
                        if (!checkConstraints(result)) {
                            target.typeahead('setQuery', '');
                            if (options.onInvalid) options.onInvalid(e, result);
                        }
                        if (options.onClosed) options.onClosed(e);
                    });
                });

            }

            function init() {

                if (plugin) {
                    target.typeahead('destroy');
                    plugin = null;
                }

                if (options.prefetch && angular.isString(options.prefetch) && !options.freeInput) {
                    var url = options.prefetch;
                    options.prefetch = {
                        url: url,
                        filter: function (res) {
                            options.validTags = res;
                            return res;
                        }
                    }
                } else if (options.local) {
                    options.validTags = options.local;
                }

                plugin = target.typeahead(options);
                attachEvents();
            }

            options = angular.extend({}, defaults, scope.$eval(attrs.aiTypeahead));

            init();

        }

    };

}]);
