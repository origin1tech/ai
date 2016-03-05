angular.module('ai.passport.factory', [])

.provider('$passport', [function $passport() {

  var defaults, defaultRoles, get, set;

  // NOTE: if roles object keys are numeric roles are ordered
  //       by the numeric keys. if keys are strings the roles
  //       will be sorted by each property's value.
  //       if roles are a simple array of strings a numeric
  //       map will be created based on the order of the
  //       array provided.

  defaults = {

    router: 'ngRoute', // the router being used uiRouter or ngRoute.
    // this is not the module name but the
    rootKey: '$passport', // the rootScope property key to set to instance.
    aclKey: 'acl', // the property within route object that contains acl levels.

    401: true, // set to false to not handle 401 status codes.
    403: true, // set to false to not handle 403 status codes.

    rolesKey: 'roles', // the key which contains ALL roles.
    userKey: 'user', // the object key which contains the user information
    // returned in res.data of successful login.
    // ex: res.data.user (see method $module.login)
    userRolesKey: 'roles', // the key in the user object containing roles.
    defaultRole: 0, // the default role to be used for public access.
    extendKeys: undefined, // array of keys you wish to also track.

    paranoid: undefined, // when NOT false, if security config missing go to login.

    defaultUrl: '/', // the default path or home page.
    loginUrl: '/passport/login', // path to login form.
    loginAction: 'post /api/passport/login', // endpoint/func used for authentication.
    logoutAction: 'get /api/passport/logout', // endpoint/func used to logout.
    profileAction: 'passport/profile', // enpoint/funct for navigating to profile.
    syncAction: 'get /api/passport/sync', // syncs app roles and user profile.

    onLoginSuccess: '/', // path or func on success.
    onLoginFailed: '/passport/login', // path or func when login fails.
    onLogoutSuccess: '/passport/login', // path or func on logout success.
    onLogoutFailed: '/passport/login', // path or func on logout failed.

    onUnauthenticated: '/passport/login', // path or func when unauthenticated.
    onUnauthorized: '/passport/login', // path or func when unauthorized.
    onSyncSuccess: undefined, // func called when successfully synchronized w/ server.

    guestText: 'Guest', // The text displayed when no user is logged in.
    welcomeText: 'Welcome', // prefix string to identity.
    welcomeParams: ['firstName'] // array of user properties. Each property provided will be separated by a space.

  };

  defaultRoles = {
    0: '*',
    1: 'user',
    2: 'manager',
    3: 'admin',
    4: 'superadmin'
      //'*': 0,
      //'user': 1,
      //'manager': 2,
      //'admin': 3,
      //'superadmin': 4
  };

  set = function set(key, value) {
    var obj = key;
    if (arguments.length > 1) {
      obj = {};
      obj[key] = value;
    }
    defaults = angular.extend({}, defaults, obj);
  };

  get = ['$rootScope', '$location', '$http', '$q', '$injector', '$log', '$timeout',
    function get($rootScope, $location, $http, $q, $injector, $log, $timeout) {

      var instance,
        $route;

      // nomralize url to method/path object.
      function urlToObject(url) {
        var parts = url.split(' '),
          obj = {
            method: 'get'
          };
        obj.path = parts[0];
        if (parts.length > 1) {
          obj.method = parts[0];
          obj.path = parts[1];
        }
        return obj;
      }

      // Parse float a string value.
      function tryParseFloat(val) {
        try {
          if (isNaN(val))
            return val;
          return parseFloat(val);
        } catch (ex) {
          return val;
        }
      }

      // normalize roles in format:
      // { 0: 'role_name', 1: 'role_name' }
      function normalizeRoles(roles) {

        var obj = {},
            keys, stringKeys, values;

        // If a string remove spaces and split csv.
        if (angular.isString(roles))
            roles = roles.replace(/\s/g, '').split(',');

        // If array iterate convert to object using index as key.
        if (angular.isArray(roles)) {

          if (!roles.length)
            throw new Error('Fatal error normalizing passport roles, received empty array.');

          angular.forEach(roles, function(v, k) {
            obj[k] = v;
          });

        }

        // If an object normalize.
        else if (angular.isObject(roles)) {

          keys = Object.keys(roles);

          // Must have keys if not throw error.
          if (!keys.length)
            throw new Error('Fatal error normalizing passport roles, object has no keys.');

          // Detect if keys are strings or numbers.
          stringKeys = tryParseFloat(keys[0]);
          stringKeys = typeof stringKeys === 'string';

          obj = roles;

          // Only need to normlize if string keys
          // otherwise roles are alredy in correct format.
          if (stringKeys) {

            obj = {};
            values = keys.map(function(k) {
              k = tryParseFloat(k);
              return roles[k];
            });

            // Should not hit this but to be safe throw
            // error if we have no values.
            if (!values.length)
              throw new Error('Fatal error normalizing passport roles, object has no values.');

            // iterate the values and creating map.
            angular.forEach(values, function(v) {

              var parsedVal = tryParseFloat(v);
              var val;

              angular.forEach(roles, function(v, k) {
                if (val) return;
                if (parsedVal === v)
                  val = k;
              });

              // If no key to match value throw error.
              if (!val)
                throw new Error('Fatal error normalizing security roles, no matching key for value ' +
                  parsedVal);

              // Otherwise the parsed string to float is
              // the key and the key is the value.
              obj[parsedVal] = val;

            });

          }

        }

        // If not object array or csv then throw error.
        else {

          throw new Error('Fatal error normalizing security roles, the format is invalid.');

        }
        return obj;

      }

      // Passport factory module.
      function ModuleFactory() {

        var $module = {};

        if (this.instance)
          return instance;

        // extends module with custom keys.
        function extendModule(keys, obj) {
          angular.forEach(keys, function(k) {
            if (obj[k])
              $module[k] = obj[k];
          });
        }

        // Takes a string role and converts it to it's number key.
        function stringToNumber(role) {
          var result;
          angular.forEach($module.roles, function(v, k) {
            if (result !== undefined)
              return;
            if (role === v)
              result = k;
          });
          return result;
        }

        // ensure the user proptery
        // is undefined when passport
        // class is initialized.
        $module.user = undefined;

        // Indicates if the user provfile has yet to synchronize.
        $module.userSync = false;

        // Finds property by dot notation.
        $module.findByNotation = function findByNotation(obj, prop) {
          var props, comp, arrayData, match;
          if (!obj || !prop)
            return undefined;
          props = prop.split('.');
          while (props.length && obj) {
            comp = props.shift();
            match = new RegExp('(.+)\\[([0-9]*)\\]', 'i').exec(comp);
            if ((match !== null) && (match.length === 3)) {
              arrayData = {
                arrName: match[1],
                arrIndex: match[2]
              };
              if (obj[arrayData.arrName] !== undefined) {
                obj = obj[arrayData.arrName][arrayData.arrIndex];
              } else {
                obj = undefined;
              }
            } else {
              obj = obj[comp];
            }
          }
          return obj;
        };

        // set passport options.
        $module.set = function set(key, value) {

          var options;

          if (!key && !value) {
            options = {};
          }
          else {
            if (angular.isObject(key)) {
              options = key;
              value = undefined;
            } else {
              options = {};
              options[key] = value;
            }
          }

          // merge the options.
          $module.options = angular.extend({}, defaults, options);

          // Ensure that defaultUrl and loginUrl are not the same.
          if ($module.options.defaultUrl && $module.options.defaultUrl === $module.options.loginUrl)
            throw new Error('$passport defaultUrl and loginUrl cannot be the same path.');

          // don't merge levels override instead.
          $module.options.roles = $module.options.roles || defaultRoles;

          // set levels and roles.
          $module.roles = normalizeRoles($module.options.roles);

          // define router change event name.
          if ($module.options.router === 'ngRoute') {
            $route = $injector.get('$route');
            $module.routerChangeEvent = '$routeChangeStart';
          }

          else {
            $module.routerChangeEvent = '$stateChangeStart';
            $route = $injector.get('$state');
          }

        };

        // login passport credentials.
        $module.login = function login(data, success, failed) {

          var url = urlToObject($module.options.loginAction),
              roles;

          success = success || $module.options.onLoginSuccess;
          failed = failed || $module.options.onLoginFailed;

          function onFailed(res) {
            if (angular.isFunction(failed)) {
              failed.call($module, res, $module);
            }
            else {
              $module.goto(failed);
            }
          }

          $http[url.method](url.path, data)
            .then(function(res) {

              $module.user = $module.findByNotation(res.data, $module.options.userKey);
              roles = $module.findByNotation(res.data, $module.options.rolesKey);

              if (!$module.user)
                return onFailed(res);

              if (roles)
                $module.roles = normalizeRoles(roles);

              if ($module.options.extendKeys)
                extendModule($module.options.extendKeys, res.data);

              if (angular.isFunction(success)) {
                success.call($module, res, $module);
              }

              else {
                $module.goto(success);
              }

            }, onFailed);

        };

        // logout passport.
        $module.logout = function logout(success, failed) {

          var url;
          success = success || $module.options.onLogoutSuccess;
          failed = failed || $module.options.onLogoutFailed;

          function done() {
            $module.user = undefined;
            $module.goto($module.options.loginUrl, true);
          }

          if (angular.isFunction($module.options.logoutAction)) {
            $module.options.logoutAction.call($module, $module);
          }

          else {

            url = urlToObject($module.options.logoutAction);

            $http[url.method](url.path).then(function(res) {

              if (angular.isFunction(success)) {
                $module.user = undefined;
                success.call($module, res, $module);
              }

              else {
                done();
              }

            }, done);
          }

        };

        // sync passport with server.
        // checking for session.
        // Callback is used only on internal calls.
        $module.sync = function sync(data, cb) {

          var url, roles, obj, conf, user;

          if (angular.isFunction(data)) {
            cb = data;
            data = undefined;
          }

          function done(obj) {

            if (obj) {
              user = $module.findByNotation(obj, $module.options.userKey);
              roles = $module.findByNotation(obj, $module.options.rolesKey);
              if (user) {
                $module.user = user;
                $module.userSync = true;
              }
              else {
                $module.userSync = false;
              }
              if (roles)
                $module.roles = normalizeRoles(roles);
              if ($module.options.extendKeys)
                extendModule($module.options.extendKeys, obj);
              if (cb)
                cb();
            }

          }

          if (!$module.options.syncAction)
            return done();

          // If is function call and set using returned result.
          if (angular.isFunction($module.options.syncAction)) {

            obj = $module.options.syncAction.call($module);
            done(obj);

          } else {

            url = urlToObject($module.options.syncAction);

            if (url.method && url.path) {

              conf = {
                method: url.method,
                url: url.path
              };

              data = data || {};

              if (conf.method.toLowerCase() === 'get')
                conf.params = data;
              else
                conf.data = data;

              $http(conf).then(function(res) {

                if (res) {

                  // Set roles and user.
                  done(res.data);

                  // check if on sync success is function.
                  if (angular.isFunction($module.options.onSyncSuccess))
                    return $module.options.onSyncSuccess
                      .call($module, res, $module.user);
                }
              }, function(res) {

                  $log.warn(res.data);

              });

            }

          }

        };

        // expects string.
        $module.hasRole = function hasRole(role) {

          var userRoles;

          // Get the users roles.
          userRoles = $module.userRoles();

          // If role is string need to convert to number.
          if (angular.isString(role))
            role = stringToNumber(role);

          // If we don't have a role return false;
          if (!role)
            return false;

          // If the role equals the defualt
          // public role return true.
          if (role === $module.options.defaultRole)
            return true;

          // Otherwise we check if the user has the role.
          return userRoles.indexOf(role) !== -1;

        };

        // expects string or array of strings.
        $module.hasAnyRole = function hasAnyRole(roles) {

          var result;

          // Check if csv string.
          if (angular.isString(roles))
            roles = roles.replace('/\s/g', '').split(',');

          if (!angular.isArray(roles))
            roles = [roles];

          // Check for public role if exists we don't
          // need to check user roles as the route is public.
          if (roles.indexOf($module.options.defaultRole) !== -1)
            return true;

          result = roles.some(function (v) {
            return $module.hasRole(v);
          });

          return result;

        };

        // check if meets the minimum roll required.
        $module.hasMinRole = function hasMinRole(role) {

          var userRoles = $module.user[$module.options.userRolesKey] || [],
              maxRole;

          if (angular.isString(role))
            role = stringToNumber(role);

          // get the passport's maximum role.
          maxRole = Math.max.apply(Math, userRoles);

          return maxRole >= role;

        };

        // check if role is not greater than.
        $module.hasMaxRole = function hasMaxRole(role) {

          var userRoles = $module.user[$module.options.userRolesKey] || [],
              maxRole;

          if (angular.isString(role))
            role = stringToNumber(role);

          // get the passport's maximum role.
          maxRole = Math.max.apply(Math, userRoles);

          return maxRole < role;

        };

        // Unauthenticated redirect handler.
        $module.unauthenticated = function unauthenticated() {

          var action = $module.options.onUnauthenticated;

          // if func call pass context.
          if (angular.isFunction(action))
            return action.call($module);

          // default to the login url.
          //$location.path(action || $module.options.loginUrl);
          $module.goto(action);

        };

        // Unauthorized redirect handler.
        // The following params are only passed internally
        // by the route interceptor.
        // e - the event only passed internally.
        // next - the next route
        // prev - the previous route.
        $module.unauthorized = function unauthorized(e, next, prev) {

          var action = $module.options.onUnauthorized,
              reload = e ? true : false;

          // if func call pass context.
          if (angular.isFunction(action))
            return action.call($module);

          // default to the login url.
          //$location.path(action || $module.options.loginUrl);
          $module.goto(action, reload);

        };

        // gets the identity name of the authenticated user.
        $module.displayName = function displayName(arr) {

          var result = [];
          arr = arr || $module.options.welcomeParams;

          if (!$module.user)
            return $module.options.guestText;

          angular.forEach(arr, function(v, k) {
            var found = $module.findByNotation($module.user, v);
            if (found)
                result.push(found);
          });

          return result.join(' ');

        };

        // returns welcome text and display name as link or text only.
        $module.welcome = function welcome(prefix) {
          var result;
          prefix = prefix || $module.options.welcomeText;
          result = prefix + ': ' + $module.displayName();
          return result.replace(/\s$/, '');
        };

        // Returns the event link for toggling log in and log out.
        $module.link = function link() {

          var logoutAction = $module.options.logoutAction,
              loginAction = $module.options.loginAction;

          // Normalizes return the proper link action.
          function linkAction(action) {
            if (angular.isFunction(action))
              return function() {
                action.apply($module, arguments);
              };
            else
              return function() {
                $location.path(action);
              };
          }

          if ($module.user)
            return linkAction(logoutAction);
          else
            return linkAction(loginAction);

        };

        // return roles array from user object.
        $module.userRoles = function userRoles() {

          var userRoles = $module.user && $module.user[$module.options.userRolesKey];

          // Ensure that userRoles is an array.
          if (userRoles && (angular.isString(userRoles) || angular.isNumber(userRoles)))
            userRoles = [userRoles];

          return userRoles || [$module.options.defaultRole || 0];

        };

        // navigate to path.
        $module.goto = function goto(url, reload) {

          $location.path(url);

          if (reload) {
            // Use timeout to ensure $rootScope variables trigger.
            $timeout(function() {
              if ($module.options.router === 'ngRoute')
                $route.reload();
              else
                $route.go($route.current, {}, { reload: true });
            });
          }

        };

        // set initial options
        $module.set();

        $rootScope[$module.options.rootKey] = $module;

        // return for chaining.
        return $module;

      }

      ModuleFactory.instance = undefined;

      // return new instance of Passport.
      return new ModuleFactory();

    }
  ];

  return {
    $get: get,
    $set: set
  };

}]);

