
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

            actionsTemplate: 'ai-table-actions.html',      // template where search input is located datatype: string
            tableTemplate: 'table.html',                    // the template for the table datatype: string
            pagerTemplate: 'ai-table-pager.html',          // the template for paging datatype: string
            nodataTemplate: 'ai-table-nodata.html',        // presented when no data rows are present datatype: string.
            loaderTemplate: 'ai-table-loader.html',        // loading spinner template. datatype: string

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
                    '<input class="form-control" type="text" placeholder="Search" ng-model="q" ng-change="filter()" ng-disabled="editing"/>' +
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
                return angular.element(element.querySelectorAll(q));
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
                    loader, loading, isReady;
                
                $module = {};
                isReady = false;

                // allow passing element in options.
                if(isPlainObject(element)){
                    options = element;
                    element = options.element;
                }

                scope = options.scope || $rootScope.$new();
                options = scope.options = angular.extend(defaults, options);

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
                        if(options.onLoad && angular.isFunction(options.onLoad)){

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
                        if(options.beforeFilter && angular.isFunction(options.beforeFilter)){

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

                    if(options.onReset && angular.isFunction(options.onReset)) {
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

                    if(options.onSelected && angular.isFunction(options.onSelected)){
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
                        if(options.beforeDelete && angular.isFunction(options.beforeDelete)){

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

                                if(options.beforeUpdate && angular.isFunction(options.beforeUpdate)){
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

                // fires when table binds.
                function onBind() {
                    if(options.onBind && angular.isFunction(options.onBind)){
                        options.onBind(self);
                    }

                }

                function ready(fn) {

                    var wait;

                    function done() {
                        if(fn && angular.isFunction(fn)){
                            if(isReady) {
                                clearInterval(wait);
                                fn.call(self);
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

                    if(options.beforeDownload && angular.isFunction(options.beforeDownload)){
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
                    scope.options = options.options;
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

                            var nodata = !scope.filtered || !scope.filtered.length || (!options.auto && !Object.keys(options.columns).length);

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
                            onBind();

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
            restrict: 'EA',
            scope: {
                options: '&aiTable'
            },
            link: function link(scope, element) {

                var defaults, options, $module;

                defaults = {
                    scope: scope
                };

                function init() {

                    options.scope = scope;

                    /* initialize the new table */
                    $module = $table(element, options);

                    $module.ready(function() {
                        scope.options.instance = options.instance = this;
                    });

                }

                scope.$watch('aiTable', function (newVal, oldVal) {
                    if(newVal === oldVal) return;
                }, true);


                scope.$on('$destroy', function () {
                    element.remove();
                    $module = null;
                    options = null;
                });

                scope.options = options = angular.extend(defaults, scope.$eval(scope.options));

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

                    if(column.resolve && angular.isFunction(column.resolve)) {
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
