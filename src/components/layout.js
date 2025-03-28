import React from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import "../styles/global.css"

const Layout = ({ children }) => {
  return (
    <div className="site-wrapper">
      <header className="site-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <StaticImage
              src="../images/logo.png"
              alt="Positive News Curation Logo"
              placeholder="blurred"
              layout="fixed"
              width={40}
              height={40}
              className="logo-image"
            />
            <h1>Positive News Curation</h1>
          </Link>
        </div>
      </header>
      
      <main>{children}</main>
      
      <footer className="site-footer">
        <p>&copy; {new Date().getFullYear()} Positive News Curation</p>
        <p>Sharing positive stories from around the web</p>
      </footer>
    </div>
  )
}

export default Layout
