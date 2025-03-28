import React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "../styles/article.module.css"

const ArticleTemplate = ({ data }) => {
  const { markdownRemark } = data
  const { frontmatter, html } = markdownRemark
  
  return (
    <Layout>
      <div className={styles.articleContainer}>
        <header className={styles.articleHeader}>
          <h2 className={styles.articleTitle}>{frontmatter.title}</h2>
          <p className={styles.sourceInfo}>
            From: <a href={frontmatter.sourceUrl} target="_blank" rel="noopener noreferrer">
              {frontmatter.sourceName}
            </a> • Published: {frontmatter.originalDate}
          </p>
          <div className={styles.categoryTags}>
            <span className={styles.category}>{frontmatter.category}</span>
            {frontmatter.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </header>
        
        <div 
          className={styles.articleContent}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        
        <footer className={styles.articleFooter}>
          <p>Curated on: {frontmatter.curationDate}</p>
          <Link to="/" className={styles.backLink}>Back to all articles</Link>
        </footer>
      </div>
    </Layout>
  )
}

export const query = graphql`
  query($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        sourceName
        sourceUrl
        originalDate(formatString: "DD MMMM YYYY")
        curationDate(formatString: "DD MMMM YYYY")
        category
        tags
        excerpt
      }
    }
  }
`

export default ArticleTemplate

export const Head = ({ data }) => {
  try {
    const { markdownRemark } = data
    const { frontmatter } = markdownRemark
    return <Seo title={frontmatter.title} description={frontmatter.excerpt} />
  } catch (error) {
    console.error("Error rendering Seo component:", error)
    return <title>Positive News Curation</title>
  }
}
