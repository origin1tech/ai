

var storage = angular.module('app.services.storage', []);


storage.service('StorageServ', ['$rootScope', 'Settings', function ($rootScope, Settings) {

    var supported, supportedCookies, setStorage, getStorage,
        removeStorage, keysStorage, clearStorage, clearCookies,
        setCookie, getCookie, getProperty, ns, cookie, nsLength;

    /* namespace our storage */
    if(Settings && Settings.storage)
        ns = Settings.storage.ns || 'app';

    nsLength = ns.length;

    /* cookie settings */
    cookie = { path: '/', expiry: 30 };
    if(Settings && Settings.storage && Settings.storage.cookie)
        cookie = Settings.storage.cookie;

     /* check for browser support */
      supported = function supported() {    
          return ('localStorage' in window && window['localStorage'] !== null);    
     };

     /* checks if browser supports cookies */
      supportedCookies = function supportedCookies() {     
          return navigator.cookieEnabled || ("cookie" in document && (document.cookie.length > 0
              || (document.cookie = "test").indexOf.call(document.cookie, "test") > -1));
      };


      if (!supported() && !supportedCookies())   {
         console.log('Storage services cannot be used without localStorage or cookies being enabled.');
         return false;
      }

      function getByProperty(obj, keys, def, ctr) {

          def = def || null;
          ctr = ctr || 0;

          if (!keys) return def;

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

    /*
    * START STORAGE LOCAL
    */   
     setStorage = function setStorage(key, value) {

          
          if (!supported()) {      

              return setCookie(key, value);

          }

          if (typeof value == "undefined") value = null;

          try {

       
              if (angular.isObject(value) || angular.isArray(value))
                  value = angular.toJson(value);

         
              localStorage.setItem(ns + key, value);             
              
          } catch (e) {

              return setCookie(key, value);

          }

          return true;
      };

      /* get localStorage e.g. StorageService.get('library') */
     getStorage = function getStorage(key) {      

         var item;

          if (!supported())      
             return getCookie(key);          

          item = localStorage.getItem(ns + key);
    
          if (!item) return null;

          if (item.charAt(0) === "{" || item.charAt(0) === "[") {
              return angular.fromJson(item);
          }
          
          return item;

      };

     getProperty = function getProperty(key, property) {

          var item = getStorage(key)
            , isObject = angular.isObject(item) || false   
            , result = null;

          /* must be object */
          if (item) {

              if (isObject)
                  result = getByProperty(item, property);
              else
                  result = item;

          } else {
         
              console.log('Invalid operation, storage item must be an object.');
          }

          return result;

     };

    
    /* remove item from localStorage e.g. StorageService.remove('key') */
     removeStorage = function removeStorage (key) {

          if (!supported()) {
                       
              return removeCookies(key);
          }

          try {

              localStorage.removeItem(ns + key);

          } catch (e) {
      
              return removeCookies(key);

          }

          return true;

      };

      /* get localStorage keys e.g. StorageService.keys() */
     keysStorage = function keysStorage() {

          if (!supported())             
              return false;    
   
          var keys = [];
          for (var key in localStorage) {

              if(localStorage.hasOwnProperty(key)) {

                  if (key.substr(0, nsLength) === ns) {

                      try {
                          keys.push(key.substr(nsLength));

                      } catch (e) {

                          return [];
                      }
                  }
              }
              

          }
          return keys;
      };

      /* clear localStorage...BE CAREFUL */
     clearStorage = function clearStorage () {

          if (!supported())     
              return clearCookies();          

          for (var key in localStorage) {

              if(localStorage.hasOwnProperty(key)) {

                  if (key.substr(0, nsLength) === ns) {

                      try {
                          removeStorage(key.substr(nsLength));
                      } catch (e) {

                          return clearCookies();
                      }
                  }
              }

          }
          return true;
      };


    /*
    * START STORAGE COOKIES
    */


      /* add cookie e.g. StorageService.cookie.add('key','value') */
     setCookie = function setCookie (key, value) {

          if (typeof value == "undefined") return false;

          if (!supportedCookies())     
              return false;          

          try {
              var expiry = '', expiryDate = new Date();
              if (value === null) {
                  cookie.expiry = -1;
                  value = '';
              }
              if (cookie.expiry !== 0) {

                  expiryDate.setTime(expiryDate.getTime() + (cookie.expiry * 24 * 60 * 60 * 1000));
                  expiry = "; expires=" + expiryDate.toGMTString();

              }
              if (!!key) {
                  document.cookie = ns + key + "=" + encodeURIComponent(value) + expiry + "; path=" + cookie.path;
              }
          } catch (e) {
    
              return false;
          }

          return true;
      };

   
      /* get cookie e.g. StorageService.cookie.get('key') */
     getCookie = function getCookie (key, namespace) {

         ns = namespace !== false ? ns : '';         

         if (!supportedCookies())       
              return false; 

         var cookies = document.cookie.split(';');

          for (var i = 0; i < cookies.length; i++) {

              var ck = cookies[i];

              while (ck.charAt(0) == ' ') 
                  ck = ck.substring(1, ck.length);               
              
              if (ck.indexOf(ns + key + '=') === 0) 
                  return decodeURIComponent(ck.substring(ns.length + key.length + 1, ck.length));                                      

          }

          return null;
      };

     var removeCookies = function removeCookies(key) {
          setCookie(key, null);
      };

     clearCookies = function clearCookies() {

          var ck = null,          
              cookies = document.cookie.split(';');

          for (var i = 0; i < cookies.length; i++) {

              ck = cookies[i];

              while (ck.charAt(0) == ' ') 
                  ck = ck.substring(1, ck.length);              

              key = ck.substring(nsLength, ck.indexOf('='));
              removeCookies(key);
          }
     };
    
      return {
         
        supported: supported,
        set: setStorage,   
        get: getStorage,
        getProperty: getProperty,
        keys: keysStorage,
        remove: removeStorage,
        clear: clearStorage,         
     
        /* to explicitly use cookies */
        cookie: {
            set: setCookie,            
            get: getCookie,
            remove: removeCookies,
            clear: clearCookies,
            supported: supportedCookies
        }

      };

  }]);
    
