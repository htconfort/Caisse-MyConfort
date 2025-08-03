# 🛒 Caisse MyConfort iPad

> Application de caisse moderne et tactile optimisée pour iPad, développée avec React/TypeScript et GitHub Copilot.

## 🎯 Aperçu

Application de point de vente complète pour MyConfort, conçue spécifiquement pour les iPad avec une interface tactile intuitive, gestion des vendeuses, catalogue produits complet, et reporting en temps réel.

### ✨ Fonctionnalités Principales

- **👤 Gestion des Vendeuses** : Sélection, statistiques individuelles, couleurs distinctives
- **📦 Catalogue Produits** : 50+ produits MyConfort avec recherche temps réel
- **🛒 Panier Intelligent** : Ajout/modification dynamique, calculs automatiques
- **💳 Moyens de Paiement** : CB, Espèces, Chèque, Multi-paiement
- **📊 Reporting Instantané** : CA par vendeuse, export CSV/JSON
- **🔄 Remise à Zéro** : Procédure sécurisée fin de journée
- **💾 Sauvegarde Locale** : Données 100% locales, pas de serveur requis

## Technologies Utilisées
- **React 18** avec **TypeScript** : Interface moderne et typée
- **Hooks personnalisés** : Gestion du state (panier, vendeuses, paiements, ventes)
- **CSS3 + Classes utilitaires** : Charte graphique MyConfort et responsive design
- **LocalStorage** : Persistance des données côté client
- **Modular Architecture** : Composants réutilisables et maintenables

## Installation et Démarrage
1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-username/caisse-myconfort.git
   ```
2. Accédez au répertoire du projet :
   ```bash
   cd caisse-myconfort
   ```
3. Installez les dépendances :
   ```bash
   npm install
   ```
4. Lancez l'application en mode développement :
   ```bash
   npm start
   ```
5. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Build de Production
```bash
npm run build
```
Les fichiers de production seront générés dans le dossier `build/`.

## Structure du Projet
```
caisse-myconfort/
├── public/
│   ├── index.html          # Page HTML principale
│   └── manifest.json       # Métadonnées PWA
├── src/
│   ├── components/         # Composants React
│   │   ├── cart/          # Composants du panier
│   │   ├── common/        # Composants réutilisables
│   │   ├── payment/       # Composants de paiement
│   │   ├── products/      # Composants catalogue
│   │   ├── sales/         # Composants ventes et historique
│   │   └── vendor/        # Composants vendeuses
│   ├── data/              # Données statiques
│   │   ├── productCatalog.ts # Catalogue des produits MyConfort
│   │   ├── categories.json   # Catégories de produits
│   │   └── products.json     # Liste des produits
│   ├── hooks/             # Hooks personnalisés
│   │   ├── useCart.ts     # Gestion du panier
│   │   ├── useLocalStorage.ts # Persistance locale
│   │   ├── usePayment.ts  # Gestion des paiements
│   │   └── useSales.ts    # Gestion des ventes
│   ├── services/          # Services métier
│   │   ├── exportService.ts  # Export CSV/PDF
│   │   ├── printService.ts   # Impression tickets
│   │   └── storageService.ts # Gestion stockage
│   ├── styles/            # Styles CSS
│   │   ├── globals.css    # Styles globaux
│   │   ├── components.css # Styles composants
│   │   └── responsive.css # Media queries
│   ├── types/             # Types TypeScript
│   │   ├── Cart.ts        # Types panier
│   │   ├── Payment.ts     # Types paiement
│   │   ├── Product.ts     # Types produits
│   │   ├── Sale.ts        # Types ventes
│   │   └── Vendor.ts      # Types vendeuses
│   ├── utils/             # Utilitaires
│   │   ├── calculations.ts   # Calculs TTC/HT
│   │   ├── constants.ts      # Constantes app
│   │   └── formatting.ts     # Formatage données
│   ├── App.tsx            # Composant principal
│   ├── App.css            # Styles principaux
│   └── index.tsx          # Point d'entrée
├── package.json           # Dépendances npm
├── tsconfig.json          # Configuration TypeScript
└── README.md              # Documentation
```

## Utilisation
1. **Sélection vendeuse** : Choisir la vendeuse avant de commencer une vente
2. **Ajout produits** : Naviguer dans les catégories et ajouter au panier
3. **Gestion panier** : Modifier quantités, supprimer articles
4. **Règlement** : Choisir mode(s) de paiement et valider
5. **Suivi CA** : Consulter le chiffre d'affaires en temps réel
6. **Export** : Générer les rapports de fin de journée

## Fonctionnalités Avancées
- **Mode hors ligne** : Fonctionne sans connexion internet
- **Sauvegarde automatique** : Toutes les données sont sauvegardées localement
- **Interface responsive** : Optimisée pour iPad et autres tablettes
- **Gestion erreurs** : Messages d'erreur explicites et récupération gracieuse

## Contribuer
1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commitez vos changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## Licence
Ce projet est la propriété de MyConfort. Tous droits réservés.

## Contact
Pour toute question ou demande de support, contactez l'équipe de développement MyConfort.