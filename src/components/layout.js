import React from "react"
import { Link } from "gatsby"
import "../styles/global.css"

const Layout = ({ children }) => {
  return (
    <div className="site-wrapper">
      <header className="site-header">
        <h1>
          <Link to="/">Positive News Curation</Link>
        </h1>
      </header>
      
      <main>{children}</main>
      
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Johan's Positive News Curation</p>
        <p>Sharing positive stories from around the web</p>
      </footer>
    </div>
  )
}

export default Layout
