# Article Processing System Documentation

## Overview

The Article Processing System is a comprehensive tool for automatically extracting, categorizing, and processing positive news articles for this Gatsby website. It features AI-powered categorization using Ollama, intelligent RSS feed monitoring with keyword filtering, automatic image processing, and batch operations.

## Features

### 🤖 AI-Powered Article Analysis

- **Ollama Integration**: Local AI processing for categorization and tagging
- **Smart Categorization**: Automatically assigns articles to predefined categories
- **Tag Suggestion**: Intelligent tag recommendations based on content
- **Confidence Scoring**: AI provides confidence ratings for its suggestions
- **Keyword Fallback**: Robust keyword-based analysis when AI is unavailable

### 📡 Advanced RSS Monitoring

- **Category-Based Feeds**: Monitors feeds organized by topic (environment, science, wildlife, etc.)
- **Keyword Filtering**: Automatically filters out negative content
- **Relevance Scoring**: Prioritizes positive, solution-focused articles
- **Multi-Language Support**: Separate feeds for English and French content
- **Smart Sorting**: Articles ranked by relevance and recency

### 🖼️ Automatic Image Processing

- **Image Download**: Automatically downloads all images from articles
- **Optimization**: Resizes and compresses images for web use
- **Format Conversion**: Converts images to efficient formats (JPEG)
- **Local Storage**: Organizes images in proper directory structure
- **Markdown Integration**: Updates image paths in markdown files

### 🔄 Batch Operations

- **Multiple URL Processing**: Process multiple articles simultaneously
- **RSS Batch Processing**: Select and process multiple RSS articles
- **Progress Tracking**: Real-time progress updates during batch operations
- **Error Handling**: Continues processing even if individual articles fail

## Installation

### Prerequisites

- Node.js 18+
- Gatsby project
- Ollama installed locally

### Setup

1. **Install Dependencies**

   ```bash
   npm install puppeteer turndown inquirer chalk commander sharp rss-parser node-fetch
   ```

2. **Update Package.json**
   Add `"type": "module"` to the `package.json`:

   ```json
   {
     "type": "module",
     "scripts": {
       "article": "node scripts/cli.js",
       "article:add": "node scripts/cli.js add",
       "article:batch": "node scripts/cli.js batch",
       "article:rss": "node scripts/cli.js rss",
       "article:config": "node scripts/cli.js config",
       "article:stats": "node scripts/cli.js stats",
       "article:interactive": "node scripts/cli.js interactive",
       "article:setup-ollama": "node scripts/setup-ollama.js"
     }
   }
   ```

3. **Create Script Files**
   Create a `scripts/` directory in the project root and add these files:

   - `article-processor.js` - Main processing engine
   - `cli.js` - Command-line interface
   - `ollama-ai.js` - Ollama integration
   - `ai-alternatives.js` - Keyword-based fallback
   - `setup-ollama.js` - Ollama setup wizard

4. **Configure RSS Feeds**
   Create `rss-feeds-reference.json` in the project root with the RSS feed configuration.

5. **Start Ollama**

   ```bash
   ollama serve
   ```

6. **Run Setup**

   ```bash
   npm run article:setup-ollama
   ```

## Configuration

### RSS Feeds Configuration

The system uses `rss-feeds-reference.json` to configure RSS feeds by category:

```json
{
  "rssFeeds": {
    "environment": [
      "https://www.theguardian.com/environment/rss",
      "https://www.bbc.com/news/science-environment/rss.xml"
    ],
    "science": [
      "https://www.sciencedaily.com/rss/earth_climate/environmental_science.xml"
    ],
    "wildlife": ["https://www.audubon.org/rss.xml"],
    "french": ["https://www.lemonde.fr/planete/rss_full.xml"],
    "positive": ["https://www.goodnewsnetwork.org/feed/"]
  },
  "keywords": {
    "include": [
      "conservation",
      "biodiversity",
      "breakthrough",
      "discovery",
      "success",
      "positive",
      "hope",
      "solution"
    ],
    "exclude": [
      "crisis",
      "disaster",
      "extinction",
      "destruction",
      "pollution",
      "toxic",
      "death",
      "tragedy"
    ]
  }
}
```

### Ollama Configuration

Ollama settings are stored in `article-processor-config.json`:

```json
{
  "ai": {
    "mode": "ollama",
    "ollama": {
      "model": "llama3.2:3b",
      "baseUrl": "http://localhost:11434",
      "timeout": 30000
    }
  }
}
```

## Usage

### Command Line Interface

#### Single Article Processing

```bash
# Interactive mode
npm run article:add

# Direct URL processing
npm run article:add --url "https://example.com/article" --lang en

# Skip confirmations (use AI suggestions)
npm run article:add --url "https://example.com/article" --yes
```

#### Batch Processing

```bash
# From file
npm run article:batch --file urls.txt --lang en

# From command line
npm run article:batch --urls "url1,url2,url3" --lang fr

# Interactive batch processing
npm run article:batch
```

#### RSS Monitoring

```bash
# Monitor all feeds
npm run article:rss

# Filter by category
npm run article:rss --category environment
npm run article:rss --category science
npm run article:rss --category positive

# Auto-process high-relevance articles
npm run article:rss --auto --lang en

# Show detailed statistics
npm run article:rss --show-stats
```

#### System Management

```bash
# View statistics
npm run article:stats

# Configure system
npm run article:config

# Interactive mode (recommended)
npm run article:interactive
```

### Interactive Mode

The interactive mode provides a user-friendly interface:

```bash
npm run article:interactive
```

Features:

