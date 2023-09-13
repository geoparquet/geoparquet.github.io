# geoparquet.org

This is the source for the https://geoparquet.org/ website.


## Setup

The website is built with the [Astro](https://astro.build/) static site generator.  This requires [Node 18.14](https://nodejs.org/en/download/) or newer.  You can confirm your installed version with `node --version`.

Install the project dependencies:

```
npm install
```


## Development

Start the development server:

```
npm start
```

The contents of the `src` directory is built with Astro and the output is written to the `dist` directory.  See the [Astro docs](https://docs.astro.build/en/getting-started/) for details on templating and more.

JavaScript in the `src` directory is linted and type checked.  See the [ESLint integration docs](https://eslint.org/docs/latest/user-guide/integrations) for details on configuring your editor to display and fix lint issues.


## Deployment

The `publish.yml` workflow publishes the site to GitHub Pages on each successful commit to the default branch.
