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