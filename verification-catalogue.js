// Script de vérification du catalogue - À exécuter dans la console du navigateur

// Matelas attendus (EXACTEMENT selon votre liste - PAS de 120x200)
const matelasAttendu = [
  'MATELAS BAMBOU 70 x 190',
  'MATELAS BAMBOU 80 x 200', 
  'MATELAS BAMBOU 90 x 190',
  'MATELAS BAMBOU 90 x 200',
  'MATELAS BAMBOU 120 x 190',
  'MATELAS BAMBOU 140 x 190',
  'MATELAS BAMBOU 140 x 200',
  'MATELAS BAMBOU 160 x 200',
  'MATELAS BAMBOU 180 x 200',
  'MATELAS BAMBOU 200 x 200'
];

// Sur-matelas attendus (EXACTEMENT selon votre liste - PAS de 140x200)
const surmatelasAttendu = [
  'SURMATELAS BAMBOU 70 x 190',
  'SURMATELAS BAMBOU 80 x 200',
  'SURMATELAS BAMBOU 90 x 190', 
  'SURMATELAS BAMBOU 90 x 200',
  'SURMATELAS BAMBOU 120 x 190',
  'SURMATELAS BAMBOU 140 x 190',
  'SURMATELAS BAMBOU 160 x 200',
  'SURMATELAS BAMBOU 180 x 200',
  'SURMATELAS BAMBOU 200 x 200'
];

// Plateaux attendus (EXACTEMENT selon votre liste - PAS de 120x200)
const plateauxAttendu = [
  'PLATEAU PRESTIGE 70 x 190',
  'PLATEAU PRESTIGE 80 x 200',
  'PLATEAU PRESTIGE 90 x 190',
  'PLATEAU PRESTIGE 90 x 200',
  'PLATEAU PRESTIGE 120 x 190',
  'PLATEAU PRESTIGE 140 x 190',
  'PLATEAU PRESTIGE 140 x 200',
  'PLATEAU PRESTIGE 160 x 200',
  'PLATEAU PRESTIGE 180 x 200',
  'PLATEAU PRESTIGE 200 x 200'
];

// Fonction de vérification
function verifierCatalogue() {
  console.log('🔍 VERIFICATION COMPLETE DU CATALOGUE MyConfort');
  console.log('================================================');
  
  // Vérifier que le catalogue existe
  if (typeof productCatalog === 'undefined') {
    console.error('❌ ERREUR: productCatalog n\'est pas défini !');
    return;
  }
  
  console.log('✅ Catalogue trouvé avec', productCatalog.length, 'produits total');
  
  // Vérifier les matelas
  const matelasPresents = productCatalog.filter(p => p.category === 'Matelas').map(p => p.name);
  console.log('\n📦 MATELAS BAMBOU:');
  console.log('Attendus:', matelasAttendu.length);
  console.log('Présents:', matelasPresents.length);
  
  const matelasManquants = matelasAttendu.filter(m => !matelasPresents.includes(m));
  if (matelasManquants.length > 0) {
    console.error('❌ MATELAS MANQUANTS:', matelasManquants);
  } else {
    console.log('✅ Tous les matelas sont présents');
  }
  
  // Vérifier les sur-matelas  
  const surmatelasPresents = productCatalog.filter(p => p.category === 'Sur-matelas').map(p => p.name);
  console.log('\n📦 SUR-MATELAS BAMBOU:');
  console.log('Attendus:', surmatelasAttendu.length);
  console.log('Présents:', surmatelasPresents.length);
  
  const surmatelasManquants = surmatelasAttendu.filter(s => !surmatelasPresents.includes(s));
  if (surmatelasManquants.length > 0) {
    console.error('❌ SUR-MATELAS MANQUANTS:', surmatelasManquants);
  } else {
    console.log('✅ Tous les sur-matelas sont présents');
  }
  
  // Vérifier les plateaux
  const plateauxPresents = productCatalog.filter(p => p.category === 'Plateau').map(p => p.name);
  console.log('\n📦 PLATEAUX PRESTIGE:');
  console.log('Attendus:', plateauxAttendu.length);
  console.log('Présents:', plateauxPresents.length);
  
  const plateauxManquants = plateauxAttendu.filter(pl => !plateauxPresents.includes(pl));
  if (plateauxManquants.length > 0) {
    console.error('❌ PLATEAUX MANQUANTS:', plateauxManquants);
  } else {
    console.log('✅ Tous les plateaux sont présents');
  }
  
  // Vérifier autres catégories
  const couettes = productCatalog.filter(p => p.category === 'Couettes');
  const oreillers = productCatalog.filter(p => p.category === 'Oreillers');
  const accessoires = productCatalog.filter(p => p.category === 'Accessoires');
  
  console.log('\n📦 AUTRES CATEGORIES:');
  console.log('Couettes:', couettes.length);
  console.log('Oreillers:', oreillers.length); 
  console.log('Accessoires:', accessoires.length);
  
  console.log('\n🎯 RESUME FINAL:');
  console.log('================================================');
  console.log('Total produits:', productCatalog.length);
  console.log('Matelas BAMBOU:', matelasPresents.length + '/' + matelasAttendu.length);
  console.log('Sur-matelas BAMBOU:', surmatelasPresents.length + '/' + surmatelasAttendu.length);
  console.log('Plateaux PRESTIGE:', plateauxPresents.length + '/' + plateauxAttendu.length);
  console.log('Couettes:', couettes.length);
  console.log('Oreillers:', oreillers.length);
  console.log('Accessoires:', accessoires.length);
  
  const totalManquants = matelasManquants.length + surmatelasManquants.length + plateauxManquants.length;
  if (totalManquants === 0) {
    console.log('🎉 PARFAIT! Tous les produits principaux sont présents');
  } else {
    console.error('⚠️  ATTENTION:', totalManquants, 'produits manquants au total');
  }
}

// Lancer la vérification
verifierCatalogue();
