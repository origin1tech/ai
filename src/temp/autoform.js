'use strict';

/* Using html with default template requires ngSanitize */

var autoform = angular.module('ai.autoform', []);

autoform.run([function () {

}]);


autoform.directive('aiAutoForm', [ '$compile', function ($compile) {

	return {
		restrict: 'AE',
		scope: {
			options: '&aiAutoForm'
		},
		priority: -1,
		link: function (scope, element, attrs) {

			var defaults, init,  buildAttributes;

			defaults = {
				ns: undefined,
				model: undefined,
				config: undefined
			};

			buildAttributes = function buildAttributes(attributes) {
				var result = '';
				angular.forEach(attributes, function (v, k) {
					result += (k + '="' + v + '"');
				});
				return result;
			};

			init = function init() {

				if(!scope.options.model || !scope.options.config) return;

				var template = '';

				angular.forEach(scope.options.model, function (v, k) {

					var config = scope.options.config[k] || undefined,
						labelUpper = k.charAt(0).toUpperCase() + k.slice(1),
						attributes,
						name,
						ngModel,
						type;

					if(config){

						type = config.type || 'text';
						attributes = buildAttributes(config.attributes);
						ngModel = scope.options.prefix ? ' ng-model="' + scope.options.prefix + '.' + k + '" ': ' ng-model="' + k + '" ';
						ngModel = config.model === false ? '' : ngModel;
						name = config.attributes && config.attributes.name ? '' : ' name="' + k + '" ';

						if(type !== 'radio' && type !== 'checkbox')
							template += '<div class="form-group">';
						else
							template += '<div class="' + type + '">';

						if(config.label !== false){
							if(type !== 'radio' && type !== 'checkbox')
								template += '<label>' + labelUpper + '</label>';
							else
								template += '<label>';
						}


						if(type === 'select' || type === 'textarea'){

							if(type === 'textarea'){
								template += '<textarea' + name + ngModel + 'class="form-control"></textarea>';
							} else {
								scope.items = config.items;
								var opt = angular.isObject(config.data) ? 'key as value for (key, value) in list' : 'item.' + config.value + ' as item.' + config.text + ' for item in items',
									select = '<select' + name + ngModel + 'class="form-control"' + attributes + '>' +
											    '<option ng-options="' + opt + '"></option>' +
											 '</select>';

								template +=  select;
							}

						} else {

							if(type === 'checkbox' || type === 'radio'){
								template += '<input' + name + ngModel + 'type="' + type + '"' + attributes + '/> ' + labelUpper + '</label>' ;
							} else {
								template += '<input' + name + ngModel + 'type="' + type + '" class="form-control"' + attributes + '/>';
							}

						}

						if(config.help)
							template += '<p class="help-block">' + config.help + '</p>';

						template += '</div>';

					}

				});

				template += '<div class="form-buttons">' +
								'<button type="submit" class="btn btn-primary">Submit</button>' +
							'</div>';

				template = $compile(template)(scope);

				element.empty().html(template);

			};

			scope.options = angular.extend(defaults, scope.$eval(scope.options));

			init();

		}

	}

}]);