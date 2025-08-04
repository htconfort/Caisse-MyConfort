# Index des Cahiers de Charge - Caisse MyConfort

## 📚 Vue d'ensemble
Ce dossier contient les cahiers de charge détaillés de chaque section de l'application Caisse MyConfort. Chaque cahier documente précisément le fonctionnement, la localisation dans le code, et les points critiques de debug.

## 📋 Structure des cahiers

### 1. [Page Frontale - Sélection Vendeuse](./01-page-frontale-vendeuse.md)
**Objectif** : Point d'entrée obligatoire pour sélectionner une vendeuse  
**Localisation** : `src/App.tsx` ligne ~671  
**Points clés** :
- Sélection obligatoire avant accès aux autres fonctions
- Persistance en localStorage
- Redirection automatique vers l'onglet Produits
- Couleurs personnalisées par vendeuse

### 2. [Page Produits](./02-page-produits.md)
**Objectif** : Catalogue des produits et ajout au panier  
**Localisation** : `src/App.tsx` ligne ~730 et ~751  
**Points clés** :
- Catalogue complet MyConfort (96 références)
- Recherche textuelle avec debounce
- Filtrage par catégories
- Gestion des produits "non vendus seuls"

### 3. [Page Ventes](./03-page-ventes.md)
**Objectif** : Historique et export des transactions  
**Localisation** : `src/App.tsx` ligne ~819  
**Points clés** :
- Historique chronologique complet
- Export CSV automatisé
- Statistiques globales temps réel
- Gestion visuelle des ventes annulées

### 4. [Page Diverses](./04-page-diverses.md)
**Objectif** : Ajout d'articles personnalisés au panier  
**Localisation** : `src/App.tsx` ligne ~1025  
**Points clés** :
- Articles hors catalogue
- Montants positifs (services) et négatifs (réductions)
- Validation des saisies utilisateur
- Catégorie spéciale "Diverses"

### 5. [Page CA Instant](./05-page-ca-instant.md)
**Objectif** : Tableau de bord temps réel du chiffre d'affaires  
**Localisation** : `src/App.tsx` ligne ~1117  
**Points clés** :
- CA global et par vendeuse
- Statistiques du jour vs total
- Graphiques en barres colorées
- Horloge temps réel

### 6. [Page Annulation](./06-page-annulation.md)
**Objectif** : Annulation de ventes déjà enregistrées  
**Localisation** : `src/App.tsx` ligne ~1073  
**Points clés** :
- Double confirmation sécurisée
- Mise à jour des statistiques vendeuses
- Traçabilité (vente marquée, pas supprimée)
- Panier identique à la page Produits

### 7. [Page RAZ](./07-page-raz.md)
**Objectif** : Remise à zéro du système (fin de période)  
**Localisation** : `src/App.tsx` ligne ~1401  
**Points clés** :
- Processus sécurisé en 3 étapes
- Export automatique avant suppression
- RAZ quotidienne, hebdomadaire, ou complète
- Confirmation textuelle obligatoire

### 8. [Composant Panier](./08-composant-panier.md)
**Objectif** : Gestion des articles en cours d'achat et finalisation des ventes  
**Localisation** : `src/App.tsx` ligne ~1509  
**Points clés** :
- Panier latéral sur pages Produits et Annulation
- Gestion quantités et suppression d'articles
- Processus de paiement avec sélection mode
- États minimisé/étendu pour optimisation espace

## 🔧 Architecture technique commune

### Hooks personnalisés utilisés
- **useLocalStorage** : Persistance automatique des données
- **useDebounce** : Optimisation des recherches
- **useNetworkStatus** : Détection état réseau

### Clés localStorage standardisées
```typescript
const STORAGE_KEYS = {
  CART: 'myconfort-cart',           // Panier en cours
  SALES: 'myconfort-sales',         // Historique des ventes
  VENDOR: 'myconfort-current-vendor', // Vendeuse sélectionnée
  VENDORS_STATS: 'myconfort-vendors'  // Statistiques vendeuses
};
```

### Interfaces principales
- **Vendor** : Données des vendeuses
- **Sale** : Structure d'une vente complète
- **ExtendedCartItem** : Article dans le panier
- **CatalogProduct** : Produit du catalogue

## 🎨 Charte graphique MyConfort

### Couleurs principales
- **Vert principal** : #477A0C (boutons, header)
- **Lime accent** : #C4D144 (accents, scrollbar)
- **Beige neutre** : #F2EFE2 (fond)
- **Vert foncé** : #14281D (textes)
- **Rouge alerte** : #F55D3E (erreurs, annulations)

### Couleurs des vendeuses
- Sylvie : #477A0C, Babette : #F55D3E, Lucia : #14281D
- Cathy : #080F0F, Johan : #89BBFE, Sabrina : #D68FD6, Billy : #FFFF99

## 🚨 Points critiques transversaux

### Debugging général
1. **Vérifier localStorage** : `localStorage.getItem('myconfort-*')`
2. **Console d'état** : Afficher les états React principaux
3. **Persistence** : Vérifier la sauvegarde automatique
4. **Navigation** : Contrôler les conditions d'affichage des onglets

### Performance
- **Lazy loading** : Composants chargés à la demande
- **Debounce** : Recherches optimisées (300ms)
- **Mémorisation** : useMemo pour les calculs coûteux
- **Limitation** : Affichage des 20 ventes les plus récentes

### Sécurité
- **Validation des saisies** : Tous les inputs utilisateur
- **Double confirmation** : Actions critiques (annulation, RAZ)
- **Sauvegarde automatique** : Export avant suppressions

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 768px (2 colonnes produits)
- **Tablette** : 768px - 1024px (3 colonnes)
- **Desktop** : > 1024px (4 colonnes)

### Optimisations tactiles
- **Taille minimale** : 44px pour tous les boutons
- **Feedback visuel** : Classe `touch-feedback`
- **Désactivation zoom** : Font-size 16px sur les inputs

## 🔗 Dépendances externes

### Icônes (lucide-react)
- User, Package, BarChart, FileText, RotateCcw, RefreshCw
- ShoppingCart, Plus, Minus, X, Save, Download
- AlertCircle, Check, Wifi, WifiOff

### CSS Classes utilitaires
- **Layout** : flex, grid, card, modal-overlay
- **Interactivité** : btn-primary, btn-secondary, btn-danger
- **Animation** : animate-fadeIn, animate-pulse, touch-feedback

## ✅ Tests de validation globaux

### Workflow complet
1. **Démarrage** : Sélection vendeuse obligatoire
2. **Vente** : Ajout produits → Panier → Paiement → Validation
3. **Consultation** : Ventes, CA temps réel, statistiques
4. **Gestion** : Annulations, articles divers
5. **Maintenance** : Export, RAZ

### Persistence des données
- **Navigateur fermé** : Toutes les données conservées
- **Rechargement** : État complet restauré
- **Export** : CSV/JSON fonctionnels

### Performance
- **Chargement** : < 3 secondes sur iPad
- **Navigation** : Transition fluide entre onglets
- **Calculs** : Temps réel même avec 1000+ ventes

---

**Version** : 1.0  
**Dernière mise à jour** : 4 août 2025  
**Responsable** : Équipe développement MyConfort
