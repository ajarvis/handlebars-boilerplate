# Handlebars Boilerplate
Easily generate static sites with lightweight templating via Handlebars.

### Includes
 - Handlebars for lightweight templating
 - SCSS Lint, Preprocessing, and minification (sourcemaps, autoprefixer, clean-css)
 - JavaScript minification and bundling
 - Static distribution folder for rapid deployment
 - Configurable Gulp tasks

### Installation
Get started by installing: node, npm, and gulp (these are required).  Clone/fork the repo and run:

```sh
$ cd handlebars-boilerplate
$ npm install
$ npm start
```

### Development
Always edit files within the `/src/` folder.   Once the server is started, gulp will watch for file changes and automatically compile into the `/dist/` folder.  Any manual changes to `/dist/` will be lost.