- **Add Single Article**: Process one article with guided prompts
- **Batch Process**: Handle multiple articles with editor interface
- **RSS Monitoring**: Browse and filter RSS feeds by category
- **System Configuration**: Update settings and RSS feeds
- **Statistics**: View processing statistics and system status

### RSS Feed Categories

The system organizes RSS feeds into categories:

- **Environment**: General environmental news
- **Science**: Scientific research and discoveries
- **Wildlife**: Animal and nature conservation
- **French**: French-language content
- **Positive**: Curated positive news sources

### Relevance Scoring

Articles are scored based on keyword relevance:

- **⭐⭐⭐ High (5+ points)**: Breakthrough, discovery, solution-focused content
- **⭐⭐ Medium (2-4 points)**: Conservation, sustainability topics
- **⭐ Low (1 point)**: Basic relevant keywords

## File Organization

The system organizes processed articles in a structured format:

```plaintext
src/
├── content/
│   └── articles/
│       ├── en/
│       │   └── article-slug/
│       │       └── index.md
│       └── fr/
│           └── article-slug/
│               └── index.md
└── images/
    └── articles/
        ├── en/
        │   └── article-slug/
        │       ├── image-1.jpg
        │       └── image-2.jpg
        └── fr/
            └── article-slug/
                └── image-1.jpg
```

### Markdown Format

Each processed article generates a markdown file with frontmatter:

```markdown
---
title: 'Article Title'
sourceName: 'Publication Name'
sourceUrl: 'https://example.com/article'
originalDate: '2025-01-15'
curationDate: '2025-01-16'
category: 'science'
tags: ['animals', 'research', 'wildlife']
excerpt: 'Article description...'
---

Article content with optimized images...
```

## AI Integration

### Ollama Setup

1. **Install Ollama** (if not already installed)
2. **Download a Model**:

   ```bash
   ollama pull llama3.2:3b  # Recommended for speed
   ollama pull mistral:7b   # Better accuracy
   ollama pull llama3.1:8b  # Best accuracy
   ```

3. **Run Setup**: `npm run article:setup-ollama`

### AI Analysis Process

The AI analyzes each article to:

- Determine the best category from: conservation, ecology, environment, handicap, nature, science, wildlife
- Suggest relevant tags from your existing tag list
- Propose new tags if existing ones don't fit
- Provide confidence scores for all suggestions
- Allow manual override of all suggestions

### Fallback System

If Ollama is unavailable, the system automatically falls back to keyword-based analysis, ensuring continuous operation.

## Keyword Filtering

### Include Keywords

Articles must contain at least one of these keywords:

- conservation, biodiversity, wildlife, ecosystem
- sustainable, renewable, restoration, protection
- breakthrough, discovery, success, positive
- hope, solution, recovery

### Exclude Keywords

Articles containing these keywords are automatically filtered out:

- crisis, disaster, extinction, destruction
- pollution, toxic, death, killing
- tragedy, catastrophe

## Troubleshooting

### Common Issues

1. **Ollama Not Running**

   ```bash
   ollama serve
   ```

2. **Missing Models**

   ```bash
   ollama pull llama3.2:3b
   ```

3. **RSS Feed Errors**

   - Check internet connection
   - Verify RSS feed URLs in configuration
   - Some feeds may be temporarily unavailable

4. **Image Download Failures**

   - Some sites block automated downloads
   - System continues processing even if images fail
   - Check image directory permissions

5. **VS Code TypeScript Errors**
   - These are cosmetic and don't affect functionality
   - Add `// @ts-nocheck` to script files if needed

### Debug Mode

Set `DEBUG=true` in your environment for verbose logging:

```bash
DEBUG=true npm run article:add
```

## Performance Tips

1. **Model Selection**: Use `llama3.2:3b` for speed, `llama3.1:8b` for accuracy
2. **Batch Processing**: Process multiple articles at once for efficiency
3. **RSS Filtering**: Use category filters to reduce processing time
4. **Image Optimization**: Adjust `maxImageWidth` in config for your needs

## API Reference

### Core Classes

#### ComprehensiveArticleProcessor

- `processArticle(url, language, interactive)` - Process a single article
- `batchProcess(urls, language)` - Process multiple articles
- `monitorRSSFeeds()` - Monitor all RSS feeds
- `getArticlesByCategory(category)` - Get articles by category
- `analyzeWithAI(articleData)` - AI analysis of content

#### OllamaAI

- `analyzeArticle(articleData)` - Analyze article with Ollama
- `checkOllamaStatus()` - Check if Ollama is running
- `downloadModel(modelName)` - Download Ollama model

### Configuration Files

- `article-processor-config.json` - System configuration
- `rss-feeds-reference.json` - RSS feeds and keywords
- `.env` - Environment variables

## Best Practices

1. **Start Small**: Begin with a few RSS feeds and gradually add more
2. **Monitor Performance**: Use `npm run article:stats` to track processing
3. **Review AI Suggestions**: Always review AI categorization before accepting
4. **Backup Regularly**: Keep backups of your processed articles
5. **Update Feeds**: Regularly review and update RSS feed lists

## Security Considerations

- RSS feeds are accessed over HTTPS when possible
- No sensitive data is transmitted to external services
- Ollama runs locally for privacy
- Rate limiting prevents overwhelming source websites

## Future Enhancements

Potential improvements include:

- Custom AI model training
- Social media integration
- Automated publishing workflows
- Advanced image recognition
- Multi-language AI support

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review log files for error details
3. Test with a single article first
4. Verify Ollama is running and accessible

This system provides a comprehensive solution for automated positive news article processing, combining AI intelligence with robust RSS monitoring and efficient batch operations.
