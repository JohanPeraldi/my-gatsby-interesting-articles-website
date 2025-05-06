import React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "../styles/article.module.css"

const translateCategory = (category) => {
  if (!category) return category

  const categoryTranslations = {
    'nature': 'nature',
    'environment': 'environnement',
    'wildlife': 'faune',
    'conservation': 'conservation',
    'ecology': 'écologie'
  }
  
  const lowercaseCategory = category.toLowerCase()
  return categoryTranslations[lowercaseCategory] || category
}

const translateTag = (tag) => {
  if (!tag) return tag

  const tagTranslations = {
    'positive news': 'nouvelles positives',
    'sustainability': 'durabilité',
    'climate': 'climat',
    'biodiversity': 'biodiversité',
    'global warming': 'réchauffement climatique',
    'animals': 'animaux',
    'horses': 'chevaux',
    'plants': 'plantes',
    'moss': 'mousses',
    'flowers': 'fleurs',
    'tulips': 'tulipes',
    'bird conservation': 'préservation des oiseaux',
    'ornithotherapy': 'ornithothérapie',
    'mental health': 'santé mentale'
  }
  
  const lowercaseTag = tag.toLowerCase()
  return tagTranslations[lowercaseTag] || tag
}

const ArticleTemplate = ({ data }) => {
  const { markdownRemark } = data
  const { frontmatter, html, fields, fileAbsolutePath } = markdownRemark
  
  // Multiple methods to detect language
  const languageFromSlug = fields?.slug?.includes('/fr/') ? 'fr' : 'en'
  const languageFromPath = fileAbsolutePath?.includes('/fr/') ? 'fr' : 'en'
  const language = languageFromSlug === 'fr' || languageFromPath === 'fr' ? 'fr' : 'en'
  
  // Translate category and tags for French articles
  const translatedCategory = language === 'fr' ? translateCategory(frontmatter.category) : frontmatter.category
  const translatedTags = language === 'fr' ? frontmatter.tags?.map(translateTag) : frontmatter.tags
  
  return (
    <Layout>
      <div className={styles.articleContainer}>
        <header className={styles.articleHeader}>
          <h2 className={styles.articleTitle}>{frontmatter.title}</h2>
          <p className={styles.sourceInfo}>
            <span>{language === 'fr' ? 'De' : 'From'}</span>: <a href={frontmatter.sourceUrl} target="_blank" rel="noopener noreferrer">
              {frontmatter.sourceName}
            </a> • <span>{language === 'fr' ? 'Publié le' : 'Published'}</span>: {language === 'fr' ? frontmatter.originalDateFr : frontmatter.originalDate}
          </p>
          <div className={styles.categoryTags}>
            <span className={styles.category}>{translatedCategory}</span>
            {translatedTags?.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </header>
        
        <div 
          className={styles.articleContent}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        
        <footer className={styles.articleFooter}>
          <p><span>{language === 'fr' ? 'Sélectionné le' : 'Curated on'}</span>: {language === 'fr' ? frontmatter.curationDateFr : frontmatter.curationDate}</p>
          <Link to={language === 'fr' ? '/fr' : '/'} className={styles.backLink}>
            {language === 'fr' ? 'Retour aux articles' : 'Back to all articles'}
          </Link>
        </footer>
      </div>
    </Layout>
  )
}

export const query = graphql`
  query($id: String!) {
    markdownRemark(id: { eq: $id }) {
      fields {
        slug
      }
      fileAbsolutePath
      html
      frontmatter {
        title
        sourceName
        sourceUrl
        originalDate(formatString: "DD MMMM YYYY", locale: "en")
        originalDateFr: originalDate(formatString: "DD MMMM YYYY", locale: "fr")
        category
        tags
        excerpt
        curationDate(formatString: "DD MMMM YYYY", locale: "en")
        curationDateFr: curationDate(formatString: "DD MMMM YYYY", locale: "fr")
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
    return <title>Optimist Vibe</title>
  }
}
