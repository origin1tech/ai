#Angular Interface

A library of directive widgets/providers for creating an intuitive ui experience for users based on Bootstrap.

###Included

The Ai library contains the following: 

- dropdown - a dropdown/select element that filters data from an object, an array or server endpoint.
- flash - a utily for displaying flash messages or alerts, also intercepts http errors when enabled.
- loader - simple directive to show a "page loading" image, svg and/or text.
- step - a step wizard for stepping through forms culminating at a submit action.
- storage - module that enables you to easily top into localstorage but falls back to cookies if not supported.
- table - grid like table directive that supports batch loading, server side order, filtering and much more.
- validate - auto-magically created validation messages or summary for forms.
- widget - the widget modules contains following widgets: case(forces text case), number(force number with decimal places),
          compare(compares two values for equality), and placeholder(if browser doesn't support placeholder, adds label).
- autoform - extremely dirty not remotely complete directive for prototyping a form quickly.

These modules have been pulled from several active projects, having striped away the opinionated syntax for the given
project. In short if you find bugs let us know or better yet create a PR!!!

###Installation

```sh
$ bower install ai
```

(see documentation below)

###Configuration

To add Ai to you project simply add references to your html page.

```html
<head lang="en">
    <link rel="stylesheet" href="/bower_components/ai/dist/ai.css" />
</head>
<body>
    <script src="/bower_components/ai/dist/ai.js"></script>
</body>
```

**Wiring up Ai to your Angular app**

```js
angular.module('app', ['ai']);
```

Most modules are created using $provider, hence you can globally configure the relative options. An example of this
might be the "ai.flash" module. The below would tell ai.flash to show the stack trace in the flash message.

```js
angular.module('app', ['ai'])
.config(function($flashProvider) {
    $flashProvider.$set('stack', true);
    // or
    // $flashProvider.$set({ stack: true });
});
```

**Wiring up a directive**

Much like any other directive you've used Ai is configured the same way. Options can be passed in several ways depending
on the directive used. If the directive supports element, attribute and class instantiations the directive could be 
configured any of the following ways:

```html
<ai-loader ai-loader-options="{ name: 'page' }"></ai-loader>

<div ai-loader="myScopeVariable"></div>

<div class="ai-loader" name="page"></div>
```

You can also mingle any of the above methods above and the library will merge them properly. One thing to **NOTE** is that
declarative attributes such as **name="page"** for example would be overwritten if "ai-loader-options" were present
and it contained a "name" property. The library assumes if you've provided a collection of options those are the ones
you want to use or take priority.

###Documentation

As with all documentation there's only so much time in the day, so the documentation is somewhat limited. That said
most if not all the options for each module are documented in source. You should consider viewing the source as there are
likely additional notes to assist you. 

View the documentation by running the following then open your browser to http://127.0.0.1:8080:

```sh
$ gulp serve
```

To build the project run:

```sh
$ gulp build
```

###Customization

The Bower package includes all the sass and js files used for creating the styles as well as the individual modules that are
bundled into "ai.js". If you wish to override the sass files simply import the relevant .scss file then link the 
newly created output styles to your project after ai.css.

If you wish to clone the repository you can do so using the below git command. This will enable you to bundle the 
modules to your liking using Gulp.

```sh
$ git clone https://github.com/origin1tech/ai.git
```


