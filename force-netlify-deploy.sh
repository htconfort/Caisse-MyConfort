#!/bin/bash

# Script de force deploy pour Netlify
# Date: 29 août 2025

echo "🚀 Force Netlify Deploy Script"
echo "==============================="

# Navigation vers le projet
cd "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"

# Vérification Git
echo "📋 Git Status:"
git status

# Ajout des nouveaux fichiers
echo "➕ Adding files..."
git add netlify-deploy-trigger.md deploy-trigger.js netlify.toml

# Commit forcé
echo "💾 Committing changes..."
git commit -m "🚀 FORCE NETLIFY DEPLOY - A4 Print + Optimizations

✅ Features deployed:
- A4 Portrait print format for RAZ sheets  
- CSS print media queries optimized
- VS Code performance improvements
- Copilot optimizations

⏰ Deploy timestamp: $(date)
🔄 Force trigger: NETLIFY_DEPLOY_NOW"

# Push vers GitHub (qui trigger Netlify)
echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Deploy triggered! Check Netlify dashboard in 2-3 minutes."
