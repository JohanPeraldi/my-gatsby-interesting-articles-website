/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `Feel-good articles`,
    siteUrl: `https://feel-good-articles.netlify.app/`,
    description: "A curation of positive news from around the web",
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `articles`,
        path: `${__dirname}/src/content/articles`,
      },
    },
    `gatsby-transformer-remark`,
  ],
}
