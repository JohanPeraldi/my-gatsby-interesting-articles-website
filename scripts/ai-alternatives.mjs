#!/usr/bin/env node

// @ts-nocheck

// Free AI alternatives - no API key required

class FreeAIAnalyzer {
    constructor() {
        // Keywords for different categories
        this.categoryKeywords = {
            conservation: ['conservation', 'preserve', 'protect', 'save', 'restore', 'sanctuary', 'reserve', 'habitat', 'endangered', 'recovery'],
            ecology: ['ecosystem', 'ecological', 'biodiversity', 'species', 'population', 'community', 'food chain', 'pollination', 'symbiosis'],
            environment: ['environment', 'environmental', 'climate', 'pollution', 'sustainable', 'renewable', 'green', 'carbon', 'emissions'],
            science: ['research', 'study', 'discovery', 'findings', 'scientists', 'researchers', 'analysis', 'experiment', 'data'],
            wildlife: ['wildlife', 'animals', 'birds', 'mammals', 'species', 'fauna', 'wild', 'natural', 'behavior', 'migration'],
            nature: ['nature', 'natural', 'forest', 'ocean', 'plants', 'trees', 'flowers', 'wilderness', 'landscape']
        };

        this.tagKeywords = {
            animals: ['animal', 'creature', 'beast', 'wildlife', 'fauna'],
            birds: ['bird', 'avian', 'feather', 'wing', 'flight', 'nest', 'song'],
            climate: ['climate', 'weather', 'temperature', 'warming', 'cooling'],
            plants: ['plant', 'vegetation', 'flora', 'flower', 'tree', 'forest'],
            marine: ['ocean', 'sea', 'marine', 'aquatic', 'fish', 'coral'],
            insects: ['insect', 'bug', 'bee', 'butterfly', 'ant', 'beetle'],
            // Add more as needed
        };
    }

    analyzeContent(title, excerpt, content = '') {
        const text = `${title} ${excerpt} ${content}`.toLowerCase();
        
        // Analyze category
        const categoryScores = {};
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            categoryScores[category] = this.calculateScore(text, keywords);
        }
        
        const bestCategory = Object.keys(categoryScores).reduce((a, b) => 
            categoryScores[a] > categoryScores[b] ? a : b
        );

        // Analyze tags
        const tagScores = {};
        for (const [tag, keywords] of Object.entries(this.tagKeywords)) {
            tagScores[tag] = this.calculateScore(text, keywords);
        }
        
        const suggestedTags = Object.entries(tagScores)
            .filter(([tag, score]) => score > 0)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag);

        // Calculate confidence based on keyword matches
        const confidence = Math.min(10, Math.max(1, 
            Math.round((categoryScores[bestCategory] + suggestedTags.length) / 2)
        ));

        return {
            category: bestCategory,
            existingTags: suggestedTags,
            suggestedNewTags: this.extractNewTags(text),
            confidence,
            reasoning: `Based on keyword analysis: "${bestCategory}" category with ${suggestedTags.length} relevant tags`
        };
    }

    calculateScore(text, keywords) {
        return keywords.reduce((score, keyword) => {
            const regex = new RegExp(keyword, 'gi');
            const matches = text.match(regex);
            return score + (matches ? matches.length : 0);
        }, 0);
    }

    extractNewTags(text) {
        // Simple approach: look for scientific names, proper nouns, etc.
        const scientificNames = text.match(/[A-Z][a-z]+ [a-z]+/g) || [];
        const locations = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
        
        return [...new Set([...scientificNames, ...locations])]
            .filter(term => term.length > 3 && term.length < 20)
            .slice(0, 3);
    }
}

export { FreeAIAnalyzer };
