import * as React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import * as styles from "../styles/articleList.module.css"

const IndexPage = ({ data }) => {
  const articles = data.allMarkdownRemark?.nodes || []
  
  return (
    <Layout>
      <h1 className={styles.pageTitle}>Feel-good Articles</h1>
      <p className={styles.pageDescription}>A collection of positive and inspiring articles from around the web.</p>
      
      <div className={styles.articlesGrid}>
        {articles.map(article => (
          <article key={article.id} className={styles.articleCard}>
            <h2 className={styles.articleTitle}>
              <Link to={`/article${article.fields?.slug}`}>
                {article.frontmatter.title}
              </Link>
            </h2>
            <p className={styles.articleMeta}>
              From: {article.frontmatter.sourceName} • 
              Category: {article.frontmatter.category}
            </p>
            <p className={styles.articleExcerpt}>{article.frontmatter.excerpt}</p>
            <div className={styles.articleTags}>
              {article.frontmatter.tags?.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Layout>
  )
}

export const query = graphql`
  query {
    allMarkdownRemark(sort: {frontmatter: {curationDate: DESC}}) {
      nodes {
        id
        fields {
          slug
        }
        frontmatter {
          title
          sourceName
          category
          tags
          excerpt
          curationDate(formatString: "MMMM DD, YYYY")
        }
      }
    }
  }
`

export default IndexPage
