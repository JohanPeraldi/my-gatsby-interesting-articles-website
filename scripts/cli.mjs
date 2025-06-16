#!/usr/bin/env node

// @ts-nocheck

// Main CLI interface for the article processing system

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import ComprehensiveArticleProcessor from './article-processor.mjs';

const program = new Command();
const processor = new ComprehensiveArticleProcessor();

// ============ CLI COMMANDS ============

program
  .name('article-processor')
  .description('Comprehensive article processing system')
  .version('1.0.0');

// Single article processing
program
  .command('add')
  .description('Add a single article')
  .option('-u, --url <url>', 'Article URL')
  .option('-l, --lang <language>', 'Language (en/fr)', 'en')
  .option('-y, --yes', 'Skip confirmations')
  .action(async (options) => {
    try {
      let url = options.url;
      
      if (!url) {
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'url',
            message: 'Enter article URL:',
            validate: (input) => {
              if (!input.trim()) return 'URL cannot be empty';
              try {
                new URL(input);
                return true;
              } catch {
                return 'Please enter a valid URL';
              }
            }
          }
        ]);
        url = answer.url;
      }
      
      await processor.processArticle(url, options.lang, !options.yes);
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Batch processing
program
  .command('batch')
  .description('Process multiple articles from a file or URLs')
  .option('-f, --file <file>', 'File containing URLs (one per line)')
  .option('-u, --urls <urls>', 'Comma-separated URLs')
  .option('-l, --lang <language>', 'Language (en/fr)', 'en')
  .action(async (options) => {
    try {
      let urls = [];
      
      if (options.file) {
        const content = await fs.readFile(options.file, 'utf8');
        urls = content.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
      } else if (options.urls) {
        urls = options.urls.split(',').map(url => url.trim());
      } else {
        // Interactive input
        const answers = await inquirer.prompt([
          {
            type: 'editor',
            name: 'urls',
            message: 'Enter URLs (one per line):',
            default: '# Enter URLs below, one per line\n# Lines starting with # are ignored\n\n'
          }
        ]);
        
        urls = answers.urls.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
      }
      
      if (urls.length === 0) {
        console.log(chalk.yellow('No URLs provided.'));
        return;
      }
      
      console.log(chalk.blue(`Found ${urls.length} URLs to process`));
      
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Process ${urls.length} articles?`,
          default: true
        }
      ]);
      
      if (!confirm.proceed) {
        console.log(chalk.yellow('Batch processing cancelled.'));
        return;
      }
      
      await processor.batchProcess(urls, options.lang);
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// RSS monitoring
program
  .command('rss')
  .description('Monitor RSS feeds for new articles')
  .option('-a, --auto', 'Automatically process interesting articles')
  .option('-l, --lang <language>', 'Language (en/fr)', 'en')
  .option('-c, --category <category>', 'Filter by category (environment, science, wildlife, french, positive)')
  .option('-s, --show-stats', 'Show detailed statistics')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Checking RSS feeds with advanced filtering...'));
      
      let articles;
      if (options.category) {
        articles = await processor.getArticlesByCategory(options.category);
        console.log(chalk.blue(`Filtering for category: ${options.category}`));
      } else {
        articles = await processor.monitorRSSFeeds();
      }
      
      if (articles.length === 0) {
        console.log(chalk.yellow('No relevant articles found.'));
        return;
      }
      
      console.log(chalk.green(`\n📰 Found ${articles.length} relevant articles:`));
      
      // Show articles with relevance scores
      articles.slice(0, 15).forEach((article, index) => {
        const relevanceIndicator = article.relevanceScore > 5 ? '⭐⭐⭐' : 
                                  article.relevanceScore > 2 ? '⭐⭐' : 
                                  article.relevanceScore > 0 ? '⭐' : '';
        
        console.log(`${index + 1}. ${chalk.blue(article.title)} ${relevanceIndicator}`);
        console.log(`   Source: ${article.source} | Category: ${chalk.cyan(article.category)}`);
        if (options.showStats) {
          console.log(`   URL: ${chalk.gray(article.url)}`);
          console.log(`   Relevance Score: ${article.relevanceScore}`);
        }
        console.log(`   Date: ${new Date(article.pubDate).toLocaleDateString()}`);
        console.log();
      });
      
      if (articles.length > 15) {
        console.log(chalk.gray(`... and ${articles.length - 15} more articles`));
      }
      
      // Show category breakdown
      const categoryBreakdown = articles.reduce((acc, article) => {
        acc[article.category] = (acc[article.category] || 0) + 1;
        return acc;
      }, {});
      
      console.log(chalk.blue('\n📊 Articles by Category:'));
      Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          console.log(chalk.gray(`   ${category}: ${count} articles`));
        });
      
      if (options.auto) {
        // Auto-process high-relevance articles
        const highRelevanceArticles = articles
          .filter(article => article.relevanceScore >= 3)
          .slice(0, 5);
          
        if (highRelevanceArticles.length > 0) {
          console.log(chalk.blue(`\n🤖 Auto-processing ${highRelevanceArticles.length} high-relevance articles...`));
          
          for (const article of highRelevanceArticles) {
            try {
              await processor.processArticle(article.url, options.lang, false);
              console.log(chalk.green(`✅ Processed: ${article.title}`));
            } catch (error) {
              console.log(chalk.red(`❌ Failed: ${article.title} - ${error.message}`));
            }
            
            // Delay between articles
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } else {
          console.log(chalk.yellow('No high-relevance articles found for auto-processing.'));
        }
      } else {
        // Interactive selection with enhanced display
        const selection = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedArticles',
            message: 'Select articles to process (⭐ = relevance):',
            choices: articles.slice(0, 20).map((article, index) => {
              const relevanceIndicator = article.relevanceScore > 5 ? '⭐⭐⭐' : 
                                        article.relevanceScore > 2 ? '⭐⭐' : 
                                        article.relevanceScore > 0 ? '⭐' : '';
              
              return {
                name: `${article.title} ${relevanceIndicator} (${article.category})`,
                value: index,
                short: article.title
              };
            }),
            pageSize: 12
          }
        ]);
        
        if (selection.selectedArticles.length > 0) {
          const selectedUrls = selection.selectedArticles.map(index => articles[index].url);
          await processor.batchProcess(selectedUrls, options.lang);
        }
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Configuration
program
  .command('config')
  .description('Configure the system')
  .action(async () => {
    try {
      const configPath = './article-processor-config.mjson';
      let currentConfig = {};
      
      try {
        const configFile = await fs.readFile(configPath, 'utf8');
        currentConfig = JSON.parse(configFile);
      } catch (error) {
        // Config file doesn't exist, use defaults
      }
      
      console.log(chalk.blue('🔧 Configuration'));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'imageDir',
          message: 'Image directory:',
          default: currentConfig.imageDir || 'src/images/articles'
        },
        {
          type: 'input',
          name: 'contentDir',
          message: 'Content directory:',
          default: currentConfig.contentDir || 'src/content/articles'
        },
        {
          type: 'number',
          name: 'maxImageWidth',
          message: 'Maximum image width:',
          default: currentConfig.maxImageWidth || 1200
        },
        {
          type: 'editor',
          name: 'rssFeeds',
          message: 'RSS feeds (one per line):',
          default: (currentConfig.rssFeeds || [
            'https://www.theguardian.com/environment/rss',
            'https://www.sciencedaily.com/rss/earth_climate/environmental_science.xml'
          ]).join('\n')
        }
      ]);
      
      // Process RSS feeds
      const rssFeeds = answers.rssFeeds.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      const newConfig = {
        ...currentConfig,
        imageDir: answers.imageDir,
        contentDir: answers.contentDir,
        maxImageWidth: answers.maxImageWidth,
        rssFeeds
      };
      
      await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
      
      console.log(chalk.green('✅ Configuration saved!'));
      console.log(chalk.blue(`📁 Config file: ${configPath}`));
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Status and statistics
program
  .command('stats')
  .description('Show processing statistics')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 Article Processing Statistics\n'));
      
      // Count articles by language
      const enDir = 'src/content/articles/en';
      const frDir = 'src/content/articles/fr';
      
      let enCount = 0;
      let frCount = 0;
      
      try {
        const enDirs = await fs.readdir(enDir);
        enCount = enDirs.length;
      } catch (error) {
        // Directory doesn't exist
      }
      
      try {
        const frDirs = await fs.readdir(frDir);
        frCount = frDirs.length;
      } catch (error) {
        // Directory doesn't exist
      }
      
      console.log(`📝 English articles: ${chalk.green(enCount)}`);
      console.log(`📝 French articles: ${chalk.green(frCount)}`);
      console.log(`📝 Total articles: ${chalk.green(enCount + frCount)}`);
      
      // Check image storage
      try {
        const imageStats = await fs.stat('src/images/articles');
        console.log(`🖼️  Image directory size: ${chalk.blue(formatBytes(imageStats.size))}`);
      } catch (error) {
        console.log(`🖼️  Image directory: ${chalk.yellow('Not found')}`);
      }
      
      // Check configuration
      try {
        await fs.access('./article-processor-config.mjson');
        console.log(`⚙️  Configuration: ${chalk.green('Found')}`);
      } catch (error) {
        console.log(`⚙️  Configuration: ${chalk.yellow('Not configured - run "npm run article config"')}`);
      }
      
      // Check Ollama status
      try {
        const { OllamaAI } = await import('./ollama-ai.mjs');
        const ollama = new OllamaAI();
        const status = await ollama.checkOllamaStatus();
        if (status.running) {
          console.log(`🦙 Ollama: ${chalk.green('Running')} (${status.models.length} models)`);
        } else {
          console.log(`🦙 Ollama: ${chalk.yellow('Not running')}`);
        }
      } catch (error) {
        console.log(`🦙 Ollama: ${chalk.red('Error checking status')}`);
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Interactive mode')
  .action(async () => {
    console.log(chalk.blue(`
╔═══════════════════════════════════════╗
║     Article Processing System         ║
║         Interactive Mode              ║
╚═══════════════════════════════════════╝
    `));
    
    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '📝 Add single article', value: 'add' },
            { name: '📚 Batch process articles', value: 'batch' },
            { name: '📡 Check RSS feeds', value: 'rss' },
            { name: '⚙️  Configure system', value: 'config' },
            { name: '📊 View statistics', value: 'stats' },
            { name: '🚪 Exit', value: 'exit' }
          ]
        }
      ]);
      
      if (action === 'exit') {
        console.log(chalk.blue('Goodbye! 👋'));
        break;
      }
      
      try {
        switch (action) {
          case 'add':
            const { url, lang } = await inquirer.prompt([
              {
                type: 'input',
                name: 'url',
                message: 'Enter article URL:',
                validate: (input) => {
                  if (!input.trim()) return 'URL cannot be empty';
                  try {
                    new URL(input);
                    return true;
                  } catch {
                    return 'Please enter a valid URL';
                  }
                }
              },
              {
                type: 'list',
                name: 'lang',
                message: 'Language:',
                choices: [
                  { name: 'English', value: 'en' },
                  { name: 'French', value: 'fr' }
                ]
              }
            ]);
            
            await processor.processArticle(url, lang, true);
            break;
            
          case 'batch':
            const { urls } = await inquirer.prompt([
              {
                type: 'editor',
                name: 'urls',
                message: 'Enter URLs (one per line):',
                default: '# Enter URLs below, one per line\n# Lines starting with # are ignored\n\n'
              }
            ]);
            
            const urlList = urls.split('\n')
              .map(line => line.trim())
              .filter(line => line && !line.startsWith('#'));
            
            if (urlList.length > 0) {
              const { batchLang } = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'batchLang',
                  message: 'Language for all articles:',
                  choices: [
                    { name: 'English', value: 'en' },
                    { name: 'French', value: 'fr' }
                  ]
                }
              ]);
              
              await processor.batchProcess(urlList, batchLang);
            } else {
              console.log(chalk.yellow('No URLs provided.'));
            }
            break;
            
          case 'rss':
            const { rssAction } = await inquirer.prompt([
              {
                type: 'list',
                name: 'rssAction',
                message: 'RSS Feed Options:',
                choices: [
                  { name: '📰 Show all recent articles', value: 'all' },
                  { name: '🌍 Environment articles only', value: 'environment' },
                  { name: '🔬 Science articles only', value: 'science' },
                  { name: '🦆 Wildlife articles only', value: 'wildlife' },
                  { name: '🇫🇷 French articles only', value: 'french' },
                  { name: '😊 Positive news only', value: 'positive' },
                  { name: '📊 Show detailed statistics', value: 'stats' }
                ]
              }
            ]);
            
            console.log(chalk.blue('🔍 Checking RSS feeds with advanced filtering...'));
            
            let rssArticles;
            if (rssAction === 'all') {
              rssArticles = await processor.monitorRSSFeeds();
            } else if (rssAction === 'stats') {
              rssArticles = await processor.monitorRSSFeeds();
              // Show detailed statistics
              const categoryStats = rssArticles.reduce((acc, article) => {
                acc[article.category] = acc[article.category] || { count: 0, avgScore: 0, totalScore: 0 };
                acc[article.category].count++;
                acc[article.category].totalScore += article.relevanceScore;
                acc[article.category].avgScore = acc[article.category].totalScore / acc[article.category].count;
                return acc;
              }, {});
              
              console.log(chalk.blue('\n📊 Detailed RSS Statistics:'));
              console.log(chalk.green(`Total articles found: ${rssArticles.length}`));
              console.log(chalk.blue('\nBy Category:'));
              
              Object.entries(categoryStats)
                .sort(([,a], [,b]) => b.count - a.count)
                .forEach(([category, stats]) => {
                  console.log(`   ${category}: ${stats.count} articles (avg relevance: ${stats.avgScore.toFixed(1)})`);
                });
              
              const highRelevance = rssArticles.filter(a => a.relevanceScore >= 5).length;
              const mediumRelevance = rssArticles.filter(a => a.relevanceScore >= 2 && a.relevanceScore < 5).length;
              const lowRelevance = rssArticles.filter(a => a.relevanceScore < 2).length;
              
              console.log(chalk.blue('\nBy Relevance:'));
              console.log(`   High (⭐⭐⭐): ${highRelevance} articles`);
              console.log(`   Medium (⭐⭐): ${mediumRelevance} articles`);
              console.log(`   Low (⭐): ${lowRelevance} articles`);
              
              break;
            } else {
              rssArticles = await processor.getArticlesByCategory(rssAction);
            }
            
            if (rssAction !== 'stats') {
              if (rssArticles.length === 0) {
                console.log(chalk.yellow('No relevant articles found.'));
              } else {
                console.log(chalk.green(`\n📰 Found ${rssArticles.length} relevant articles:`));
                
                rssArticles.slice(0, 12).forEach((article, index) => {
                  const relevanceIndicator = article.relevanceScore > 5 ? '⭐⭐⭐' : 
                                            article.relevanceScore > 2 ? '⭐⭐' : 
                                            article.relevanceScore > 0 ? '⭐' : '';
                  
                  console.log(`${index + 1}. ${chalk.blue(article.title)} ${relevanceIndicator}`);
                  console.log(`   Source: ${article.source} | Category: ${chalk.cyan(article.category)}`);
                  console.log(`   Date: ${new Date(article.pubDate).toLocaleDateString()}`);
                  console.log();
                });
                
                if (rssArticles.length > 12) {
                  console.log(chalk.gray(`... and ${rssArticles.length - 12} more articles`));
                }
                
                // Ask if they want to process any
                const { processRss } = await inquirer.prompt([
                  {
                    type: 'confirm',
                    name: 'processRss',
                    message: 'Would you like to select articles to process?',
                    default: false
                  }
                ]);
                
                if (processRss) {
                  const selection = await inquirer.prompt([
                    {
                      type: 'checkbox',
                      name: 'selectedArticles',
                      message: 'Select articles to process (⭐ = relevance):',
                      choices: rssArticles.slice(0, 15).map((article, index) => {
                        const relevanceIndicator = article.relevanceScore > 5 ? '⭐⭐⭐' : 
                                                  article.relevanceScore > 2 ? '⭐⭐' : 
                                                  article.relevanceScore > 0 ? '⭐' : '';
                        
                        return {
                          name: `${article.title} ${relevanceIndicator}`,
                          value: index,
                          short: article.title
                        };
                      }),
                      pageSize: 10
                    }
                  ]);
                  
                  if (selection.selectedArticles.length > 0) {
                    const { rssLang } = await inquirer.prompt([
                      {
                        type: 'list',
                        name: 'rssLang',
                        message: 'Language for selected articles:',
                        choices: [
                          { name: 'English', value: 'en' },
                          { name: 'French', value: 'fr' }
                        ]
                      }
                    ]);
                    
                    const selectedUrls = selection.selectedArticles.map(index => rssArticles[index].url);
                    await processor.batchProcess(selectedUrls, rssLang);
                  }
                }
              }
            }
            break;
            
          case 'config':
            // Inline config to avoid command conflicts
            const configPath = './article-processor-config.mjson';
            let currentConfig = {};
            
            try {
              const configFile = await fs.readFile(configPath, 'utf8');
              currentConfig = JSON.parse(configFile);
            } catch (error) {
              // Config file doesn't exist, use defaults
            }
            
            console.log(chalk.blue('🔧 Configuration'));
            
            const configAnswers = await inquirer.prompt([
              {
                type: 'input',
                name: 'imageDir',
                message: 'Image directory:',
                default: currentConfig.imageDir || 'src/images/articles'
              },
              {
                type: 'input',
                name: 'contentDir',
                message: 'Content directory:',
                default: currentConfig.contentDir || 'src/content/articles'
              },
              {
                type: 'number',
                name: 'maxImageWidth',
                message: 'Maximum image width:',
                default: currentConfig.maxImageWidth || 1200
              },
              {
                type: 'editor',
                name: 'rssFeeds',
                message: 'RSS feeds (one per line):',
                default: (currentConfig.rssFeeds || [
                  'https://www.theguardian.com/environment/rss',
                  'https://www.sciencedaily.com/rss/earth_climate/environmental_science.xml'
                ]).join('\n')
              }
            ]);
            
            // Process RSS feeds
            const rssFeeds = configAnswers.rssFeeds.split('\n')
              .map(line => line.trim())
              .filter(line => line && !line.startsWith('#'));
            
            const newConfig = {
              ...currentConfig,
              imageDir: configAnswers.imageDir,
              contentDir: configAnswers.contentDir,
              maxImageWidth: configAnswers.maxImageWidth,
              rssFeeds
            };
            
            await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
            
            console.log(chalk.green('✅ Configuration saved!'));
            console.log(chalk.blue(`📁 Config file: ${configPath}`));
            break;
            
          case 'stats':
            // Inline stats to avoid command conflicts
            console.log(chalk.blue('📊 Article Processing Statistics\n'));
            
            // Count articles by language
            const enDir = 'src/content/articles/en';
            const frDir = 'src/content/articles/fr';
            
            let enCount = 0;
            let frCount = 0;
            
            try {
              const enDirs = await fs.readdir(enDir);
              enCount = enDirs.length;
            } catch (error) {
              // Directory doesn't exist
            }
            
            try {
              const frDirs = await fs.readdir(frDir);
              frCount = frDirs.length;
            } catch (error) {
              // Directory doesn't exist
            }
            
            console.log(`📝 English articles: ${chalk.green(enCount)}`);
            console.log(`📝 French articles: ${chalk.green(frCount)}`);
            console.log(`📝 Total articles: ${chalk.green(enCount + frCount)}`);
            
            // Check image storage
            try {
              const imageStats = await fs.stat('src/images/articles');
              console.log(`🖼️  Image directory size: ${chalk.blue(formatBytes(imageStats.size))}`);
            } catch (error) {
              console.log(`🖼️  Image directory: ${chalk.yellow('Not found')}`);
            }
            
            // Check configuration
            try {
              await fs.access('./article-processor-config.mjson');
              console.log(`⚙️  Configuration: ${chalk.green('Found')}`);
            } catch (error) {
              console.log(`⚙️  Configuration: ${chalk.yellow('Not configured')}`);
            }
            
            // Check Ollama status
            try {
              const { OllamaAI } = await import('./ollama-ai.mjs');
              const ollama = new OllamaAI();
              const status = await ollama.checkOllamaStatus();
              if (status.running) {
                console.log(`🦙 Ollama: ${chalk.green('Running')} (${status.models.length} models)`);
              } else {
                console.log(`🦙 Ollama: ${chalk.yellow('Not running')}`);
              }
            } catch (error) {
              console.log(`🦙 Ollama: ${chalk.red('Error checking status')}`);
            }
            break;
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
      
      console.log(); // Add spacing
    }
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
