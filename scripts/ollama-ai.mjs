#!/usr/bin/env node

// @ts-nocheck

// Enhanced Ollama integration for article processing

import fetch from 'node-fetch';
import chalk from 'chalk';
import inquirer from 'inquirer';

class OllamaAI {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:11434';
        this.model = options.model || 'llama3.2:3b'; // Default model
        this.timeout = options.timeout || 30000; // 30 seconds
        
        // Available categories and tags from your system
        this.categories = [
            'conservation', 'ecology', 'environment', 'handicap', 
            'nature', 'science', 'wildlife'
        ];
        
        this.availableTags = [
            'animals', 'antarctica', 'archaeology', 'art', 'biodiversity', 
            'bird conservation', 'birds', 'cave', 'chimpanzees', 'climate', 
            'climate change', 'duck', 'eating habits', 'equitherapy', 'fish', 
            'flowers', 'global warming', 'gorillas', 'hawks', 'homo sapiens', 
            'horses', 'hunting', 'insects', 'luberon', 'marine life', 
            'mental health', 'moss', 'ornithotherapy', 'paleoacoustics', 
            'paleolithic', 'penguins', 'plants', 'positive news', 'prehistory', 
            'silence', 'social behaviour', 'sustainability', 'tulips', 
            'unusual', 'well-being', 'wildlife'
        ];
    }
    
    async checkOllamaStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                timeout: 5000
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.mjson();
            const availableModels = data.models.map(m => m.name);
            
            return {
                running: true,
                models: availableModels,
                hasPreferredModel: availableModels.includes(this.model)
            };
        } catch (error) {
            return {
                running: false,
                error: error.message
            };
        }
    }
    
    async analyzeArticle(articleData) {
        console.log(chalk.blue(`🦙 Analyzing with Ollama (${this.model})...`));
        
        // Check if Ollama is running
        const status = await this.checkOllamaStatus();
        if (!status.running) {
            throw new Error(`Ollama not running: ${status.error}`);
        }
        
        if (!status.hasPreferredModel) {
            console.log(chalk.yellow(`⚠️  Model ${this.model} not found. Available: ${status.models.join(', ')}`));
            // Use the first available model
            this.model = status.models[0];
        }
        
        const prompt = this.buildPrompt(articleData);
        
        try {
            const response = await this.callOllama(prompt);
            const analysis = this.parseResponse(response);
            
            console.log(chalk.green(`✅ Ollama analysis complete (confidence: ${analysis.confidence}/10)`));
            return analysis;
            
        } catch (error) {
            console.log(chalk.red(`❌ Ollama analysis failed: ${error.message}`));
            throw error;
        }
    }
    
    buildPrompt(articleData) {
        return `You are an expert at categorizing positive news articles about science, nature, and environment.

ARTICLE TO ANALYZE:
Title: ${articleData.title}
Source: ${articleData.siteName}
Excerpt: ${articleData.excerpt}

TASK:
1. Choose the BEST category from: ${this.categories.join(', ')}
2. Select 3-5 relevant tags from: ${this.availableTags.join(', ')}
3. If needed, suggest 1-2 NEW tags that aren't in the list
4. Rate your confidence (1-10)

RESPOND WITH VALID JSON ONLY:
{
  "category": "science",
  "existingTags": ["animals", "research", "wildlife"],
  "suggestedNewTags": ["behavioral-study"],
  "confidence": 8,
  "reasoning": "Article about animal behavior research"
}

JSON Response:`;
    }
    
    async callOllama(prompt) {
        const requestBody = {
            model: this.model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.3,
                top_p: 0.9,
                top_k: 40,
                num_predict: 200 // Limit response length
            }
        };
        
        console.log(chalk.gray(`  Using model: ${this.model}`));
        
        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            timeout: this.timeout
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.mjson();
        return data.response;
    }
    
    parseResponse(response) {
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate the response structure
            if (!parsed.category || !this.categories.includes(parsed.category)) {
                parsed.category = 'science'; // Default fallback
            }
            
            if (!Array.isArray(parsed.existingTags)) {
                parsed.existingTags = [];
            }
            
            if (!Array.isArray(parsed.suggestedNewTags)) {
                parsed.suggestedNewTags = [];
            }
            
            // Validate tags exist in our list
            parsed.existingTags = parsed.existingTags.filter(tag => 
                this.availableTags.includes(tag)
            );
            
            // Ensure confidence is a number between 1-10
            if (typeof parsed.confidence !== 'number' || parsed.confidence < 1 || parsed.confidence > 10) {
                parsed.confidence = 7; // Default confidence
            }
            
            if (!parsed.reasoning) {
                parsed.reasoning = 'Categorized using Ollama AI analysis';
            }
            
            return parsed;
            
        } catch (error) {
            console.log(chalk.yellow(`⚠️  Failed to parse Ollama response, using fallback`));
            console.log(chalk.gray(`Response was: ${response.substring(0, 200)}...`));
            
            // Fallback analysis
            return this.fallbackAnalysis(response);
        }
    }
    
    fallbackAnalysis(response) {
        // Simple keyword-based fallback if JSON parsing fails
        const text = response.toLowerCase();
        
        // Find best category
        let bestCategory = 'science';
        let maxScore = 0;
        
        for (const category of this.categories) {
            const score = (text.match(new RegExp(category, 'g')) || []).length;
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        }
        
        // Find relevant tags
        const relevantTags = this.availableTags.filter(tag => 
            text.includes(tag.toLowerCase())
        ).slice(0, 3);
        
        return {
            category: bestCategory,
            existingTags: relevantTags,
            suggestedNewTags: [],
            confidence: 5,
            reasoning: 'Fallback analysis - Ollama response parsing failed'
        };
    }
    
    // Helper method to get available models
    async getAvailableModels() {
        const status = await this.checkOllamaStatus();
        return status.running ? status.models : [];
    }
    
    // Helper method to download a model
    async downloadModel(modelName) {
        console.log(chalk.blue(`📥 Downloading model: ${modelName}`));
        
        try {
            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: modelName,
                    stream: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to download model: ${response.statusText}`);
            }
            
            console.log(chalk.green(`✅ Model ${modelName} downloaded successfully`));
            return true;
            
        } catch (error) {
            console.log(chalk.red(`❌ Failed to download model: ${error.message}`));
            return false;
        }
    }
}

// Configuration helper for Ollama
class OllamaConfig {
    static async configure() {
        const ollama = new OllamaAI();
        const status = await ollama.checkOllamaStatus();
        
        if (!status.running) {
            console.log(chalk.red('❌ Ollama is not running!'));
            console.log(chalk.blue('Please start Ollama with: ollama serve'));
            return null;
        }
        
        console.log(chalk.green('✅ Ollama is running'));
        console.log(chalk.blue(`Available models: ${status.models.join(', ')}`));
        
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'model',
                message: 'Choose model for article analysis:',
                choices: [
                    ...status.models.map(model => ({ name: model, value: model })),
                    { name: 'Download a new model', value: 'download' }
                ]
            },
            {
                type: 'list',
                name: 'newModel',
                message: 'Which model to download?',
                when: (answers) => answers.model === 'download',
                choices: [
                    { name: 'llama3.2:3b (Fastest, 2GB)', value: 'llama3.2:3b' },
                    { name: 'mistral:7b (Balanced, 4GB)', value: 'mistral:7b' },
                    { name: 'llama3.1:8b (Most accurate, 5GB)', value: 'llama3.1:8b' }
                ]
            },
            {
                type: 'number',
                name: 'timeout',
                message: 'Analysis timeout (seconds):',
                default: 30,
                validate: (input) => input > 0 && input <= 120
            }
        ]);
        
        if (answers.model === 'download') {
            const success = await ollama.downloadModel(answers.newModel);
            if (success) {
                answers.model = answers.newModel;
            } else {
                console.log(chalk.yellow('Using default model instead'));
                answers.model = status.models[0] || 'llama3.2:3b';
            }
        }
        
        return {
            model: answers.model,
            timeout: answers.timeout * 1000,
            baseUrl: 'http://localhost:11434'
        };
    }
}

export { OllamaAI, OllamaConfig };
