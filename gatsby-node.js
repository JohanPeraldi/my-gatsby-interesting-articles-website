const { createFilePath } = require("gatsby-source-filesystem")
const path = require("path")

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const result = await graphql(`
    {
      allMarkdownRemark {
        nodes {
          id
          frontmatter {
            title
          }
          fields {
            slug
          }
        }
      }
    }
  `)

  if (result.errors) {
    console.error(result.errors)
    return
  }

  // Create article pages
  result.data.allMarkdownRemark.nodes.forEach(node => {
    createPage({
      path: `/article${node.fields.slug}`,
      component: path.resolve(`./src/templates/article.js`),
      context: {
        id: node.id,
      },
    })
  })
}

// Create slugs for articles
exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `content/articles` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}
