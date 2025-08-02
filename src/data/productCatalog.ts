// Types pour le catalogue de produits MyConfort
export interface CatalogProduct {
  name: string;
  category: string;
  priceTTC: number;
}

// Catalogue de produits MyConfort
export const productCatalog: CatalogProduct[] = [
  // Vêtements
  { name: "T-shirt Basique Blanc", category: "Vêtements", priceTTC: 19.99 },
  { name: "T-shirt Basique Noir", category: "Vêtements", priceTTC: 19.99 },
  { name: "Jean Slim Bleu", category: "Vêtements", priceTTC: 59.99 },
  { name: "Jean Skinny Noir", category: "Vêtements", priceTTC: 64.99 },
  { name: "Robe d'Été Fleurie", category: "Vêtements", priceTTC: 45.99 },
  { name: "Robe Cocktail Noire", category: "Vêtements", priceTTC: 89.99 },
  { name: "Chemise Blanche", category: "Vêtements", priceTTC: 39.99 },
  { name: "Chemise Rayée", category: "Vêtements", priceTTC: 42.99 },
  { name: "Pull Col Rond Gris", category: "Vêtements", priceTTC: 34.99 },
  { name: "Pull Col V Marine", category: "Vêtements", priceTTC: 37.99 },
  { name: "Veste Blazer", category: "Vêtements", priceTTC: 79.99 },
  { name: "Pantalon Chino", category: "Vêtements", priceTTC: 49.99 },

  // Accessoires
  { name: "Sac à Main Cuir Noir", category: "Accessoires", priceTTC: 89.99 },
  { name: "Sac à Main Cuir Marron", category: "Accessoires", priceTTC: 94.99 },
  { name: "Portefeuille Cuir", category: "Accessoires", priceTTC: 34.99 },
  { name: "Écharpe Laine Grise", category: "Accessoires", priceTTC: 24.99 },
  { name: "Écharpe Cachemire", category: "Accessoires", priceTTC: 49.99 },
  { name: "Ceinture Cuir Noir", category: "Accessoires", priceTTC: 29.99 },
  { name: "Ceinture Cuir Marron", category: "Accessoires", priceTTC: 29.99 },
  { name: "Collier Fantaisie Or", category: "Accessoires", priceTTC: 14.99 },
  { name: "Boucles d'Oreilles Perles", category: "Accessoires", priceTTC: 19.99 },
  { name: "Montre Femme Dorée", category: "Accessoires", priceTTC: 129.99 },
  { name: "Lunettes de Soleil", category: "Accessoires", priceTTC: 39.99 },

  // Chaussures
  { name: "Baskets Sport Blanches", category: "Chaussures", priceTTC: 79.99 },
  { name: "Baskets Sport Noires", category: "Chaussures", priceTTC: 79.99 },
  { name: "Escarpins Noirs 5cm", category: "Chaussures", priceTTC: 69.99 },
  { name: "Escarpins Nude 7cm", category: "Chaussures", priceTTC: 74.99 },
  { name: "Bottes Cuir Noir", category: "Chaussures", priceTTC: 99.99 },
  { name: "Bottines Chelsea", category: "Chaussures", priceTTC: 89.99 },
  { name: "Sandales Été Dorées", category: "Chaussures", priceTTC: 34.99 },
  { name: "Ballerines Cuir", category: "Chaussures", priceTTC: 54.99 },
  { name: "Mocassins Cuir", category: "Chaussures", priceTTC: 64.99 },

  // Beauté
  { name: "Rouge à Lèvres Mat", category: "Beauté", priceTTC: 24.99 },
  { name: "Rouge à Lèvres Brillant", category: "Beauté", priceTTC: 22.99 },
  { name: "Fond de Teint Liquide", category: "Beauté", priceTTC: 32.99 },
  { name: "Poudre Compacte", category: "Beauté", priceTTC: 28.99 },
  { name: "Mascara Volume", category: "Beauté", priceTTC: 18.99 },
  { name: "Eyeliner Noir", category: "Beauté", priceTTC: 15.99 },
  { name: "Parfum Femme 50ml", category: "Beauté", priceTTC: 54.99 },
  { name: "Parfum Femme 100ml", category: "Beauté", priceTTC: 89.99 },
  { name: "Crème Hydratante Visage", category: "Beauté", priceTTC: 18.99 },
  { name: "Sérum Anti-Âge", category: "Beauté", priceTTC: 45.99 },
  { name: "Vernis à Ongles", category: "Beauté", priceTTC: 9.99 },
  { name: "Kit Manucure", category: "Beauté", priceTTC: 24.99 },

  // Services
  { name: "Retouche Ourlet", category: "Services", priceTTC: 15.00 },
  { name: "Retouche Taille", category: "Services", priceTTC: 25.00 },
  { name: "Emballage Cadeau", category: "Services", priceTTC: 5.00 },
  { name: "Livraison Express", category: "Services", priceTTC: 12.00 },
  { name: "Consultation Style", category: "Services", priceTTC: 0 }, // Non vendu seul
  { name: "Garantie Étendue", category: "Services", priceTTC: 0 }, // Incluse avec certains produits
  { name: "Nettoyage Gratuit", category: "Services", priceTTC: 0 }, // Service après-vente
];

export const productCategories = [
  "Vêtements",
  "Accessoires", 
  "Chaussures",
  "Beauté",
  "Services"
];

// Fonction utilitaire pour obtenir les produits par catégorie
export const getProductsByCategory = (category: string): CatalogProduct[] => {
  return productCatalog.filter(product => product.category === category);
};

// Fonction utilitaire pour rechercher des produits
export const searchProducts = (query: string): CatalogProduct[] => {
  const lowerQuery = query.toLowerCase();
  return productCatalog.filter(product => 
    product.name.toLowerCase().includes(lowerQuery) ||
    product.category.toLowerCase().includes(lowerQuery)
  );
};

// Fonction utilitaire pour obtenir les produits vendables (priceTTC > 0)
export const getSellableProducts = (): CatalogProduct[] => {
  return productCatalog.filter(product => product.priceTTC > 0);
};
