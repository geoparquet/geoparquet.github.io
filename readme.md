# geoparquet.org

This is the source for the https://geoparquet.org/ website.


## Setup

The website is built with the [11ty](https://www.11ty.dev/) static site generator.  This requires [Node 12](https://nodejs.org/en/download/) or newer.  You can confirm your installed version with `node --version`.

Install the project dependencies:

```
npm install
```


## Development

Start the development server:

```
npm start
```

The contents of the `src` directory is built with 11ty and the output is written to the `dist` directory.  Content in the `static` directory is passed through without applying any transforms.  See the [11ty docs](https://www.11ty.dev/docs/) for details on templating and more.

JavaScript in the `src` directory is linted and type checked.  See the [ESLint integration docs](https://eslint.org/docs/latest/user-guide/integrations) for details on configuring your editor to display and fix lint issues.


## Deployment

The `publish.yml` workflow publishes the site to GitHub Pages on each successful commit to the default branch.
