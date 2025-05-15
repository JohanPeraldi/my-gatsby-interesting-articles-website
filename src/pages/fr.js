import * as React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "../styles/articleList.module.css"
import { translateCategory, translateTag } from '../utils/translations'

const FrenchArticlesPage = ({ data }) => {
  const articles = data.allMarkdownRemark?.nodes || []
  
  return (
    <Layout>
      <h2 className={styles.pageTitle}>Articles en français</h2>
      <p className={styles.pageDescription}>Une collection d’articles positifs et inspirants glanés sur la toile.</p>
      <p className={styles.languageLink}>
        <Link to="/">Articles en anglais</Link>
      </p>
      
      <div className={styles.articlesGrid}>
        {articles.map(article => (
          <article key={article.id} className={styles.articleCard}>
            <h3 className={styles.articleTitle}>
              <Link to={`/article${article.fields?.slug}`}>
                {article.frontmatter.title}
              </Link>
            </h3>
            <p className={styles.articleMeta}>
              De: {article.frontmatter.sourceName} • 
              Catégorie: {translateCategory(article.frontmatter.category)}
            </p>
            <p className={styles.articleExcerpt}>{article.frontmatter.excerpt}</p>
            <div className={styles.articleTags}>
              {article.frontmatter.tags?.map(tag => (
                <span key={tag} className={styles.tag}>{translateTag(tag)}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Layout>
  )
}

export const Head = () => <Seo title="Accueil" />

export const query = graphql`
  query {
    allMarkdownRemark(sort: {frontmatter: {curationDate: DESC}}, filter: {fileAbsolutePath: {regex: "/content/articles/fr/"}}) {
      nodes {
        id
        fields {
          slug
        }
        frontmatter {
          title
          sourceName
          category
          curationDate(formatString: "DD MMMM YYYY")
          excerpt
          tags
          originalDate(formatString: "DD MMMM YYYY")
        }
      }
    }
  }
`

export default FrenchArticlesPage
