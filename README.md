#Angular Interface

A library of directive widgets and providers for creating an intuitive ui experience for users.

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

###Customization

The Bower package includes all the sass files used for creating the styles as well as the individual modules that are
bundled into "ai.js". If you wish to override the sass files simply import the relevant .scss file then link the 
newly created output styles to your project after ai.css.

If you wish to clone the repository you can do so using the below git command. This will enable you to bundle the 
modules to your liking using Gulp.

```sh
    git clone https://github.com/origin1tech/ai.git
```

###Documentation

As will all documentation there's only so much time in the day. So the documenation is somewhat limited. That said
most if not all the options for each module is documented. You should also consider viewing the source as there are
likely additional notes to assist you. You can view the documentation by running the following and opening your browser
to http://127.0.0.1:8080:

```sh
$ gulp serve
```

To build the project run:

```sh
$ gulp build
```

