// Script pour compter les produits dans le catalogue MyConfort
const fs = require('fs');
const path = require('path');

// Lire le fichier App.tsx
const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
const content = fs.readFileSync(appTsxPath, 'utf8');

// Extraire le contenu du tableau productCatalog
const catalogStart = content.indexOf('const productCatalog: CatalogProduct[] = [');
const catalogEnd = content.indexOf('];', catalogStart) + 2;
const catalogContent = content.substring(catalogStart, catalogEnd);

// Compter les produits par catégorie
const categories = {
  'Matelas': 0,
  'Sur-matelas': 0,
  'Couettes': 0,
  'Oreillers': 0,
  'Plateau': 0,
  'Accessoires': 0
};

// Compter ligne par ligne
const lines = catalogContent.split('\n');
let totalProducts = 0;

lines.forEach(line => {
  if (line.trim().startsWith('{ category:')) {
    totalProducts++;
    Object.keys(categories).forEach(cat => {
      if (line.includes(`category: '${cat}'`)) {
        categories[cat]++;
      }
    });
  }
});

console.log('🔍 VERIFICATION DU CATALOGUE MyConfort');
console.log('=====================================');
console.log(`📊 TOTAL PRODUITS: ${totalProducts}`);
console.log('');
console.log('📋 DETAIL PAR CATEGORIE:');
Object.entries(categories).forEach(([category, count]) => {
  const target = {
    'Matelas': 10,
    'Sur-matelas': 9,
    'Couettes': 2,
    'Oreillers': 14,
    'Plateau': 10,
    'Accessoires': 4
  }[category];
  
  const status = count === target ? '✅' : '❌';
  console.log(`  ${status} ${category}: ${count}/${target}`);
});

console.log('');
console.log(`🎯 OBJECTIF: 49 produits`);
console.log(`📊 ACTUEL: ${totalProducts} produits`);
console.log(`${totalProducts === 49 ? '✅ CATALOGUE COMPLET' : '❌ CATALOGUE INCOMPLET'}`);
