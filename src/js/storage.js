(function () {
    'use strict';

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

                function StorageFactory(options) {

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

                return StorageFactory;

            }];

            return {
                $set: set,
                $get: get
            };

        });

})();




