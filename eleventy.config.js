const markdownIt = require('markdown-it');
const {EleventyRenderPlugin} = require('@11ty/eleventy');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const anchor = require('markdown-it-anchor');

module.exports = eleventyConfig => {
  const md = markdownIt({html: true, linkify: true})
    .use(anchor, {permalink: anchor.permalink.headerLink()})
    .disable('code');

  eleventyConfig.setLibrary('md', md);

  eleventyConfig.addPassthroughCopy('src/static');
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(EleventyRenderPlugin);

  return {
    dir: {
      input: 'src',
      output: 'dist',
    },
  };
};
