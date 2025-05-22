// gatsby-config.js
/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `Optimist Vibe`,
    siteUrl: `https://optimistvi.be`,
    description: "A collection of positive and inspiring articles from around the web",
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `articles`,
        path: `${__dirname}/src/content/articles`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`, // optional — only needed if you use images outside markdown
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800, // adjust to your layout's max image width
              linkImagesToOriginal: false,
              showCaptions: true,
              withWebp: true,
              loading: "lazy",
            },
          },
        ],
      },
    },
  ],
}
