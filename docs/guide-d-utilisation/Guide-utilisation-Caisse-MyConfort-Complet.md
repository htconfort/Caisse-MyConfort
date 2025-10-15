# Guide d'Utilisation Complet - Caisse MyConfort

> **Guide généré automatiquement le 10 août 2025**  
> **Version de l'application :** Caisse MyConfort v3.x  
> **Technologies :** React 18 + TypeScript + Vite + Dexie + N8N  
> **Basé sur l'analyse complète du code source**

---

## 📋 Table des matières

1. [🎯 Présentation générale](#-présentation-générale)
2. [⚙️ Configuration et démarrage](#️-configuration-et-démarrage)
3. [🧭 Navigation et interface](#-navigation-et-interface)
4. [📖 Guide détaillé des onglets](#-guide-détaillé-des-onglets)
5. [🔄 Intégration N8N & Factures](#-intégration-n8n--factures)
6. [🏛️ Système de sessions](#️-système-de-sessions)
7. [💾 Persistance et sauvegarde](#-persistance-et-sauvegarde)
8. [🛠️ Maintenance et dépannage](#️-maintenance-et-dépannage)
9. [📚 Référence technique](#-référence-technique)

---

## 🎯 Présentation générale

### Qu'est-ce que Caisse MyConfort ?

**Caisse MyConfort** est une application de caisse événementielle moderne et complète construite avec les technologies web les plus récentes. Elle permet de gérer intégralement les ventes lors d'événements avec un suivi détaillé des vendeuses, des produits, des stocks et des statistiques.

### Caractéristiques principales

- ✅ **Interface moderne** : React 18 + TypeScript pour une expérience utilisateur fluide
- ✅ **Persistance locale** : Système Dexie (IndexedDB) pour un stockage robuste
- ✅ **Sessions événementielles** : Gestion complète des événements avec dates de début/fin
- ✅ **Intégration N8N** : Synchronisation automatique des factures externes
- ✅ **Gestion multi-vendeuses** : Couleurs personnalisées et statistiques individuelles
- ✅ **Stock intelligent** : Suivi physique et déductions automatiques
- ✅ **Export professionnel** : PDF, email, impression, WhatsApp
- ✅ **Mode hors ligne** : Fonctionnement complet sans connexion internet

### Technologies utilisées

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Frontend** | React + TypeScript | 18.x |
| **Build Tool** | Vite | 5.x |
| **Base de données** | Dexie (IndexedDB) | 4.x |
| **Intégration** | N8N | Compatible |
| **UI/UX** | Lucide React + CSS moderne | Latest |
| **Export** | html2canvas, jsPDF, react-to-print | Latest |

---

## ⚙️ Configuration et démarrage

### Prérequis système

- **Node.js** : Version 18+ recommandée
- **npm** : Version 8+ ou yarn/pnpm équivalent
- **Navigateur moderne** : Chrome, Firefox, Safari, Edge (dernières versions)
- **N8N** (optionnel) : Pour la synchronisation des factures

### Installation locale

```bash
# Cloner le projet
git clone [URL_REPO]
cd Caisse-MyConfort-3/mon-projet-vite

# Installer les dépendances
npm ci

# Lancer en développement
npm run dev
```

### Variables d'environnement

Créer ou modifier `.env.development` :

```ini
# Configuration générale
VITE_ENV=development
VITE_DEMO_MODE=true
VITE_DISABLE_DEMO_DATA=false

# Configuration N8N
VITE_N8N_ENABLED=true              # Active/désactive la sync N8N
VITE_N8N_URL=/api/n8n              # Endpoint proxy pour N8N
VITE_N8N_TARGET=http://localhost:5678  # URL cible N8N local

# Logs et debug
VITE_LOG_LEVEL=debug
```

### Configuration proxy N8N

Le fichier `vite.config.ts` configure automatiquement le proxy :

```typescript
proxy: {
  '/api/n8n': {
    target: process.env.VITE_N8N_TARGET || 'http://localhost:5678',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/n8n/, '')
  }
}
```

### Premier démarrage

1. **Accès application** : http://localhost:5173
2. **Sélection vendeuse** : Obligatoire avant toute vente
3. **Navigation** : 10 onglets disponibles
4. **Panier flottant** : Accessible en permanence en bas d'écran

---

## 🧭 Navigation et interface

### Structure générale

L'application suit une architecture en onglets avec un header informatif et une navigation principale :

```
┌─────────────────────────────────────────┐
│              HEADER                     │
│   Logo + Vendeuse + Date/Heure         │
├─────────────────────────────────────────┤
│              NAVIGATION                 │
│  Vendeuse │ Produits │ Factures │ ...   │
├─────────────────────────────────────────┤
│            CONTENU ONGLET               │
│                                         │
├─────────────────────────────────────────┤
│          PANIER FLOTTANT               │
│      (si articles en cours)            │
└─────────────────────────────────────────┘
```

### Header dynamique

Le header affiche en temps réel :
- **Logo** : Caisse MyConfort avec icône
- **Vendeuse active** : Nom en gros caractères colorés
- **Date et heure** : Mise à jour automatique
- **État connexion** : Indicateur hors ligne si nécessaire

### Navigation principale

Les 10 onglets disponibles avec badges intelligents :

| Onglet | Icône | Badge | Description |
|--------|-------|-------|-------------|
| **Vendeuse** | 👤 | - | Sélection et gestion des vendeuses |
| **Produits** | 📦 | - | Catalogue et ajout au panier |
| **Factures** | 🧾 | Nb factures | Synchronisation N8N et consultation |
| **Stock** | 📊 | - | Gestion multi-niveau des stocks |
| **Ventes** | 📈 | Nb ventes | Historique et statistiques |
| **Diverses** | 📝 | - | Lignes personnalisées |
| **Annulation** | ❌ | Nb articles | Gestion du panier et annulations |
| **CA** | 💰 | - | Chiffre d'affaires temps réel |
| **Gestion** | ⚙️ | - | Administration des vendeuses |
| **RAZ** | 🔄 | ! | Feuille de caisse et remise à zéro |

### Panier flottant

Le panier apparaît automatiquement quand des articles sont ajoutés :
- **Position** : Bas de l'écran, centré
- **Contenu** : Nombre d'articles et total TTC
- **Actions** : Accès direct à la finalisation
- **Persistance** : Conservé entre les onglets et sessions

---

## 📖 Guide détaillé des onglets

### 🧑‍💼 Onglet Vendeuse

**Objectif** : Gestion des vendeuses et sélection active

#### Interface principale

L'onglet se divise en deux sous-onglets :

##### Sélection (par défaut)
- **Grille colorée** : Cartes des vendeuses avec couleurs personnalisées
- **Statistiques** : CA du jour et nombre de ventes par vendeuse
- **Sélection** : Clic pour activer une vendeuse
- **Feedback visuel** : Bordure active sur la vendeuse sélectionnée

##### Paramètres
- **Ajouter vendeuse** : Nom, email, couleur
- **Éditer vendeuse** : Modification des informations
- **Supprimer vendeuse** : Avec confirmation sécurisée
- **Palette couleurs** : 20 couleurs prédéfinies

#### Règles de gestion

- ⚠️ **Vendeuse obligatoire** : Impossible de vendre sans sélection
- ✅ **Persistance** : La sélection est conservée entre les sessions
- 🎨 **Couleurs uniques** : Chaque vendeuse a une couleur distinctive
- 📊 **Statistiques temps réel** : Mise à jour automatique des totaux

### 📦 Onglet Produits

**Objectif** : Catalogue produits et construction du panier

#### Navigation du catalogue

##### Filtres par catégorie
- **Matelas** : Produits de literie principale
- **Sur-matelas** : Accessoires de confort
- **Couettes** : Linge de lit
- **Oreillers** : Produits de soutien
- **Plateau** : Bases et structures
- **Accessoires** : Compléments et services

##### Recherche intelligente
- **Recherche temps réel** : Filtrage automatique pendant la saisie
- **Recherche combinée** : Nom + catégorie simultanément
- **Debounce** : Optimisation des performances (300ms)

#### Ajout au panier

- **Clic simple** : Ajoute 1 unité
- **Produits actifs** : Seuls les produits vendables sont cliquables
- **Feedback visuel** : Animation et notification de succès
- **Calcul automatique** : TTC immédiat avec gestion de la TVA

#### Gestion des prix

```typescript
// Exemple de structure produit
interface CatalogProduct {
  name: string;
  category: ProductCategory;
  priceTTC: number;  // 0 = non vendu seul
  autoCalculateHT?: boolean;
  description?: string;
}
```

### 🧾 Onglet Factures

**Objectif** : Consultation des factures intégrées et externes

#### Modes de vue

L'onglet propose 3 modes de consultation :

##### Vue Compacte (par défaut)
- **Liste condensée** : Toutes les factures sur une page
- **Tri et filtres** : Par date, montant, statut, vendeuse
- **Recherche** : Nom client, numéro de facture
- **Pagination intelligente** : Chargement progressif

##### Vue Externes
- **Factures N8N** : Uniquement les factures synchronisées
- **Statut sync** : Indicateur de dernière synchronisation
- **Détails règlement** : Informations de paiement complètes

##### Vue Détails
- **Facture sélectionnée** : Affichage complet d'une facture
- **Informations client** : Coordonnées et historique
- **Détails produits** : Tableau détaillé des articles
- **Règlements** : Échéanciers et modes de paiement

#### Synchronisation N8N

- **Automatique** : Polling toutes les 30 secondes si activé
- **Manuelle** : Bouton de synchronisation forcée
- **Statuts** : Idle, Syncing, Error avec feedback visuel
- **Notifications** : Centre de notifications pour les événements

#### Mode Élégant ✨

Bouton en haut à droite pour basculer vers le mode premium :
- **Interface modernisée** : Glassmorphism et gradients
- **Animations fluides** : Transitions et micro-interactions
- **Design sophistiqué** : Toutes fonctionnalités préservées
- **Performance optimisée** : Animations 60fps

### 📊 Onglet Stock

**Objectif** : Gestion multi-niveau des inventaires

#### Modes de navigation

L'onglet Stock propose **3 modes de vue** cyclables :

##### Vue Cartes (par défaut)
- **Cartes élégantes** : Navigation visuelle avec couleurs et descriptions
- **Animations** : Effets de brillance et transformations au survol
- **Descriptions complètes** : Détails de chaque section

##### Vue Compacte
- **Cartes réduites** : Plus dense, sans descriptions
- **Grille optimisée** : 2-4 colonnes selon l'écran
- **Navigation rapide** : Accès immédiat aux sections

##### Vue Horizontale
- **Boutons compacts** : Navigation sur une seule ligne
- **Productivité** : Tous les onglets visibles simultanément
- **Responsive** : Adaptation automatique aux écrans

#### Sous-sections disponibles

##### Stock Général
- **Inventaire principal** : Stock comptable avec déductions N8N
- **Statistiques** : 89% stock OK, 12 alertes stock faible
- **Actions** : Ajustements et corrections

##### Stock Physique
- **Inventaire réel** : Comptage physique et vérifications
- **Déverrouillage sécurisé** : Code PIN pour modifications
- **Rapports** : Export des écarts et mouvements

##### Stand
- **Stock exposition** : Produits visibles au public
- **Réapprovisionnement** : Transferts depuis le stock principal
- **Réservations** : Gestion des mises de côté

##### Remorque
- **Stock transit** : Produits en attente de déchargement
- **Actions** : Transfert vers stock ou retour fournisseur
- **Suivi livraisons** : Traçabilité des mouvements

### 📈 Onglet Ventes

**Objectif** : Historique complet et analytiques

#### Affichage des ventes

- **Liste chronologique** : Ventes les plus récentes en premier
- **Détails complets** : Vendeuse, articles, montant, paiement
- **Statuts visuels** : Ventes normales vs annulées
- **Horodatage** : Date et heure précises de chaque transaction

#### Filtres et recherche

- **Par vendeuse** : Isolation des ventes d'une vendeuse
- **Par période** : Aujourd'hui, cette semaine, ce mois
- **Par montant** : Tranches de CA
- **Recherche** : Nom de produit ou client

#### Statistiques intégrées

- **Nombre total** : Compteur de ventes validées
- **CA cumulé** : Chiffre d'affaires total
- **Panier moyen** : Calcul automatique
- **Répartition paiements** : Carte, espèces, chèques, mixte

### 📝 Onglet Diverses

**Objectif** : Lignes personnalisées et services

#### Cas d'usage

- **Frais de livraison** : Ajout de coûts de transport
- **Services** : Montage, installation, conseil
- **Remises commerciales** : Montants négatifs pour réductions
- **Prestations spéciales** : Tout service non catalogué

#### Fonctionnement

1. **Description** : Texte libre explicatif
2. **Montant** : Prix TTC (positif ou négatif)
3. **Ajout au panier** : Traitement identique aux produits
4. **Validation** : Contrôles de cohérence

#### Interface

- **Champs simples** : Description et montant
- **Validation temps réel** : Format numérique requis
- **Aperçu** : Calcul immédiat du total panier
- **Historique** : Conservation des lignes fréquentes

### ❌ Onglet Annulation

**Objectif** : Gestion des annulations et du panier en cours

#### Gestion du panier

##### Modification des quantités
- **Interface directe** : Champs numériques modifiables
- **Suppression** : Quantité à zéro pour retirer un article
- **Recalcul automatique** : Total mis à jour en temps réel
- **Validation** : Impossible de quantités négatives

##### Vidage du panier
- **Action rapide** : Bouton "Vider le panier"
- **Confirmation** : Demande de validation
- **Reset complet** : Remise à zéro de tous les articles

#### Annulation de ventes

##### Dernière vente
- **Fonction** : `cancelLastSale()`
- **Condition** : Vente la plus récente uniquement
- **Impact** : Mise à jour des statistiques vendeuse

##### Vente spécifique
- **Fonction** : `cancelSpecificSale(saleId)`
- **Sélection** : Par ID de transaction
- **Traçabilité** : Conservation de l'historique avec statut "annulée"

#### Sécurité

- ⚠️ **Actions irréversibles** : Confirmations multiples
- 📝 **Audit trail** : Toutes les annulations sont loggées
- 🔒 **Restrictions** : Impossible d'annuler des ventes anciennes selon configuration

### 💰 Onglet CA (Chiffre d'Affaires)

**Objectif** : Tableau de bord financier temps réel

#### Statistiques principales

##### CA Global
- **Total journée** : Somme de toutes les ventes (caisse + factures)
- **Objectif** : Comparaison avec les objectifs fixés
- **Évolution** : Tendance par rapport aux jours précédents

##### Répartition par paiement
- **Carte bancaire** : Montant et pourcentage
- **Espèces** : Montant et pourcentage  
- **Chèques** : Montant et pourcentage
- **Paiements mixtes** : Montant et pourcentage

#### Analyse par vendeuse

##### Tableau détaillé
- **Nom** : Vendeuse avec couleur distinctive
- **Nb ventes** : Compteur de transactions
- **CA individuel** : Chiffre d'affaires personnel
- **Panier moyen** : CA ÷ Nb ventes
- **Contribution** : Pourcentage du CA total

##### Classement dynamique
- **Tri automatique** : Par CA décroissant
- **Indicateurs visuels** : Barres de progression colorées
- **Mise à jour temps réel** : Recalcul à chaque vente

#### Factures intégrées

- **CA Facturier** : Intégration des factures N8N synchronisées
- **Total combiné** : Caisse + Facturier = CA global
- **Répartition** : Distinction claire des sources

### ⚙️ Onglet Gestion

**Objectif** : Administration avancée des vendeuses

#### Interface de gestion

##### Grille des vendeuses
- **Cartes informatives** : Nom, email, couleur, statistiques
- **Actions disponibles** : Édition (✏️), Suppression (🗑️), Sélection
- **Layout responsive** : Adaptation automatique à la taille d'écran

##### Ajout de vendeuse
- **Formulaire intégré** : Nom, email, couleur
- **Validation temps réel** : Contrôles de cohérence
- **Palette couleurs** : 20 couleurs prédéfinies
- **Prévisualisation** : Aperçu immédiat de la carte

#### Actions avancées

##### Édition en place
- **Mode édition** : Transformation de la carte en formulaire
- **Sauvegarde** : Validation et retour à l'affichage normal
- **Annulation** : Restoration des valeurs originales

##### Suppression sécurisée
- **Modal de confirmation** : Double validation requise
- **Avertissement** : Information sur l'irréversibilité
- **Préservation données** : Les ventes historiques sont conservées

#### Règles de gestion

- 🎨 **Couleurs uniques** : Impossible d'avoir deux vendeuses avec la même couleur
- ✅ **Nom obligatoire** : Validation de la saisie
- 📧 **Email optionnel** : Format validé si renseigné
- 🔒 **Suppression protégée** : Impossible si vendeuse actuellement sélectionnée

### 🔄 Onglet RAZ (Remise À Zéro)

**Objectif** : Feuille de caisse professionnelle et gestion des sessions

Cet onglet est le centre névralgique de l'application pour la gestion événementielle.

#### Interface principale

##### Feuille de caisse complète

###### Informations générales
- **Date et événement** : Nom de la manifestation, dates de début/fin
- **Session active** : Informations sur la session en cours
- **Destinataire email** : Configuration pour l'export automatique

###### Statistiques consolidées
- **CA Total** : Caisse + Facturier avec répartition
- **Nombre de ventes** : Compteur global et par source
- **Ticket moyen** : Calcul automatique pondéré
- **Répartition paiements** : Détail par mode de paiement

###### Analyse par vendeuse
- **Tableau complet** : Nom, nb ventes, CA, panier moyen
- **Détail des paiements** : Répartition par mode pour chaque vendeuse
- **Total calculé** : Caisse + Facturier par vendeuse
- **Contribution** : Pourcentage du CA total

###### Règlements à venir (données exemple)
- **Échéanciers clients** : Chèques et paiements différés
- **Dates d'échéance** : Planification des encaissements
- **Montants** : Détail des sommes attendues

#### Gestion des événements

##### Configuration d'événement
- **Nom** : Description de la manifestation
- **Date de début** : Timestamp d'ouverture
- **Date de fin** : Timestamp de clôture
- **Saisie le premier jour** : Possibilité de configurer/modifier

##### Blocage intelligent
- ⚠️ **Règle de sécurité** : Impossible de clôturer avant la fin d'événement
- 🔒 **Protection** : Évite les fermetures accidentelles
- ⏰ **Vérification** : Contrôle de la date/heure de fin

#### Système RAZ avancé

##### Options disponibles
- ☑️ **Ventes** : Remise à zéro des transactions
- ☑️ **Panier** : Vidage du panier en cours
- ☑️ **Statistiques** : Reset des compteurs vendeuses
- ☑️ **Factures** : Suppression des factures synchronisées
- ☑️ **Sessions** : Fermeture/ouverture nouvelle session

##### Processus d'exécution
1. **Sélection** : Cocher les options désirées
2. **Aperçu** : Liste prévisionnelle des actions
3. **Export préventif** : Sauvegarde JSON automatique
4. **Confirmation** : Modal de validation explicite
5. **Exécution** : Animation de progression avec feedback
6. **Finalisation** : Modal de succès et retour dashboard

##### Sécurité et traçabilité
- 📝 **Logs complets** : Horodatage de toutes les actions
- 💾 **Export automatique** : Sauvegarde JSON avant RAZ
- 🔒 **Confirmations multiples** : Validation explicite à chaque étape
- 📊 **Rapports** : Génération automatique de bilans

#### Export et diffusion

##### Formats disponibles
- **PDF** : Via html2canvas + jsPDF pour archivage
- **Impression** : Via react-to-print et dialogue navigateur
- **Email** : Envoi automatique si destinataire configuré
- **WhatsApp** : Intégration pour partage rapide d'équipe

##### Configuration email
- **Destinataire par défaut** : `contact@myconfort.example.com`
- **Format** : HTML avec styles préservés
- **Pièces jointes** : PDF automatiquement généré
- **Sujet automatique** : Date + nom événement

#### Gestion des sessions

##### Actions disponibles
- **Ouvrir session** : `sessionService.ensureSession('app')`
- **Fermer session** : `sessionService.closeCurrentSession()`
- **Calculer totaux** : `sessionService.computeTodayTotalsFromDB()`

##### Persistance
- **IndexedDB** : Stockage local de toutes les sessions
- **Audit trail** : Historique complet des ouvertures/fermetures
- **Récupération** : Restauration automatique après incident

---

## 🔄 Intégration N8N & Factures

### Architecture de synchronisation

#### Configuration

Le système N8N est configurable via les variables d'environnement :

```ini
VITE_N8N_ENABLED=true|false
VITE_N8N_URL=/api/n8n
VITE_N8N_TARGET=https://n8n.myconfort.fr
```

#### Proxy Vite

Le serveur de développement configure automatiquement un proxy :

```typescript
// vite.config.ts
proxy: {
  '/api/n8n': {
    target: process.env.VITE_N8N_TARGET,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/n8n/, '')
  }
}
```

### Fonctionnement de la synchronisation

#### Polling automatique

```typescript
// useSyncInvoices.ts
useEffect(() => {
  if (!n8nEnabled) return;
  
  const interval = setInterval(() => {
    syncInvoices();
  }, 30000); // 30 secondes
  
  return () => clearInterval(interval);
}, [n8nEnabled]);
```

#### Statuts de synchronisation

| Statut | Description | Indicateur visuel |
|--------|-------------|-------------------|
| **Idle** | En attente | Badge vert |
| **Syncing** | Synchronisation en cours | Spinner animé |
| **Error** | Erreur de connexion | Badge rouge + message |
| **Success** | Synchronisation réussie | Badge vert + compteur |

#### Gestion des erreurs

```typescript
// Codes d'erreur courants
ECONNREFUSED  // N8N non démarré
Network Error // Problème de connectivité
CORS Error    // Configuration CORS
Timeout       // Délai dépassé
```

### Types de factures

#### Factures internes (caisse)

```typescript
interface Sale {
  id: string;
  vendorName: string;
  items: ExtendedCartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: Date;
  canceled: boolean;
}
```

#### Factures externes (N8N)

```typescript
interface Invoice {
  id: string;
  numero: string;
  client: string;
  vendorName: string;
  totalTTC: number;
  status: 'pending' | 'partial' | 'delivered';
  paymentDetails?: PaymentDetails;
  items: InvoiceItem[];
  createdAt: string;
}
```

### Intégration dans l'interface

#### Centre de notifications

```typescript
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
  duration?: number;
}
```

#### Statistiques consolidées

- **Total factures** : Internes + Externes
- **CA global** : Caisse + Facturier
- **Répartition** : Pourcentage par source
- **Tendances** : Évolution dans le temps

---

## 🏛️ Système de sessions

### Architecture des sessions

#### Concept fondamental

Les **sessions** représentent des périodes de travail définies avec :
- Date/heure d'ouverture et de clôture
- Utilisateur responsable de l'ouverture/fermeture
- Totaux consolidés par moyen de paiement
- Informations d'événement (nom, dates début/fin)
- Audit trail complet des actions

#### Schéma de données

```typescript
interface SessionDB {
  id?: number;                    // ID auto-généré
  openedAt: number;              // Timestamp ouverture
  closedAt?: number;             // Timestamp fermeture (undefined si ouverte)
  openedBy: string;              // Utilisateur ayant ouvert
  closedBy?: string;             // Utilisateur ayant fermé
  totals?: {                     // Totaux calculés à la fermeture
    card: number;
    cash: number;
    cheque: number;
    multi: number;
  };
  eventName?: string;            // Nom de l'événement
  eventStart?: number;           // Timestamp début événement
  eventEnd?: number;             // Timestamp fin événement
}
```

### Service de gestion (SessionService)

#### API principale

```typescript
// Garantir une session ouverte
const session = await sessionService.ensureSession('app');

// Obtenir la session courante
const current = await sessionService.getCurrentSession();

// Ouvrir une nouvelle session avec infos événement
const newSession = await sessionService.openSession('username', {
  eventName: 'Foire de Printemps',
  eventStart: '2025-03-15T09:00:00',
  eventEnd: '2025-03-15T18:00:00'
});

// Fermer la session avec totaux calculés
await sessionService.closeCurrentSession({
  closedBy: 'username',
  totals: { card: 1500, cash: 300, cheque: 200, multi: 100 }
});

// Calculer les totaux du jour depuis la base
const totals = await sessionService.computeTodayTotalsFromDB();
// Retourne: { card: number, cash: number, cheque: number, multi: number }
```

#### Gestion des événements

```typescript
// Mettre à jour les informations d'événement
await sessionService.updateCurrentSessionEvent({
  eventName: 'Foire de Printemps',
  eventStart: '2025-03-15T09:00:00',
  eventEnd: '2025-03-15T18:00:00'
});
```

### Interface utilisateur

#### Gestion dans la RAZ

La page RAZ centralise la gestion des sessions :

##### Affichage session active
- **Nom de l'événement** : Si configuré
- **Dates début/fin** : Avec formatage français
- **Durée** : Calcul automatique de la durée de l'événement
- **Statut** : Ouvert/Fermé avec indicateurs visuels

##### Configuration événement (premier jour)
- **Champs de saisie** : Nom, date début, date fin
- **Validation** : Contrôles de cohérence des dates
- **Sauvegarde** : Mise à jour de la session en cours

##### Blocage de clôture
- **Vérification temporelle** : Impossible de fermer avant la fin d'événement
- **Message d'alerte** : Explication claire du blocage
- **Contournement** : Modification des dates si nécessaire

#### Automatismes

##### À l'amorçage de l'application

```typescript
// Dans main.tsx
await consolidateOnce();                    // Migration one-shot
await sessionService.ensureSession('app'); // Session garantie
```

##### Pendant l'utilisation

- **Session garantie** : `ensureSession()` appelé automatiquement
- **Calculs automatiques** : Totaux recalculés à la demande
- **Persistance** : Sauvegarde automatique dans IndexedDB
- **Récupération** : Restauration après fermeture/crash

### Intégration avec la RAZ

#### Processus de RAZ complète

1. **Vérification session** : Blocage si fin d'événement non atteinte
2. **Calcul totaux** : `computeTodayTotalsFromDB()`
3. **Fermeture session** : `closeCurrentSession()` avec totaux
4. **RAZ données** : Suppression sélective selon options
5. **Nouvelle session** : `ensureSession()` pour reprise activité

#### Audit et traçabilité

- **Logs détaillés** : Toutes les actions de session sont loggées
- **Horodatage précis** : Timestamps en millisecondes
- **Utilisateur** : Traçabilité de qui ouvre/ferme
- **Totaux archivés** : Conservation des bilans de chaque session

---

## 💾 Persistance et sauvegarde

### Architecture Dexie (IndexedDB)

#### Singleton de base de données

```typescript
// src/db/index.ts
class CaisseDB extends Dexie {
  sales!: Table<SaleDB, number>;
  vendors!: Table<VendorDB, string>;
  cartItems!: Table<CartItemDB, number>;
  stock!: Table<StockDB, string>;
  sessions!: Table<SessionDB, number>;

  constructor() {
    super('CaisseMyConfortDB');
    this.version(1).stores({
      sales: '++id, saleId, vendorId, vendorName, date, year, month, dayOfYear',
      vendors: 'id, name, email',
      cartItems: '++id, itemId, saleId, addedAt',
      stock: 'id, category, lastUpdate',
      sessions: '++id, openedAt, closedAt, openedBy'
    });
  }
}

export const db = new CaisseDB();
```

#### Migration automatique

Le système inclut une migration "one-shot" pour consolider les données :

```typescript
// src/migrations/consolidateOnce.ts
export async function consolidateOnce(): Promise<void> {
  const migrationKey = 'migration_consolidate_once_v1';
  const migrationDone = localStorage.getItem(migrationKey);
  
  if (migrationDone === 'true') return;
  
  try {
    // Migration des ventes
    await migrateSalesFromLocalStorage();
    
    // Migration des vendeuses
    await migrateVendorsFromLocalStorage();
    
    // Marquer comme effectuée
    localStorage.setItem(migrationKey, 'true');
    
    console.log('✅ Migration consolidée effectuée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}
```

### Système de stockage unifié

#### Storage helpers

```typescript
// src/storage/helpers.ts
export const setStorageValue = async <T>(key: string, value: T): Promise<void> => {
  try {
    if (typeof value === 'object' && value !== null) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
  }
};

export const getStorageValue = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    return JSON.parse(item);
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${key}:`, error);
    return defaultValue;
  }
};
```

#### Hook de stockage indexé

```typescript
// src/storage/useIndexedStorage.ts
export function useIndexedStorage<T>(
  key: string, 
  defaultValue: T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue);
  
  useEffect(() => {
    getStorageValue(key, defaultValue).then(setState);
  }, [key, defaultValue]);

  const setValue = useCallback((newValue: T) => {
    setState(newValue);
    setStorageValue(key, newValue);
  }, [key]);

  return [state, setValue];
}
```

### Gestion des sauvegardes

#### Export JSON automatique

```typescript
// Export complet des données avant RAZ
const exportDataBeforeReset = () => {
  const data = {
    exportDate: new Date().toISOString(),
    sales: sales,
    vendorStats: vendorStats,
    invoices: invoices,
    timestamp: Date.now()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `caisse-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
};
```

#### Restauration de sauvegarde

```typescript
// Restauration depuis un fichier JSON
const restoreFromBackup = async (file: File): Promise<void> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validation de la structure
    if (!data.sales || !data.vendorStats) {
      throw new Error('Format de sauvegarde invalide');
    }
    
    // Restauration des données
    await setStorageValue(STORAGE_KEYS.SALES, data.sales);
    await setStorageValue(STORAGE_KEYS.VENDORS_STATS, data.vendorStats);
    
    console.log('✅ Restauration effectuée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    throw error;
  }
};
```

### Clés de stockage centralisées

```typescript
// src/storage/keys.ts
export const STORAGE_KEYS = {
  // Données principales
  VENDOR: 'selectedVendor',
  CART: 'cartItems',
  SALES: 'salesData',
  VENDORS_STATS: 'vendorStats',
  
  // Configuration
  DEMO_MODE: 'demoMode',
  N8N_ENABLED: 'n8nEnabled',
  ELEGANT_MODE: 'elegantMode',
  
  // Sessions et audit
  CURRENT_SESSION: 'currentSession',
  SESSION_HISTORY: 'sessionHistory',
  
  // Cache et performances
  LAST_SYNC: 'lastSyncTimestamp',
  CACHE_VERSION: 'cacheVersion'
} as const;
```

### Stratégies de persistance

#### Double stockage

- **LocalStorage** : Accès rapide et compatibilité
- **IndexedDB** : Stockage structuré et requêtes complexes
- **Synchronisation** : Cohérence entre les deux systèmes

#### Gestion des erreurs

```typescript
// Protection contre les erreurs de stockage
const safeStorageOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Erreur de stockage:', error);
    return fallback;
  }
};
```

#### Nettoyage automatique

- **Données temporaires** : Suppression des caches expirés
- **Optimisation** : Compaction des bases de données
- **Migration** : Mise à jour des structures anciennes

---

## 🛠️ Maintenance et dépannage

### Scripts de diagnostic

#### Diagnostic production

```bash
#!/bin/bash
# diagnostic-production.sh

echo "🔍 DIAGNOSTIC SYSTÈME CAISSE MYCONFORT"
echo "======================================"

# Vérification Node.js
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js non installé"
fi

# Vérification npm
if command -v npm >/dev/null 2>&1; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm non installé"
fi

# Vérification des ports
echo "🔍 Vérification des ports..."
netstat -tulpn | grep :5173 && echo "⚠️  Port 5173 occupé" || echo "✅ Port 5173 libre"
netstat -tulpn | grep :5678 && echo "✅ N8N actif (5678)" || echo "ℹ️  N8N non actif (5678)"

echo "🎯 Diagnostic terminé"
```

#### Nettoyage complet

```bash
#!/bin/bash
# nettoyage-complet.sh

echo "🧹 NETTOYAGE COMPLET CAISSE MYCONFORT"
echo "===================================="

# Arrêt des processus
pkill -f "vite" 2>/dev/null || echo "Aucun processus Vite à arrêter"

# Nettoyage des caches
rm -rf node_modules/.vite
rm -rf dist
echo "✅ Caches Vite nettoyés"

# Réinstallation propre
rm -rf node_modules
npm ci
echo "✅ Dependencies réinstallées"

# Redémarrage
npm run dev &
echo "✅ Application redémarrée"
```

### Debug et logs

#### Configuration des logs

```ini
# .env.development
VITE_LOG_LEVEL=debug
VITE_DEBUG_MODE=true
VITE_CONSOLE_LOGS=true
```

#### Logs de debug utiles

```typescript
// Logs Dexie
console.log('📅 FILTRAGE CA INSTANT', filteredSales.length, 'ventes');
console.log('👥 CALCUL CA PAR VENDEUSE', vendorStats);

// Logs Session
console.log('🔐 Session clôturée et rouverte', session);

// Logs RAZ
console.log('📊 RAZ Action:', action, 'checked:', checked);
console.log('✅ RAZ ventes du jour effectuée');

// Logs N8N
console.log('🔄 Synchronisation N8N démarrée');
console.log('📨 Factures reçues:', invoices.length);
```

#### Console navigateur

##### Commandes utiles

```javascript
// Forcer le mode production
localStorage.setItem('force-production-mode', 'true');

// Activer le mode élégant
localStorage.setItem('elegantMode', 'true');

// Vider le cache
localStorage.clear();

// Vérifier la base Dexie
// Ouvrir l'onglet Application > Storage > IndexedDB
```

### Résolution des problèmes courants

#### Problème : Port 5173 occupé

```bash
# Identifier le processus
lsof -i :5173

# Tuer le processus
kill -9 [PID]

# Ou tuer tous les processus Node
pkill -f node

# Redémarrer
npm run dev
```

#### Problème : N8N non accessible

1. **Vérifier la configuration**
   ```ini
   VITE_N8N_ENABLED=true
   VITE_N8N_TARGET=https://n8n.myconfort.fr
   ```

2. **Tester la connectivité**
   ```bash
   curl -I https://n8n.myconfort.fr/webhook
   ```

3. **Mode fallback**
   ```javascript
   // Console navigateur
   localStorage.setItem('force-production-mode', 'true');
   ```

#### Problème : Données corrompues

1. **Sauvegarde préventive**
   - Onglet RAZ → Export JSON

2. **Reset sélectif**
   ```javascript
   // Console navigateur
   localStorage.removeItem('salesData');
   localStorage.removeItem('vendorStats');
   ```

3. **Reset complet**
   ```javascript
   // Console navigateur
   localStorage.clear();
   // Puis F5 pour recharger
   ```

#### Problème : Performance dégradée

1. **Vider les caches**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

2. **Optimiser IndexedDB**
   ```javascript
   // Console navigateur
   indexedDB.deleteDatabase('CaisseMyConfortDB');
   // Puis F5 pour recréer
   ```

3. **Monitoring mémoire**
   - F12 → Performance → Record
   - Identifier les fuites mémoire

### Scripts de maintenance

#### Reset développement

```bash
#!/bin/bash
# reset-dev.sh

echo "🔄 RESET ENVIRONNEMENT DÉVELOPPEMENT"
echo "=================================="

# Arrêt serveur
pkill -f vite

# Nettoyage
rm -rf node_modules/.vite dist

# Variables par défaut
cat > .env.development << EOF
VITE_ENV=development
VITE_DEMO_MODE=true
VITE_N8N_ENABLED=false
VITE_LOG_LEVEL=debug
EOF

# Redémarrage
npm run dev

echo "✅ Environnement de développement réinitialisé"
```

#### Activation production

```bash
#!/bin/bash
# activer-production.sh

echo "🏭 ACTIVATION MODE PRODUCTION"
echo "============================"

# Configuration production
cat > .env.production << EOF
VITE_ENV=production
VITE_DEMO_MODE=false
VITE_N8N_ENABLED=true
VITE_N8N_TARGET=https://n8n.myconfort.fr
VITE_LOG_LEVEL=error
EOF

# Build production
npm run build

echo "✅ Mode production activé"
echo "🌐 Démarrer avec: npm run preview"
```

---

## 📚 Référence technique

### Architecture des composants

#### Structure des dossiers

```
src/
├── components/          # Composants React
│   ├── ui/             # Composants UI réutilisables
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── FloatingCart.tsx
│   │   └── SuccessNotification.tsx
│   ├── tabs/           # Composants des onglets
│   │   ├── VendorSelection.tsx
│   │   ├── ProductsTab.tsx
│   │   ├── SalesTab.tsx
│   │   ├── CATab.tsx
│   │   ├── CancellationTab.tsx
│   │   ├── MiscTab.tsx
│   │   ├── StockTabElegant.tsx
│   │   └── stock/      # Sous-composants stock
│   │       ├── GeneralStockTab.tsx
│   │       ├── PhysicalStockTab.tsx
│   │       ├── StandEntryTab.tsx
│   │       └── TrailerEntryTab.tsx
│   ├── InvoicesTabCompact.tsx
│   ├── FeuilleDeRAZPro.tsx
│   └── WhatsAppIntegrated.tsx
├── hooks/              # Hooks personnalisés
│   ├── useSyncInvoices.ts
│   └── useIndexedStorage.ts
├── services/           # Services métier
│   ├── sessionService.ts
│   ├── syncService.ts
│   └── externalInvoiceService.ts
├── storage/            # Gestion du stockage
│   ├── index.ts
│   ├── helpers.ts
│   ├── keys.ts
│   └── useIndexedStorage.ts
├── db/                 # Base de données Dexie
│   ├── index.ts
│   └── schema.ts
├── migrations/         # Migrations de données
│   └── consolidateOnce.ts
├── types/              # Types TypeScript
│   └── index.ts
├── data/               # Données statiques
│   ├── constants.ts
│   ├── products.ts
│   └── vendors.ts
├── styles/             # Feuilles de style
│   ├── invoices-tab.css
│   ├── print.css
│   └── compact-stock-tabs.css
└── App.tsx             # Composant principal
```

### Types principaux

#### Sale et SaleDB

```typescript
// Vente en mémoire
interface Sale {
  id: string;
  vendorId: string;
  vendorName: string;
  items: ExtendedCartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: Date | string;
  canceled: boolean;
}

// Vente en base IndexedDB
interface SaleDB extends Omit<Sale, 'date' | 'id'> {
  id?: number;
  saleId: string;
  date: number;        // Timestamp
  dateString: string;  // ISO string
  year: number;
  month: number;
  dayOfYear: number;
}
```

#### Vendor et VendorDB

```typescript
// Vendeuse en mémoire
interface Vendor {
  id: string;
  name: string;
  dailySales: number;
  totalSales: number;
  color: string;
  email?: string;
}

// Vendeuse en base avec stats
interface VendorDB extends Vendor {
  salesCount: number;
  averageTicket: number;
  lastSaleDate?: number;
  lastUpdate: number;
}
```

#### Session

```typescript
interface SessionDB {
  id?: number;
  openedAt: number;
  closedAt?: number;
  openedBy: string;
  closedBy?: string;
  totals?: {
    card: number;
    cash: number;
    cheque: number;
    multi: number;
  };
  eventName?: string;
  eventStart?: number;
  eventEnd?: number;
}
```

### API des services

#### SessionService

```typescript
class SessionService {
  // Garantir une session ouverte
  async ensureSession(openedBy: string, options?: SessionOptions): Promise<SessionDB>;
  
  // Obtenir la session courante
  async getCurrentSession(): Promise<SessionDB | undefined>;
  
  // Fermer la session avec totaux
  async closeCurrentSession(params: CloseSessionParams): Promise<void>;
  
  // Calculer les totaux du jour
  async computeTodayTotalsFromDB(): Promise<PaymentTotals>;
  
  // Mettre à jour les infos d'événement
  async updateCurrentSessionEvent(event: EventInfo): Promise<void>;
}
```

#### SyncService (N8N)

```typescript
class SyncService {
  // Synchroniser les factures
  async syncInvoices(): Promise<Invoice[]>;
  
  // Obtenir les statistiques
  getStats(): SyncStats;
  
  // Reset des factures
  resetInvoices(): void;
  
  // Configuration
  setConfig(config: SyncConfig): void;
}
```

### Hooks personnalisés

#### useSyncInvoices

```typescript
export function useSyncInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const syncInvoices = useCallback(async () => {
    // Logique de synchronisation
  }, []);
  
  return {
    invoices,
    loading,
    error,
    stats: syncService.getStats(),
    syncInvoices,
    resetInvoices: syncService.resetInvoices
  };
}
```

#### useIndexedStorage

```typescript
export function useIndexedStorage<T>(
  key: string, 
  defaultValue: T
): [T, (value: T) => void] {
  // Gestion du stockage avec persistance
}
```

### Configuration et variables

#### Variables d'environnement

```typescript
interface EnvironmentConfig {
  VITE_ENV: 'development' | 'production';
  VITE_DEMO_MODE: boolean;
  VITE_N8N_ENABLED: boolean;
  VITE_N8N_URL: string;
  VITE_N8N_TARGET: string;
  VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}
```

#### Configuration Vite

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: n8nEnabled ? {
      '/api/n8n': {
        target: n8nTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, '')
      }
    } : {}
  }
});
```

### Patterns et conventions

#### Barrel exports

```typescript
// src/components/index.ts
export * from './ui';
export * from './tabs';

// src/storage/index.ts
export * from './helpers';
export * from './keys';
export * from './useIndexedStorage';
```

#### Error handling

```typescript
// Pattern de gestion d'erreur standard
const safeAsyncOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    return fallback;
  }
};
```

#### State management

```typescript
// Pattern de state local avec persistance
const [state, setState] = useIndexedStorage<StateType>(
  STORAGE_KEYS.STATE_KEY,
  defaultValue
);

const updateState = useCallback((newValue: StateType) => {
  setState(newValue);
  // Actions supplémentaires si nécessaire
}, [setState]);
```

### Performance et optimisation

#### Lazy loading

```typescript
// Chargement paresseux des composants
const FeuilleDeRAZPro = React.lazy(() => import('./FeuilleDeRAZPro'));
const InvoicesTabCompact = React.lazy(() => import('./InvoicesTabCompact'));
```

#### Memoization

```typescript
// Mémorisation des calculs coûteux
const expensiveCalculation = useMemo(() => {
  return computeComplexStatistics(sales, invoices);
}, [sales, invoices]);

// Mémorisation des callbacks
const memoizedCallback = useCallback((param: string) => {
  // Action coûteuse
}, [dependency]);
```

#### Virtualisation

```typescript
// Pour les listes importantes
const VirtualizedList = React.memo(({ items }) => {
  // Implémentation avec react-window ou équivalent
});
```

---

## 🎯 Conclusion

Ce guide complet couvre tous les aspects de l'application **Caisse MyConfort**, de l'installation à l'utilisation avancée, en passant par la maintenance et le dépannage. L'application représente un système de caisse moderne et robuste, parfaitement adapté aux besoins événementiels.

### Points forts de l'application

- ✅ **Architecture moderne** : React 18 + TypeScript + Vite
- ✅ **Persistance robuste** : Dexie + LocalStorage avec migration automatique
- ✅ **Interface intuitive** : Navigation claire et feedback visuel
- ✅ **Gestion complète** : Vendeuses, produits, stock, sessions
- ✅ **Intégration N8N** : Synchronisation automatique des factures
- ✅ **Export professionnel** : PDF, email, impression, WhatsApp
- ✅ **Mode hors ligne** : Fonctionnement sans connexion internet
- ✅ **Audit trail** : Traçabilité complète des actions

### Évolutions possibles

- 🔮 **Mode sombre** : Thème alternatif pour conditions de faible éclairage
- 📊 **Analytics avancés** : Graphiques et tableaux de bord étendus
- 🔄 **Synchronisation cloud** : Backup automatique sur serveur distant
- 📱 **PWA** : Installation sur appareil mobile comme app native
- 🎨 **Thèmes personnalisables** : Customisation complète de l'interface
- 🔐 **Authentification** : Système de connexion multi-utilisateurs
- 📈 **Reporting avancé** : Exports Excel et rapports périodiques

### Support et maintenance

Pour toute question ou problème :

1. **Consulter ce guide** : Couvre la plupart des cas d'usage
2. **Vérifier les logs** : Console navigateur (F12)
3. **Scripts de diagnostic** : `./diagnostic-production.sh`
4. **Reset sélectif** : Console → `localStorage.clear()`
5. **Documentation code** : Commentaires intégrés dans le code source

---

**Guide généré automatiquement le 10 août 2025**  
**Version de l'application :** Caisse MyConfort v3.x  
**Technologies :** React 18 + TypeScript + Vite + Dexie + N8N

> **📞 Support technique** : En cas de problème non couvert par ce guide, consulter les logs de la console navigateur et les fichiers de configuration `.env.development`.

> **🔧 Développement** : Le code source est entièrement documenté avec des commentaires explicites pour faciliter la maintenance et les évolutions futures.
