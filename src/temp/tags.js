
var tags = angular.module('ai.widget.tags', []);

tags.run(function () {

});

tags.directive('aiTags', [ '$compile', function ($compile) {

    return {
        restrict: 'A',
        scope: {
            options: '=aiTags',
            tags: '=ngModel'
        },
        require: '^ngModel',
        link: function(scope, element, attrs, ngModel) {

            var defaults, init, template, target, clearTags, maxTagsInvalid, validTagsInvalid,
                generateLabel, tagsExists, getDup, parser, formatter;

            defaults = {
                cssClass: 'ai-tags',
                tagCssClass: 'label-primary', // can be default string or function (item) { return 'label label-primary'; },
                keys: [13, 9, 186, 8], // tabs created on enter, tab, semi-colon.
                freeInput: true, // allow free input.
                maxTags: 0, // maximum tags supported, 0 for unlimited.
                maxTagsInvalid: null, // callback when max tags exceeded. null, function or self.
                validTags: [], // list of valid tags.
                validTagsInvalid: null, // function called when tag is invalid. null, function or self.
                dupAimation: 'self', // can be self or function if function offending dom element, tag is passed.
                backspaceRemove: true, // when true removes last tag.
                required: false, // must have min of one value.
                enableSpacebar: false, // when true spacebar triggers tag.
                onRequired: null // when required fails calls this func if not null.
            };

            target = undefined;

            scope.tag = '';

            scope.onKey = function (event) {

                scope.tags = scope.tags || [];

                var code = event.which || event.keyCode,
                validKey = scope.options.keys.indexOf(code) !== -1,
                tagLen = scope.tag.length,
                tag;

                if(validKey){

                    tag = scope.tag || null;

                    if(code === 8 && tagLen > 0) return;

                    if(code === 8 && scope.options.backspaceRemove) {

                        var len = scope.tags.length;
                        /* make sure we have tags for good measure */
                        if(scope.tags && len > 0) {
                            if(scope.options.required && len === 1) {
                                /* if requires value prevent delete */
                                if(scope.options.onRequired)
                                    scope.options.onRequired(tag, event);
                            } else {
                                scope.tags.pop();
                                var labels = target.find('label').eq(len).remove();
                            }
                        }

                    } else {

                        if(tag && tag.length > 0) {

                            /* add label/tag to dom */
                            if(generateLabel(tag, event)){

                                /* add tag and reset input */
                                scope.tags.push(scope.tag);
                                scope.tag = '';


                            }

                        }

                    }

                    /* prevents form submission */
                    if(code === 13)
                        event.preventDefault();

                }

            };

            parser = function parser(value) {
                return scope.tags || undefined;
            };

            formatter = function formatter(value) {
                if(scope.tags)
                    return scope.tags.join(',');
                return undefined;
            };

            getDup = function getDup(tag) {
               var labels =  target.find('label'),
                   dup;
               angular.forEach(labels, function (label) {
                    if(!dup){
                        label = angular.element(label);
                        dup = label.text() === tag ? label : null;
                    }
               });
               return dup;
            };

            maxTagsInvalid = function maxTagsInvalid(tag, event) {
                if(scope.options.maxTagsInvalid) {
                    if(scope.options.maxTagsInvalid === 'self'){
                        alert('The maximum of ' + scope.options.maxTags + ' tags has been exceeded.');
                    }  else {
                        if(angular.isFunction(scope.options.validTagsInvalid))
                            scope.options.validTagsInvalid(tag, event);
                    }
                }
            };

            validTagsInvalid = function validTagsInvalid(tag, event) {
                if(scope.options.validTagsInvalid) {
                    if(scope.options.validTagsInvalid === 'self'){
                        alert(tag + ' is not a valid tag.');
                    }  else {
                        if(angular.isFunction(scope.options.validTagsInvalid))
                            scope.options.validTagsInvalid(tag, event);
                    }
                }
            };

            generateLabel = function generateLabel(tag, event, init) {

                init = init || false;

                var tagClass, label, input, invalid, dup;

                if(scope.options.maxTags !== 0 && (scope.tags.length + 1 > scope.options.maxTags)) {
                    maxTagsInvalid(tag, event);
                    return false;
                }

                if(!init && scope.tags.indexOf(tag) !== -1) {
                    dup = getDup(tag);
                    scope.tag = '';
                    if(angular.isFunction(scope.options.dupAnimation)){
                        scope.options.dupAnimation(dup, tag, event);
                    } else {
                        dup.fadeOut('fast').fadeIn('fast')
                            .fadeOut('fast').fadeIn('fast')
                            .fadeOut('fast').fadeIn('fast').stop();
                    }
                    return false;
                }

                if(scope.options.validTags && scope.options.validTags.length > 0){
                    invalid = scope.options.validTags.indexOf(tag) === -1;
                    if(invalid) {
                        scope.tag = '';
                        validTagsInvalid(tag, event);
                        return false;
                    }
                }

                tagClass = scope.options.tagCssClass;
                if(angular.isFunction(tagClass))
                    tagClass = scope.options.tagCssClass(tag, event);

                //tagClass = 'tag ' + tagClass;
                label = '<label class="' + tagClass + '">' + tag + '<span class="remove"></span></label>';
                label = angular.element(label);

                /* add remove event */
                label.find('span').on('click', function(e){
                    var parent, idx;
                    parent = e.target.parentElement;
                    idx =  scope.tags.indexOf(parent.innerText);
                    if(idx !== undefined || idx !== null){
                        if(scope.options.required && scope.tags.length === 1) {
                            /* if requires value prevent delete */
                            if(scope.options.onRequired)
                                scope.options.onRequired(parent.innerText, e);
                        } else {
                            scope.$apply(function () {
                                scope.tags.splice(idx, 1);
                                parent.parentElement.removeChild(parent);
                            });
                        }
                    }
                });

                input = target.find('input');
                input.before(label);

                return true;

            };

            tagsExists = function tagsExists(){
                var siblings = element.siblings(),
                    exists = false;
                angular.forEach(siblings, function(elem) {
                    if(!exists){
                        elem = angular.element(elem);
                        exists = elem.hasClass('ai-tags');
                    }
                });
                return exists;
            };

            clearTags = function clearTags() {
                target.find('label').remove();
            };

            init = function init () {

                template = '<div class="' + scope.options.cssClass + '" >' +
                                '<input type="text" ng-keydown="onKey($event)" ng-model="tag" />' +
                           '</div>';

                /* prevents duplicates on re-compile */
                if(tagsExists()) return;

                if(scope.options.enableSpacebar)
                    scope.options.keys.push(32);

                element.css('display', 'none');
                template = angular.element(template);

                /* find the input */
                var input = template.find('input');
                input.on('focus', function () {
                    template.addClass('focus');
                });
                input.on('blur', function () {
                    template.removeClass('focus');
                });

                /* compile to add angular scope */
                target = $compile(template)(scope);
                element.after(target);

                if(scope.tags && scope.tags.length > 0) {
                    angular.forEach(scope.tags, function (tag) {
                        generateLabel(tag, null, true);
                    });
                }

            };

            /* required when updating a form or dom elements
             * could still exist when new record/model is applied.
             */
            scope.$watch('tags', function (newVal, oldVal) {
                if(!target || !newVal) return;
                if(newVal.length === 0)
                    clearTags();
                var curTagLen = target.find('span').length;
                if(newVal.length > 0 && curTagLen === 0 ) {
                    angular.forEach(newVal, function (tag) {
                        generateLabel(tag, null, true);
                    });
                }
            });

            ngModel.$parsers.push(parser);
            ngModel.$formatters.push(formatter);

            /* merge the options */
            scope.options = angular.extend({}, defaults, scope.options || {});
            scope.tags = scope.tags || [];

            init();

        }
    };

}]);


