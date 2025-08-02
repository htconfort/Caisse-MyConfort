# Caisse MyConfort

## Description
Caisse MyConfort est une application de caisse iPad moderne et tactile, spécialement conçue pour MyConfort. Cette solution facilite la gestion des ventes dans un environnement de boutique physique avec une interface optimisée pour les écrans tactiles. Elle permet aux vendeuses d'enregistrer rapidement des ventes, de gérer différents modes de paiement, d'annuler des transactions et de suivre le chiffre d'affaires en temps réel.

## Fonctionnalités Principales
- **Catalogue produits complet** : Plus de 70 produits répartis en 5 catégories (Matelas, Accessoires, Sommiers, Oreillers, Divers)
- **Interface tactile optimisée iPad** : Boutons larges, navigation intuitive, responsive design
- **Gestion des vendeuses** : Sélection et suivi du CA par vendeuse
- **Panier intelligent** : Ajout/suppression de produits, gestion des quantités, total en temps réel
- **Modes de paiement multiples** : Espèces, CB, chèque, multi-paiements
- **Gestion des produits non vendus seuls** : Indication visuelle et désactivation automatique
- **Annulations flexibles** : Annulation totale ou partielle des ventes
- **Suivi du chiffre d'affaires** : CA instantané par vendeuse et global
- **Historique des ventes** : Consultation des ventes de la journée
- **Export des données** : CSV/PDF pour les rapports de fin de journée
- **Sauvegarde locale** : Fonctionnement hors ligne avec persistance des données
- **Charte graphique MyConfort** : Couleurs et design cohérents avec la marque

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