#!/bin/bash

# Script de test pour la déduction automatique du stock N8N
# Test la création de nouvelles factures et la déduction automatique

echo "🧪 SCRIPT DE TEST - Déduction automatique du stock N8N"
echo "=================================================="

cd "$(dirname "$0")/mon-projet-vite"

echo ""
echo "📋 1. Affichage du stock actuel..."
echo ""

# Créer un petit script Node.js pour tester
cat > test-stock-deduction.cjs << 'EOF'
// Test du système de déduction automatique du stock
const fs = require('fs');
const path = require('path');

console.log('🧪 Test du système de déduction automatique du stock N8N\n');

// Vérifier si localStorage est simulé dans le répertoire
const stockFile = './localStorage-simulation.json';

// Lire le stock actuel s'il existe
let currentData = {};
try {
  if (fs.existsSync(stockFile)) {
    currentData = JSON.parse(fs.readFileSync(stockFile, 'utf8'));
  }
} catch (error) {
  console.log('📂 Aucun fichier de stock existant, création...\n');
}

// Stock par défaut si vide
if (!currentData.physicalStock) {
  currentData.physicalStock = [
    {
      productName: 'Matelas Memory Foam 160x200',
      category: 'Matelas',
      currentStock: 5,
      reservedStock: 0,
      availableStock: 5,
      lastUpdated: new Date().toISOString(),
      minStockAlert: 2
    },
    {
      productName: 'Oreiller ergonomique',
      category: 'Oreillers',
      currentStock: 20,
      reservedStock: 0,
      availableStock: 20,
      lastUpdated: new Date().toISOString(),
      minStockAlert: 10
    },
    {
      productName: 'Pack 2 oreillers confort',
      category: 'Oreillers',
      currentStock: 15,
      reservedStock: 0,
      availableStock: 15,
      lastUpdated: new Date().toISOString(),
      minStockAlert: 5
    },
    {
      productName: 'Couette 4 saisons 220x240',
      category: 'Couettes',
      currentStock: 10,
      reservedStock: 0,
      availableStock: 10,
      lastUpdated: new Date().toISOString(),
      minStockAlert: 5
    }
  ];
}

console.log('📦 STOCK AVANT SIMULATION:');
console.log('===========================');
currentData.physicalStock.forEach(item => {
  console.log(`${item.productName} (${item.category}): ${item.currentStock} unités`);
});

// Simuler l'arrivée d'une nouvelle facture N8N
console.log('\n🆕 SIMULATION: Nouvelle facture N8N reçue');
console.log('==========================================');

const newInvoice = {
  id: 'test-invoice-' + Date.now(),
  number: 'FAC-TEST-2025-001',
  clientName: 'Client Test',
  items: [
    {
      productName: 'Matelas Memory Foam 160x200',
      category: 'Matelas',
      quantity: 1
    },
    {
      productName: 'Pack 2 oreillers confort',
      category: 'Oreillers',
      quantity: 2  // 2 packs = 4 oreillers au total
    },
    {
      productName: 'Couette 4 saisons 220x240',
      category: 'Couettes',
      quantity: 1
    }
  ]
};

console.log(`Facture: ${newInvoice.number}`);
console.log(`Client: ${newInvoice.clientName}`);
console.log(`Produits à déduire:`);
newInvoice.items.forEach(item => {
  console.log(`  - ${item.productName}: ${item.quantity} unité(s)`);
});

// Appliquer les déductions
console.log('\n📉 DÉDUCTION DU STOCK:');
console.log('======================');

if (!currentData.stockMovements) {
  currentData.stockMovements = [];
}

