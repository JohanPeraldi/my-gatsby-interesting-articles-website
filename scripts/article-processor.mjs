#!/usr/bin/env node

// @ts-nocheck

// Comprehensive article processing system with AI, image handling, and batch processing

import puppeteer from 'puppeteer';
import TurndownService from 'turndown';
import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import inquirer from 'inquirer';
import chalk from 'chalk';
import sharp from 'sharp';
import RSSParser from 'rss-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ComprehensiveArticleProcessor {
    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced'
        });
        
        // Initialize AI options
        this.initializeAI();
        
        this.rssParser = new RSSParser();
        this.setupTurndownRules();
        
        // Configuration
        this.config = {
            imageDir: 'src/images/articles',
            contentDir: 'src/content/articles',
            maxImageWidth: 1200,
            supportedImageFormats: ['.jpg', '.jpeg', '.png', '.webp'],
            rssFeeds: [
                // Add your RSS feeds here
                'https://www.theguardian.com/environment/rss',
                'https://www.sciencedaily.com/rss/earth_climate/environmental_science.xml',
                // Add more feeds as needed
            ]
        };
    }
    
    async initializeAI() {
        // Load AI configuration
        await this.loadAIConfig();
        
        // Initialize AI based on configuration
        if (this.aiConfig.mode === 'ollama') {
            const { OllamaAI } = await import('./ollama-ai.mjs');
            this.ollamaAI = new OllamaAI(this.aiConfig.ollama);
        }
        
        // Fallback keyword analyzer
        const { FreeAIAnalyzer } = await import('./ai-alternatives.mjs');
        this.keywordAI = new FreeAIAnalyzer();
    }
    
    async loadAIConfig() {
        try {
            const configPath = path.join(process.cwd(), 'article-processor-config.mjson');
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);
            this.aiConfig = config.ai || { mode: 'keyword' };
        } catch (error) {
            // Default configuration
            this.aiConfig = {
                mode: process.env.USE_OLLAMA === 'true' ? 'ollama' : 'keyword',
                ollama: {
                    model: 'llama3.2:3b',
                    baseUrl: 'http://localhost:11434',
                    timeout: 30000
                }
            };
        }
    }
    
    setupTurndownRules() {
        // Custom rules for better markdown conversion
        this.turndownService.addRule('cleanLinks', {
            filter: 'a',
            replacement: (content, node) => {
                const href = node.getAttribute('href');
                if (!href || href.startsWith('#')) return content;
                return `[${content}](${href})`;
            }
        });
        
        this.turndownService.addRule('images', {
            filter: 'img',
            replacement: (content, node) => {
                const alt = node.getAttribute('alt') || '';
                const src = node.getAttribute('src') || '';
                const title = node.getAttribute('title');
                
                if (!src) return '';
                
                const titlePart = title ? ` "${title}"` : '';
                return `![${alt}](${src}${titlePart})`;
            }
        });
    }
    
    // ============ WEB SCRAPING ============
    async scrapeArticle(url) {
        console.log(chalk.blue(`🔍 Scraping: ${url}`));
        
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            const articleData = await page.evaluate(() => {
                const getText = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim() : '';
                };
                
                const getAttribute = (selector, attr) => {
                    const element = document.querySelector(selector);
                    return element ? element.getAttribute(attr) : '';
                };
                
                // Extract all possible image URLs
                const images = Array.from(document.querySelectorAll('img')).map(img => ({
                    src: img.src,
                    alt: img.alt || '',
                    title: img.title || ''
                }));
                
                // Try multiple selectors for each field
                const title = getText('h1') || 
                             getAttribute('meta[property="og:title"]', 'content') || 
                             getText('title') || '';
                
                const excerpt = getAttribute('meta[name="description"]', 'content') ||
                               getAttribute('meta[property="og:description"]', 'content') ||
                               getText('.excerpt') || '';
                
                const publishDate = getAttribute('time', 'datetime') ||
                                   getAttribute('[property="article:published_time"]', 'content') ||
                                   getAttribute('meta[name="publish-date"]', 'content') || '';
                
                const author = getText('[rel="author"]') ||
                              getText('.author') ||
                              getAttribute('meta[name="author"]', 'content') || '';
                
                const siteName = getAttribute('meta[property="og:site_name"]', 'content') ||
                                getText('.site-name') ||
                                window.location.hostname.replace('www.', '') || '';
                
                // Extract main content
                const contentSelectors = [
                    'article',
                    '[role="main"]',
                    'main',
                    '.content',
                    '.post-content',
                    '.article-content',
                    '.entry-content'
                ];
                
                let contentElement = null;
                for (const selector of contentSelectors) {
                    contentElement = document.querySelector(selector);
                    if (contentElement) break;
                }
                
                const contentHtml = contentElement ? contentElement.innerHTML : document.body.innerHTML;
                
                return {
                    title: title.replace(/\n/g, ' ').trim(),
                    excerpt: excerpt.replace(/\n/g, ' ').trim(),
                    publishDate,
                    author,
                    siteName,
                    contentHtml,
                    images,
                    url: window.location.href
                };
            });
            
            return articleData;
            
        } finally {
            await browser.close();
        }
    }
    
    // ============ AI INTEGRATION ============
    async analyzeWithAI(articleData) {
        console.log(chalk.blue(`🤖 Analyzing article with ${this.aiConfig.mode.toUpperCase()}...`));
        
        try {
            let analysis = null;
            
            switch (this.aiConfig.mode) {
                case 'ollama':
                    if (this.ollamaAI) {
                        analysis = await this.ollamaAI.analyzeArticle(articleData);
                    }
                    break;
                    
                case 'keyword':
                default:
                    analysis = this.keywordAI.analyzeContent(
                        articleData.title, 
                        articleData.excerpt
                    );
                    break;
            }
            
            // Fallback to keyword analysis if AI fails
            if (!analysis) {
                console.log(chalk.yellow('⚠️  AI analysis failed, using keyword fallback'));
                analysis = this.keywordAI.analyzeContent(
                    articleData.title, 
                    articleData.excerpt
                );
            }
            
            console.log(chalk.green(`🎯 Analysis complete (${analysis.confidence}/10 confidence):`));
            console.log(`   Mode: ${this.aiConfig.mode}`);
            console.log(`   Category: ${analysis.category}`);
            console.log(`   Tags: ${[...analysis.existingTags, ...analysis.suggestedNewTags].join(', ')}`);
            
            return analysis;
            
        } catch (error) {
            console.log(chalk.red(`❌ AI analysis error: ${error.message}`));
            
            // Always fallback to keyword analysis
            return this.keywordAI.analyzeContent(
                articleData.title, 
                articleData.excerpt
            );
        }
    }
    
    // ============ IMAGE PROCESSING ============
    async downloadAndProcessImages(articleData, language, articleSlug) {
        console.log(chalk.blue('📸 Processing images...'));
        
        const processedImages = [];
        const imageDir = path.join(this.config.imageDir, language, articleSlug);
        
        // Create image directory
        await fs.mkdir(imageDir, { recursive: true });
        
        for (let i = 0; i < articleData.images.length; i++) {
            const image = articleData.images[i];
            if (!image.src || image.src.startsWith('data:')) continue;
            
            try {
                const imageUrl = new URL(image.src, articleData.url);
                const filename = await this.downloadImage(imageUrl.href, imageDir, i);
                
                if (filename) {
                    const relativePath = `./images/articles/${language}/${articleSlug}/${filename}`;
                    processedImages.push({
                        originalSrc: image.src,
                        newPath: relativePath,
                        alt: image.alt,
                        title: image.title
                    });
                }
            } catch (error) {
                console.log(chalk.yellow(`⚠️  Failed to process image ${i + 1}: ${error.message}`));
            }
        }
        
        console.log(chalk.green(`✅ Processed ${processedImages.length} images`));
        return processedImages;
    }
    
    async downloadImage(url, dir, index) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https:') ? https : http;
            
            client.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }
                
                const contentType = response.headers['content-type'];
                let extension = '.jpg';
                
                if (contentType?.includes('png')) extension = '.png';
                else if (contentType?.includes('webp')) extension = '.webp';
                else if (contentType?.includes('gif')) extension = '.gif';
                
                const filename = `image-${index + 1}${extension}`;
                const filepath = path.join(dir, filename);
                
                const chunks = [];
                response.on('data', chunk => chunks.push(chunk));
                response.on('end', async () => {
                    try {
                        const buffer = Buffer.concat(chunks);
                        
                        // Optimize image with Sharp
                        await sharp(buffer)
                            .resize(this.config.maxImageWidth, null, {
                                withoutEnlargement: true
                            })
                            .jpeg({ quality: 85 })
                            .toFile(filepath.replace(extension, '.jpg'));
                        
                        resolve(filename.replace(extension, '.jpg'));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }
    
    // ============ CONTENT PROCESSING ============
    cleanContent(html, processedImages = []) {
        let markdown = this.turndownService.turndown(html);
        
        // Replace image URLs with local paths
        processedImages.forEach(img => {
            const imageRegex = new RegExp(`!\\[([^\\]]*)\\]\\(${img.originalSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^)]*\\)`, 'g');
            const replacement = `![${img.alt}](${img.newPath}${img.title ? ` "${img.title}"` : ''})`;
            markdown = markdown.replace(imageRegex, replacement);
        });
        
        // Clean up markdown
        markdown = markdown
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\[([^\]]+)\]\(\)/g, '$1')
            .replace(/Advertisement\n/gi, '')
            .replace(/\[Share on [^\]]+\]\([^\)]+\)/gi, '');
        
        return markdown.trim();
    }
    
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
    }
    
    generateFrontmatter(data, analysis, language) {
        const currentDate = new Date().toISOString().split('T')[0];
        const originalDate = data.publishDate ? 
            new Date(data.publishDate).toISOString().split('T')[0] : 
            currentDate;
        
        const escapeYaml = (str) => str.replace(/'/g, "''");
        
        const allTags = [...analysis.existingTags, ...analysis.suggestedNewTags];
        const tagsYaml = allTags.length > 0 ? 
            `\n  [${allTags.map(tag => `'${escapeYaml(tag)}'`).join(', ')}]` :
            "\n  ['TODO']";
        
        return `---
title: '${escapeYaml(data.title)}'
sourceName: '${escapeYaml(data.siteName)}'
sourceUrl: '${data.url}'
originalDate: '${originalDate}'
curationDate: '${currentDate}'
category: '${analysis.category}'
tags:${tagsYaml}
excerpt: '${escapeYaml(data.excerpt)}'
---

`;
    }
    
    // ============ RSS MONITORING ============
    async loadRSSConfig() {
        try {
            const rssConfigPath = './rss-feeds-reference.mjson';
            const rssConfigData = await fs.readFile(rssConfigPath, 'utf8');
            const rssConfig = JSON.parse(rssConfigData);
            
            // Store the full RSS configuration
            this.rssConfig = rssConfig;
            
            // Flatten all RSS feeds into a single array
            this.config.rssFeeds = [
                ...rssConfig.rssFeeds.environment,
                ...rssConfig.rssFeeds.science,
                ...rssConfig.rssFeeds.wildlife,
                ...rssConfig.rssFeeds.french,
                ...rssConfig.rssFeeds.positive
            ];
            
            // Store keywords for filtering
            this.rssKeywords = rssConfig.keywords;
            
            console.log(chalk.green(`📡 Loaded ${this.config.rssFeeds.length} RSS feeds from ${Object.keys(rssConfig.rssFeeds).length} categories`));
            
        } catch (error) {
            console.log(chalk.yellow('⚠️  RSS config file not found, using defaults'));
            this.rssKeywords = null;
            this.rssConfig = null;
        }
    }

    async monitorRSSFeeds() {
        console.log(chalk.blue('📡 Monitoring RSS feeds...'));
        
        // Load RSS config if available
        await this.loadRSSConfig();
        
        const allArticles = [];
        const feedStats = {};
        
        for (const feedUrl of this.config.rssFeeds) {
            try {
                console.log(chalk.gray(`  Checking: ${feedUrl}`));
                const feed = await this.rssParser.parseURL(feedUrl);
                
                const recentArticles = feed.items
                    .filter(item => {
                        const pubDate = new Date(item.pubDate || item.isoDate);
                        const threeDaysAgo = new Date();
                        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                        return pubDate > threeDaysAgo;
                    })
                    .filter(item => this.filterByKeywords(item)) // Add keyword filtering
                    .map(item => ({
                        title: item.title,
                        url: item.link,
                        description: item.contentSnippet || item.summary,
                        pubDate: item.pubDate || item.isoDate,
                        source: feed.title,
                        category: this.categorizeBySource(feedUrl), // Add category detection
                        relevanceScore: this.calculateRelevanceScore({
                            title: item.title,
                            description: item.contentSnippet || item.summary
                        })
                    }));
                
                allArticles.push(...recentArticles);
                feedStats[feed.title] = recentArticles.length;
                console.log(chalk.green(`    Found ${recentArticles.length} relevant articles`));
                
            } catch (error) {
                console.log(chalk.red(`    Failed to parse ${feedUrl}: ${error.message}`));
            }
        }
        
        // Sort by relevance (positive keywords first)
        allArticles.sort((a, b) => {
            // First sort by relevance score
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            // Then by date (newest first)
            return new Date(b.pubDate) - new Date(a.pubDate);
        });
        
        // Show summary statistics
        if (Object.keys(feedStats).length > 0) {
            console.log(chalk.blue('\n📊 Feed Statistics:'));
            Object.entries(feedStats)
                .filter(([_, count]) => count > 0)
                .sort(([_,a], [__,b]) => b - a)
                .forEach(([source, count]) => {
                    console.log(chalk.gray(`   ${source}: ${count} articles`));
                });
        }
        
        return allArticles;
    }

    // Filter articles by keywords
    filterByKeywords(item) {
        if (!this.rssKeywords) return true;
        
        const text = `${item.title} ${item.contentSnippet || item.summary || ''}`.toLowerCase();
        
        // Check for exclude keywords first (strong filter)
        const hasExcludeKeywords = this.rssKeywords.exclude.some(keyword => 
            text.includes(keyword.toLowerCase())
        );
        
        if (hasExcludeKeywords) {
            return false;
        }
        
        // Check for include keywords (more lenient)
        const hasIncludeKeywords = this.rssKeywords.include.some(keyword => 
            text.includes(keyword.toLowerCase())
        );
        
        return hasIncludeKeywords;
    }

    // Calculate relevance score based on positive keywords
    calculateRelevanceScore(article) {
        if (!this.rssKeywords) return 0;
        
        const text = `${article.title} ${article.description || ''}`.toLowerCase();
        const highPriorityKeywords = [
            'breakthrough', 'discovery', 'success', 'positive', 'hope', 'solution',
            'conservation', 'protection', 'recovery', 'restoration', 'sustainable'
        ];
        
        let score = 0;
        
        // High priority keywords get 3 points each
        highPriorityKeywords.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                score += 3;
            }
        });
        
        // Regular include keywords get 1 point each
        this.rssKeywords.include.forEach(keyword => {
            if (text.includes(keyword.toLowerCase()) && !highPriorityKeywords.includes(keyword)) {
                score += 1;
            }
        });
        
        return score;
    }

    // Categorize articles by source
    categorizeBySource(feedUrl) {
        if (!this.rssConfig) return 'general';
        
        for (const [category, feeds] of Object.entries(this.rssConfig.rssFeeds)) {
            if (feeds.includes(feedUrl)) {
                return category;
            }
        }
        
        return 'general';
    }

    // Get articles by category
    async getArticlesByCategory(category = null) {
        const articles = await this.monitorRSSFeeds();
        
        if (!category) {
            return articles;
        }
        
        return articles.filter(article => article.category === category);
    }
    
    // ============ BATCH PROCESSING ============
    async batchProcess(urls, language = 'en') {
        console.log(chalk.blue(`🔄 Starting batch processing of ${urls.length} articles...`));
        
        const results = [];
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(chalk.blue(`\n[${i + 1}/${urls.length}] Processing: ${url}`));
            
            try {
                const result = await this.processArticle(url, language, false);
                results.push({ url, success: true, result });
                console.log(chalk.green(`✅ Successfully processed`));
            } catch (error) {
                results.push({ url, success: false, error: error.message });
                console.log(chalk.red(`❌ Failed: ${error.message}`));
            }
            
            // Add delay between requests to be respectful
            if (i < urls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(chalk.blue('\n📊 Batch Processing Summary:'));
        console.log(chalk.green(`✅ Successful: ${successful}`));
        console.log(chalk.red(`❌ Failed: ${failed}`));
        
        if (failed > 0) {
            console.log(chalk.yellow('\nFailed URLs:'));
            results.filter(r => !r.success).forEach(r => {
                console.log(chalk.red(`  ${r.url}: ${r.error}`));
            });
        }
        
        return results;
    }
    
    // ============ MAIN PROCESSING ============
    async processArticle(url, language = 'en', interactive = true) {
        try {
            // 1. Scrape article
            const articleData = await this.scrapeArticle(url);
            
            // 2. AI analysis
            const aiAnalysis = await this.analyzeWithAI(articleData);
            
            // 3. Interactive confirmation if needed
            let finalData = articleData;
            let finalAnalysis = aiAnalysis;
            
            if (interactive) {
                const confirmation = await this.confirmProcessing(articleData, aiAnalysis);
                if (!confirmation.proceed) {
                    console.log(chalk.yellow('Processing cancelled.'));
                    return null;
                }
                finalData = { ...articleData, ...confirmation.updates };
                finalAnalysis = { ...aiAnalysis, ...confirmation.analysisUpdates };
            }
            
            // 4. Generate slug and process images
            const slug = this.generateSlug(finalData.title);
            const processedImages = await this.downloadAndProcessImages(finalData, language, slug);
            
            // 5. Generate content
            const cleanContent = this.cleanContent(finalData.contentHtml, processedImages);
            const frontmatter = this.generateFrontmatter(finalData, finalAnalysis, language);
            const fullMarkdown = frontmatter + cleanContent;
            
            // 6. Save file
            const filename = `index.md`;
            const outputDir = path.join(this.config.contentDir, language, slug);
            const outputPath = path.join(outputDir, filename);
            
            await fs.mkdir(outputDir, { recursive: true });
            await fs.writeFile(outputPath, fullMarkdown, 'utf8');
            
            console.log(chalk.green('\n✅ Article successfully processed!'));
            console.log(chalk.blue(`📁 Path: ${outputPath}`));
            console.log(chalk.blue(`📝 Title: ${finalData.title}`));
            console.log(chalk.blue(`🏷️  Category: ${finalAnalysis.category}`));
            console.log(chalk.blue(`🖼️  Images: ${processedImages.length}`));
            
            return {
                path: outputPath,
                title: finalData.title,
                category: finalAnalysis.category,
                tags: [...finalAnalysis.existingTags, ...finalAnalysis.suggestedNewTags],
                images: processedImages.length
            };
            
        } catch (error) {
            console.error(chalk.red('❌ Error processing article:'), error.message);
            throw error;
        }
    }
    
    async confirmProcessing(articleData, aiAnalysis) {
        console.log(chalk.green('\n✅ Article scraped and analyzed!\n'));
        console.log(chalk.yellow('Preview:'));
        console.log(`Title: ${articleData.title}`);
        console.log(`Source: ${articleData.siteName}`);
        console.log(`AI Category: ${aiAnalysis.category} (${aiAnalysis.confidence}/10 confidence)`);
        console.log(`AI Tags: ${[...aiAnalysis.existingTags, ...aiAnalysis.suggestedNewTags].join(', ')}`);
        console.log(`Images: ${articleData.images.length}`);
        
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'acceptAI',
                message: 'Accept AI categorization?',
                default: aiAnalysis.confidence > 7
            },
            {
                type: 'input',
                name: 'customCategory',
                message: 'Custom category:',
                when: (answers) => !answers.acceptAI,
                default: aiAnalysis.category
            },
            {
                type: 'input',
                name: 'customTags',
                message: 'Custom tags (comma-separated):',
                when: (answers) => !answers.acceptAI,
                default: [...aiAnalysis.existingTags, ...aiAnalysis.suggestedNewTags].join(', ')
            },
            {
                type: 'confirm',
                name: 'proceed',
                message: 'Proceed with processing?',
                default: true
            }
        ]);
        
        const updates = {};
        const analysisUpdates = {};
        
        if (!answers.acceptAI) {
            if (answers.customCategory) {
                analysisUpdates.category = answers.customCategory;
            }
            if (answers.customTags) {
                const tags = answers.customTags.split(',').map(t => t.trim());
                analysisUpdates.existingTags = tags;
                analysisUpdates.suggestedNewTags = [];
            }
        }
        
        return {
            proceed: answers.proceed,
            updates,
            analysisUpdates
        };
    }
}

// Export for use in other modules
export default ComprehensiveArticleProcessor;
