import React from "react"
import { useStaticQuery, graphql } from "gatsby"

const Seo = ({ title, description, children }) => {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            siteUrl
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title
  const finalTitle = title ? `${title} | ${defaultTitle}` : defaultTitle

  return (
    <>
      <title>{finalTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {children}
    </>
  )
}

export default Seo
