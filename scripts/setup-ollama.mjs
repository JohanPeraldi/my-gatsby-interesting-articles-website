#!/usr/bin/env node

// @ts-nocheck

// Script to set up and configure Ollama for article processing

import { OllamaAI, OllamaConfig } from './ollama-ai.mjs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { promises as fs } from 'fs';

async function setupOllama() {
    console.log(chalk.blue(`
╔═══════════════════════════════════════╗
║         Ollama Setup for              ║
║      Article Processing System        ║
╚═══════════════════════════════════════╝
    `));
    
    // Step 1: Check if Ollama is running
    console.log(chalk.blue('🔍 Checking Ollama status...'));
    
    const ollama = new OllamaAI();
    const status = await ollama.checkOllamaStatus();
    
    if (!status.running) {
        console.log(chalk.red('❌ Ollama is not running!'));
        console.log(chalk.yellow(`
Please start Ollama first:

1. Open a new terminal
2. Run: ollama serve
3. Keep that terminal open
4. Come back here and run this setup again
        `));
        process.exit(1);
    }
    
    console.log(chalk.green('✅ Ollama is running'));
    
    // Step 2: Show available models
    if (status.models.length === 0) {
        console.log(chalk.yellow('⚠️  No models found. Let\'s download one!'));
        
        const { downloadModel } = await inquirer.prompt([
            {
                type: 'list',
                name: 'downloadModel',
                message: 'Which model would you like to download?',
                choices: [
                    { 
                        name: 'llama3.2:3b (Fastest, ~2GB, recommended)', 
                        value: 'llama3.2:3b' 
                    },
                    { 
                        name: 'mistral:7b (Balanced, ~4GB)', 
                        value: 'mistral:7b' 
                    },
                    { 
                        name: 'llama3.1:8b (Most accurate, ~5GB)', 
                        value: 'llama3.1:8b' 
                    }
                ]
            }
        ]);
        
        console.log(chalk.blue(`📥 Downloading ${downloadModel}... This may take a few minutes.`));
        const success = await ollama.downloadModel(downloadModel);
        
        if (!success) {
            console.log(chalk.red('❌ Failed to download model. Exiting.'));
            process.exit(1);
        }
        
        // Update status
        const newStatus = await ollama.checkOllamaStatus();
        status.models = newStatus.models;
    }
    
    console.log(chalk.blue(`📚 Available models: ${status.models.join(', ')}`));
    
    // Step 3: Configure model selection
    const config = await OllamaConfig.configure();
    
    if (!config) {
        console.log(chalk.red('❌ Configuration failed'));
        process.exit(1);
    }
    
    // Step 4: Test the configuration
    console.log(chalk.blue('🧪 Testing configuration...'));
    
    const testOllama = new OllamaAI(config);
    const testArticle = {
        title: 'Scientists discover new species of bird in Amazon rainforest',
        siteName: 'Nature News',
        excerpt: 'Researchers have identified a previously unknown species of songbird in the Amazon rainforest, highlighting the region\'s incredible biodiversity.'
    };
    
    try {
        const testResult = await testOllama.analyzeArticle(testArticle);
        console.log(chalk.green('✅ Test successful!'));
        console.log(chalk.gray(`   Category: ${testResult.category}`));
        console.log(chalk.gray(`   Tags: ${testResult.existingTags.join(', ')}`));
        console.log(chalk.gray(`   Confidence: ${testResult.confidence}/10`));
    } catch (error) {
        console.log(chalk.red(`❌ Test failed: ${error.message}`));
        process.exit(1);
    }
    
    // Step 5: Save configuration
    const configPath = './article-processor-config.mjson';
    let existingConfig = {};
    
    try {
        const configFile = await fs.readFile(configPath, 'utf8');
        existingConfig = JSON.parse(configFile);
    } catch (error) {
        // Config file doesn't exist, that's fine
    }
    
    existingConfig.ai = {
        mode: 'ollama',
        ollama: config
    };
    
    await fs.writeFile(configPath, JSON.stringify(existingConfig, null, 2));
    
    // Step 6: Update environment variables
    const envPath = '.env';
    let envContent = '';
    
    try {
        envContent = await fs.readFile(envPath, 'utf8');
    } catch (error) {
        // .env doesn't exist, create it
    }
    
    // Remove old AI config
    const envLines = envContent.split('\n').filter(line => 
        !line.startsWith('USE_OLLAMA=') && 
        !line.startsWith('OPENAI_API_KEY=')
    );
    
    envLines.push('USE_OLLAMA=true');
    
    await fs.writeFile(envPath, envLines.join('\n'));
    
    console.log(chalk.green(`
✅ Ollama setup complete!

Configuration saved to: ${configPath}
Environment updated: ${envPath}

You can now use the article processor with:
  npm run article:add
  npm run article:batch
  npm run article:interactive

Model: ${config.model}
Timeout: ${config.timeout/1000}s
    `));
    
    // Step 7: Offer to run a live test
    const { runLiveTest } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'runLiveTest',
            message: 'Would you like to test with a real article URL?',
            default: false
        }
    ]);
    
    if (runLiveTest) {
        const { testUrl } = await inquirer.prompt([
            {
                type: 'input',
                name: 'testUrl',
                message: 'Enter an article URL to test:',
                validate: (input) => {
                    try {
                        new URL(input);
                        return true;
                    } catch {
                        return 'Please enter a valid URL';
                    }
                }
            }
        ]);
        
        console.log(chalk.blue('\n🚀 Running live test...'));
        
        const { default: ComprehensiveArticleProcessor } = await import('./article-processor.mjs');
        const processor = new ComprehensiveArticleProcessor();
        
        try {
            await processor.processArticle(testUrl, 'en', true);
            console.log(chalk.green('✅ Live test successful!'));
        } catch (error) {
            console.log(chalk.red(`❌ Live test failed: ${error.message}`));
        }
    }
    
    console.log(chalk.blue('\n🎉 Setup complete! Happy article processing!'));
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupOllama().catch(error => {
        console.error(chalk.red('Setup failed:'), error);
        process.exit(1);
    });
}

export default setupOllama;
