const eleventy = require("@11ty/eleventy");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItPrism = require("markdown-it-prism");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Server options
  eleventyConfig.setServerOptions({
    host: "0.0.0.0",
    port: 3000
  });

  // Pass through copy for static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/sw.js");
  eleventyConfig.addPassthroughCopy("src/humans.txt");
  eleventyConfig.addPassthroughCopy("src/.well-known");
  eleventyConfig.addPassthroughCopy("src/.nojekyll");

  // Markdown configuration
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  })
  .use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "after",
      class: "direct-link",
      symbol: "#"
    }),
    level: [1,2,3,4],
    slugify: eleventyConfig.getFilter("slugify")
  })
  .use(markdownItPrism, {
    defaultLanguage: "text"
  });
  eleventyConfig.setLibrary("md", markdownLibrary);

  // Filters
  eleventyConfig.addFilter("markdown", (content) => {
    if (!content) return "";
    return markdownLibrary.render(content);
  });

  eleventyConfig.addFilter("readableDate", dateObj => {
    if (!dateObj) return DateTime.now().toFormat("dd LLL yyyy");
    if (dateObj instanceof Date) return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
    if (typeof dateObj === "string") {
      const dt = DateTime.fromISO(dateObj, {zone: 'utc'});
      if (dt.isValid) return dt.toFormat("dd LLL yyyy");
      const d = new Date(dateObj);
      if (!isNaN(d.getTime())) return DateTime.fromJSDate(d, {zone: 'utc'}).toFormat("dd LLL yyyy");
    }
    return DateTime.now().toFormat("dd LLL yyyy");
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    if (!dateObj) return DateTime.now().toFormat('yyyy-LL-dd');
    if (dateObj instanceof Date) return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
    if (typeof dateObj === "string") {
      const dt = DateTime.fromISO(dateObj, {zone: 'utc'});
      if (dt.isValid) return dt.toFormat('yyyy-LL-dd');
      const d = new Date(dateObj);
      if (!isNaN(d.getTime())) return DateTime.fromJSDate(d, {zone: 'utc'}).toFormat('yyyy-LL-dd');
    }
    return DateTime.now().toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter("dateToRfc3339", (dateObj) => {
    if (!dateObj) return DateTime.now().toISO();
    if (dateObj instanceof Date) return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toISO();
    if (typeof dateObj === "string") {
      const dt = DateTime.fromISO(dateObj, {zone: 'utc'});
      if (dt.isValid) return dt.toISO();
      const d = new Date(dateObj);
      if (!isNaN(d.getTime())) return DateTime.fromJSDate(d, {zone: 'utc'}).toISO();
    }
    return DateTime.now().toISO();
  });
  
  eleventyConfig.addFilter("head", (array, n) => {
    if( n < 0 ) {
      return array.slice(n);
    }
    return array.slice(0, n);
  });

  eleventyConfig.addFilter("min", (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  eleventyConfig.addFilter("padStart", (val, len, char = '0') => {
    return String(val).padStart(Number(len), char);
  });

  eleventyConfig.addFilter("resolveLogo", (url) => {
    if (!url || typeof url !== 'string') return '';
    url = url.trim();
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('src/')) {
      url = url.replace(/^src\//, '/');
    } else if (url.startsWith('public/')) {
      url = url.replace(/^public\//, '/');
    }
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    return url;
  });

  // Collections
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md").reverse();
  });

  eleventyConfig.addCollection("featuredPosts", function(collectionApi) {
    const posts = collectionApi.getFilteredByGlob("src/posts/*.md").reverse();
    return posts.filter(post => post.data && (post.data.featured === true || post.data.pinned === true));
  });

  eleventyConfig.addCollection("projects", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/projects/*.md").reverse();
  });

  eleventyConfig.addCollection("labs", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/labs/*.md").reverse();
  });

  eleventyConfig.addCollection("research", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/research/*.md").reverse();
  });

  eleventyConfig.addCollection("downloads", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/downloads/*.md").reverse();
  });
  
  eleventyConfig.addCollection("categories", function(collectionApi) {
    let categories = new Set();
    collectionApi.getFilteredByGlob("src/posts/*.md").forEach(item => {
      if (item.data && item.data.categories) {
        let cats = item.data.categories;
        if (typeof cats === "string") cats = [cats];
        if (Array.isArray(cats)) {
          for (let cat of cats) {
            if (cat) categories.add(cat);
          }
        }
      }
    });
    return Array.from(categories).sort();
  });

  eleventyConfig.addCollection("categoryCounts", function(collectionApi) {
    let counts = {};
    collectionApi.getFilteredByGlob("src/posts/*.md").forEach(item => {
      if (item.data && item.data.categories) {
        let cats = item.data.categories;
        if (typeof cats === "string") cats = [cats];
        if (Array.isArray(cats)) {
          for (let cat of cats) {
            if (cat) {
              counts[cat] = (counts[cat] || 0) + 1;
            }
          }
        }
      }
    });
    return counts;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["md", "njk", "html", "liquid"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
