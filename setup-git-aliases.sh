#!/bin/bash

# 🛠️ # Aliases à ajouter
ALIASES="
# 🔄 === MYCONFORT GIT ALIASES (Auto-générés) ===
alias myconfort-save='cd \"$PROJECT_DIR\" && ./auto-git-save.sh'
alias mcs='cd \"$PROJECT_DIR\" && ./auto-git-save.sh'
alias quick-save='cd \"$PROJECT_DIR\" && ./quick-save.sh'
alias qs='cd \"$PROJECT_DIR\" && ./quick-save.sh'
alias watch-save='cd \"$PROJECT_DIR\" && ./auto-watch-save.sh'
alias ws='cd \"$PROJECT_DIR\" && ./auto-watch-save.sh'
alias ipad-sync='cd \"$PROJECT_DIR\" && ./ipad-sync.sh'
alias ips='cd \"$PROJECT_DIR\" && ./ipad-sync.sh'
alias watch-ipad='cd \"$PROJECT_DIR\" && ./watch-ipad.sh'
alias wip='cd \"$PROJECT_DIR\" && ./watch-ipad.sh'
alias full-sync='cd \"$PROJECT_DIR\" && ./full-sync.sh'
alias fs='cd \"$PROJECT_DIR\" && ./full-sync.sh'
alias myconfort-status='cd \"$PROJECT_DIR\" && git status'
alias mcstatus='cd \"$PROJECT_DIR\" && git status'
alias myconfort-log='cd \"$PROJECT_DIR\" && git log --oneline -10'
alias mclog='cd \"$PROJECT_DIR\" && git log --oneline -10'
alias myconfort-cd='cd \"$PROJECT_DIR\"'
alias mcd='cd \"$PROJECT_DIR\"'
# === FIN MYCONFORT ALIASES ==="S ALIAS GIT AUTOMATIQUES
# Ce script configure des raccourcis pratiques pour les sauvegardes

SHELL_RC="$HOME/.zshrc"
BACKUP_FILE="$HOME/.zshrc.backup.$(date +%Y%m%d_%H%M%S)"
PROJECT_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"

echo "🚀 === CONFIGURATION DES ALIAS GIT ==="
echo "📁 Projet: $PROJECT_DIR"
echo "🔧 Shell config: $SHELL_RC"

# Sauvegarde du fichier actuel
if [ -f "$SHELL_RC" ]; then
    cp "$SHELL_RC" "$BACKUP_FILE"
    echo "💾 Sauvegarde créée: $BACKUP_FILE"
fi

# Aliases à ajouter
ALIASES="
# 🔄 === MYCONFORT GIT ALIASES (Auto-générés) ===
alias myconfort-save='cd \"$PROJECT_DIR\" && ./auto-git-save.sh'
alias mcs='cd \"$PROJECT_DIR\" && ./auto-git-save.sh'
alias quick-save='cd \"$PROJECT_DIR\" && ./quick-save.sh'
alias qs='cd \"$PROJECT_DIR\" && ./quick-save.sh'
alias watch-save='cd \"$PROJECT_DIR\" && ./auto-watch-save.sh'
alias ws='cd \"$PROJECT_DIR\" && ./auto-watch-save.sh'
alias myconfort-status='cd \"$PROJECT_DIR\" && git status'
alias mcstatus='cd \"$PROJECT_DIR\" && git status'
alias myconfort-log='cd \"$PROJECT_DIR\" && git log --oneline -10'
alias mclog='cd \"$PROJECT_DIR\" && git log --oneline -10'
alias myconfort-cd='cd \"$PROJECT_DIR\"'
alias mcd='cd \"$PROJECT_DIR\"'
# === FIN MYCONFORT ALIASES ===
"

# Vérifier si les alias existent déjà
if grep -q "MYCONFORT GIT ALIASES" "$SHELL_RC" 2>/dev/null; then
    echo "⚠️  Les alias MyConfort existent déjà dans $SHELL_RC"
    echo "🔄 Mise à jour des alias..."
    
    # Supprimer les anciens alias
    sed -i '' '/# 🔄 === MYCONFORT GIT ALIASES/,/# === FIN MYCONFORT ALIASES ===/d' "$SHELL_RC"
fi

# Ajouter les nouveaux alias
echo "$ALIASES" >> "$SHELL_RC"

echo ""
echo "✅ === CONFIGURATION TERMINÉE ==="
echo ""
echo "🎯 NOUVEAUX ALIAS DISPONIBLES:"
echo "   mcs 'message'      → Sauvegarde complète avec message"
echo "   qs 'message'       → Sauvegarde rapide"
echo "   ips 'message'      → Synchronisation iPad (Git → Netlify)"
echo "   fs 'message'       → Synchronisation complète (Git + Netlify direct)"
echo "   ws                 → Surveillance automatique Git"
echo "   wip                → Surveillance automatique iPad"
echo "   mcstatus           → Statut Git du projet"
echo "   mclog              → Historique des commits"
echo "   mcd                → Aller dans le répertoire MyConfort"
echo ""
echo "🔄 POUR ACTIVER LES ALIAS:"
echo "   source ~/.zshrc"
echo "   OU redémarrez votre terminal"
echo ""
echo "📝 EXEMPLES D'UTILISATION:"
echo "   mcs \"FEATURE: Nouvelle fonctionnalité\""
echo "   qs \"Fix rapide\""
echo "   ips \"UPDATE: Modifications pour iPad\"  # → Visible sur iPad en 3min"
echo "   wip  # Lance la surveillance automatique iPad"
echo "   fs \"DEPLOY: Version complète\"  # → Git + Netlify direct"
echo ""

# Proposer d'activer immédiatement
read -p "🚀 Voulez-vous activer les alias maintenant? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    source "$SHELL_RC"
    echo "✅ Alias activés ! Vous pouvez maintenant utiliser: mcs, qs, ws, etc."
else
    echo "💡 N'oubliez pas de faire: source ~/.zshrc"
fi