// intercepts 401 and 403 errors.
angular.module('ai.passport.interceptor', [])

.factory('$passportInterceptor', ['$q', '$injector', function($q, $injector) {
    return {
      responseError: function(res) {
        //get passport here to prevent circ dependency.
        var passport = $injector.get('$passport');
        // handle unauthenticated response
        if (res.status === 401 && passport.options['401'])
          passport.unauthenticated();
        // handle unauthorized.
        if (res.status === 403 && passport.options['403'])
          passport.unauthorized();
        return $q.reject(res);
      }
    };
  }])
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('$passportInterceptor');
  }]);

// handles intercepting route when
// required permissions are not met.
angular.module('ai.passport.route', [])

.run(['$rootScope', '$location', '$passport', function($rootScope, $location, $passport) {

  var changeEvent = $passport.routerChangeEvent;

  // ngRoute:
  //      event - the JavaScript event.
  //      next  - the next route.
  //      current - the current route.
  // uiRouter:
  //      event - the JavaScript event.
  //      toState - the next state.
  //      toParams - the next state's params.
  //      fromState - the current or previous state.
  //      fromParams - the current or previous state's params.
  $rootScope.$on(changeEvent, function(e) {

    var args = Array.prototype.slice.call(arguments, 0),
      url = $location.path(),
      area = {},
      route = {},
      acl,
      authorized,
      next, prev, urlExp;

    //url = url.replace(/^\//, '');
    url = url.split('?')[0];
    //urlExp = new RegExp('^' + $passport.options.loginUrl + '.+');

    next = args[1];
    prev = args[2];

    // for ui router the prev route
    // is at diff arg position.
    if (changeEvent === '$stateChangeStart')
      prev = args[3];

    // Set the route to next object.
    route = next;

    // If next.$$route using angular-route.
    if (next && next.$$route)
      route = next.$$route;

    acl = $passport.findByNotation(route, $passport.options.aclKey);

    // when paranoid all routes must contain
    // an access key containing roles otherwise
    // direct to unauthorized.
    if (acl === undefined && $passport.options.paranoid === true)
      return $passport.unauthorized();

    // We've passed paranoid setting so safe to
    // set default acl.
    if (!acl)
      acl = [$passport.options.defaultRole];

   // If we already have a user.
   if ($passport.user) {

     authorized = $passport.hasAnyRole(acl);

     if (!authorized) {
       e.preventDefault();
       $passport.unauthorized(e, next, prev);
     }

     // Check if default url is enabled and path is
     // is the login url if true then redirect to
     // the default url.
    if ($passport.userSync && $passport.options.defaultUrl && $passport.options.loginUrl === url) {
      e.preventDefault();
      $passport.goto($passport.options.defaultUrl, true);
    }

   }

   // Otherwise ensure user before continuing.
   else {

     $passport.sync(function() {

       authorized = $passport.hasAnyRole(acl);

       if (!authorized) {
         e.preventDefault();
         $passport.unauthorized(e, next, prev);
       }

       // Check if default url is enabled and path is
       // is the login url if true then redirect to
       // the default url.
      if ($passport.user && $passport.options.defaultUrl && $passport.options.loginUrl === url) {
        e.preventDefault();
        $passport.goto($passport.options.defaultUrl, true);
      }

     });

   }

  });

}]);

// imports above modules.
angular.module('ai.passport', [
  'ai.passport.factory',
  'ai.passport.interceptor',
  'ai.passport.route'
]);