newInvoice.items.forEach(item => {
  const stockIndex = currentData.physicalStock.findIndex(stock => 
    stock.productName === item.productName && stock.category === item.category
  );
  
  if (stockIndex !== -1) {
    const stockItem = currentData.physicalStock[stockIndex];
    const previousStock = stockItem.currentStock;
    const newStock = Math.max(0, stockItem.currentStock - item.quantity);
    const actualDeduction = stockItem.currentStock - newStock;
    
    stockItem.currentStock = newStock;
    stockItem.availableStock = Math.max(0, newStock - stockItem.reservedStock);
    stockItem.lastUpdated = new Date().toISOString();
    
    // Enregistrer le mouvement
    const movement = {
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      productName: item.productName,
      category: item.category,
      movementType: 'deduction',
      quantity: actualDeduction,
      reason: `Facture N8N ${newInvoice.number} - Client: ${newInvoice.clientName}`,
      invoiceNumber: newInvoice.number,
      previousStock,
      newStock,
      timestamp: new Date().toISOString()
    };
    currentData.stockMovements.push(movement);
    
    console.log(`✅ ${item.productName}: ${previousStock} → ${newStock} (-${actualDeduction})`);
    
    if (newStock <= stockItem.minStockAlert) {
      console.log(`🚨 ALERTE: ${item.productName} - Stock faible (${newStock} ≤ ${stockItem.minStockAlert})`);
    }
  } else {
    console.log(`❌ Produit non trouvé: ${item.productName} (${item.category})`);
  }
});

console.log('\n📦 STOCK APRÈS DÉDUCTION:');
console.log('==========================');
currentData.physicalStock.forEach(item => {
  const status = item.currentStock <= item.minStockAlert ? ' 🚨' : 
                 item.currentStock <= item.minStockAlert * 2 ? ' ⚠️' : ' ✅';
  console.log(`${item.productName} (${item.category}): ${item.currentStock} unités${status}`);
});

// Marquer la facture comme traitée
if (!currentData.processedInvoicesIds) {
  currentData.processedInvoicesIds = [];
}
currentData.processedInvoicesIds.push(newInvoice.id);

// Sauvegarder
fs.writeFileSync(stockFile, JSON.stringify(currentData, null, 2));

console.log('\n✅ SIMULATION TERMINÉE');
console.log('======================');
console.log('📁 Données sauvegardées dans localStorage-simulation.json');
console.log('🔍 Vérifiez l\'interface pour voir les changements');
console.log('🔄 L\'application détectera automatiquement les nouvelles factures N8N');

EOF

echo "Exécution du test de déduction automatique..."
node test-stock-deduction.cjs

echo ""
echo "📁 Fichier de simulation créé: localStorage-simulation.json"
echo ""

if [ -f "localStorage-simulation.json" ]; then
    echo "📊 Contenu du stock après test:"
    echo "================================"
    # Afficher les informations importantes du stock
    node -e "
        const data = JSON.parse(require('fs').readFileSync('localStorage-simulation.json', 'utf8'));
        console.log('Stock physique:');
        data.physicalStock.forEach(item => {
            const status = item.currentStock <= item.minStockAlert ? ' 🚨 CRITIQUE' : 
                          item.currentStock <= item.minStockAlert * 2 ? ' ⚠️ FAIBLE' : ' ✅ OK';
            console.log(\`  \${item.productName}: \${item.currentStock} unités\${status}\`);
        });
        console.log();
        console.log('Derniers mouvements:');
        const movements = data.stockMovements.slice(-3);
        movements.forEach(mov => {
            console.log(\`  \${mov.productName}: -\${mov.quantity} (\${mov.reason})\`);
        });
    "
fi

echo ""
echo "🚀 INSTRUCTIONS:"
echo "=================="
echo "1. Démarrez l'application: npm run dev"
echo "2. Allez dans l'onglet 'Stock' > 'Stock physique'"
echo "3. Vérifiez que les déductions sont visibles"
echo "4. Testez avec de vraies factures N8N"
echo ""
echo "💡 Le système déduira automatiquement le stock à chaque nouvelle facture N8N"

# Nettoyer
rm -f test-stock-deduction.cjs

echo "✅ Test terminé!"
