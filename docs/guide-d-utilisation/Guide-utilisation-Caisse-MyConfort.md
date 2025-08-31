# Guide d'Utilisation - Caisse MyConfort

## Table des matières
1. [Présentation générale](#1-présentation-générale)
2. [Pré-requis & démarrage](#2-pré-requis--démarrage)
3. [Onglets - Mode d'emploi](#3-onglets---mode-demploi)
4. [Factures & N8N](#4-factures--n8n)
5. [Sessions](#5-sessions)
6. [Sauvegardes & restauration](#6-sauvegardes--restauration)
7. [Dépannage](#7-dépannage)
8. [Annexes](#8-annexes)

---

## 1. Présentation générale

### Qu'est-ce que Caisse MyConfort ?

**Caisse MyConfort** est une application de caisse événementielle moderne construite avec React, TypeScript et Vite. Elle permet de gérer les ventes lors d'événements avec un suivi complet des vendeuses, des produits et des statistiques.

![Écran d'accueil](docs/img/accueil.png)

### Technologies utilisées

- **Frontend** : React 18 + TypeScript + Vite
- **Stockage** : Dexie (IndexedDB) pour la persistance locale
- **Intégration** : N8N pour la synchronisation des factures
- **UI** : Lucide React (icônes) + CSS moderne
- **Export** : html2canvas, jsPDF, react-to-print

### Principe du stockage local

L'application utilise **Dexie** (surcouche d'IndexedDB) pour stocker toutes les données localement :
- ✅ **Vendeuses** : Informations, couleurs, statistiques
- ✅ **Ventes** : Historique complet des transactions
- ✅ **Panier** : Articles en cours de vente
- ✅ **Sessions** : Gestion des sessions de travail
- ✅ **Factures** : Synchronisation avec N8N

### Sessions de travail

L'application fonctionne par **sessions** :
- **Ouverture** : Démarrage d'une nouvelle période de vente
- **Gestion d'événement** : Nom, dates de début/fin d'événement
- **Clôture** : Finalisation avec totaux par moyen de paiement
- **Audit** : Historique complet des actions

---

## 2. Pré-requis & démarrage

### Installation et lancement local

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev
```

L'application démarre par défaut sur **http://localhost:5173**. Si ce port est occupé, Vite basculera automatiquement sur 5174, 5175, etc.

### Variables d'environnement

Fichier `.env.development` :

```ini
# Configuration générale
VITE_ENV=development
VITE_DEMO_MODE=true
VITE_DISABLE_DEMO_DATA=false

# Configuration N8N
VITE_N8N_ENABLED=true|false      # Active/désactive la sync N8N
VITE_N8N_URL=/api/n8n            # Endpoint proxy pour N8N
VITE_N8N_TARGET=http://localhost:5678  # URL cible N8N

# Logs
VITE_LOG_LEVEL=debug
```

### Proxy N8N (vite.config.ts)

Le proxy Vite redirige automatiquement `/api/n8n` vers l'instance N8N locale :

```typescript
proxy: n8nEnabled && isDev ? {
  '/api/n8n': {
    target: n8nTarget,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/n8n/, '')
  }
} : {}
```

### Premier démarrage

1. **Sélection obligatoire** : Choisir une vendeuse avant toute action
2. **Navigation** : 10 onglets disponibles via la barre de navigation
3. **Panier flottant** : Accessible en permanence en bas de l'écran
4. **Notifications** : Feedback visuel pour toutes les actions

![Navigation principale](docs/img/navigation.png)

---

## 3. Onglets - Mode d'emploi

### 3.1 Onglet Vendeuse

![Écran Vendeuse](docs/img/vendeuse.png)

**Objectif** : Sélectionner la vendeuse active pour les ventes

#### Interface principale

- **Message d'accueil** : "Sélection de la vendeuse (OBLIGATOIRE)"
- **Liste des vendeuses** : Cartes avec nom, couleur distinctive et statistiques
- **Informations affichées** : 
  - Ventes du jour (en euros)
  - Nombre total de ventes
  - Couleur personnalisée

#### Actions disponibles

✅ **Sélectionner une vendeuse** : Clic sur une carte
✅ **Voir les statistiques** : Totaux affichés sur chaque carte

> **⚠️ Règle importante** : Aucune vente ne peut être effectuée sans sélectionner une vendeuse. Le panier reste bloqué tant qu'aucune vendeuse n'est active.

---

### 3.2 Onglet Produits

![Écran Produits](docs/img/produits.png)

**Objectif** : Ajouter des articles au panier

#### Interface

- **Barre de recherche** : Filtrage en temps réel par nom de produit
- **Catalogue complet** : 49 produits organisés par catégories
- **Catégories disponibles** :
  - Matelas (10 produits)
  - Sur-matelas (9 produits)
  - Oreillers (14 produits)
  - Couettes (2 produits)
  - Plateaux (10 produits)
  - Accessoires (5 produits)

#### Fonctionnement

✅ **Recherche** : Tapez le nom d'un produit dans la barre de recherche
✅ **Ajout au panier** : Clic sur "Ajouter" → Crée une nouvelle ligne d'article
✅ **Gestion quantités** : Chaque clic crée une ligne séparée (pas d'incrémentation automatique)

> **💡 Astuce** : Chaque ajout crée une ligne indépendante dans le panier. Pour modifier les quantités, utilisez le panier flottant.

---

### 3.3 Onglet Factures

![Écran Factures](docs/img/factures.png)

**Objectif** : Consulter les factures synchronisées via N8N

#### Vues disponibles

1. **Vue Compacte** : Toutes les factures (internes + N8N) en lignes compactes
2. **Vue Externes** : Factures reçues via N8N uniquement  
3. **Vue Détails** : Affichage détaillé d'une facture sélectionnée

#### Statistiques en temps réel

- **Nombre total** de factures
- **Chiffre d'affaires** global
- **Répartition** internes/externes
- **Factures reçues** aujourd'hui

#### Mode Élégant ✨

Un bouton en haut à droite permet de basculer vers un **mode élégant** avec :
- Interface modernisée (glassmorphism)
- Animations fluides
- Design sophistiqué
- Toutes les fonctionnalités préservées

> **🔄 Synchronisation** : Les factures se synchronisent automatiquement toutes les 30 secondes si N8N est activé.

---

### 3.4 Onglet Stock

![Écran Stock](docs/img/stock.png)

**Objectif** : Gestion complète des inventaires

#### Modes de vue

L'onglet Stock propose **3 modes de navigation** :

1. **Vue Cartes** (par défaut) : Navigation avec cartes élégantes et colorées
2. **Vue Compacte** : Cartes plus petites sans descriptions  
3. **Vue Horizontale** : Navigation avec boutons horizontaux compacts

#### Sous-onglets disponibles

- **Général** : Stock principal avec déductions automatiques N8N
- **Stand** : Stock physique sur le stand  
- **Remorque** : Stock en attente dans la remorque
- **Physique** : Inventaire physique et comptages

#### Statistiques affichées

- **89% Stock OK** : Produits disponibles
- **12 Stock faible** : Alertes de rupture
- **€45,280 Valeur totale** : Valorisation du stock
- **142 Références** : Nombre de produits différents

---

### 3.5 Onglet Ventes

![Écran Ventes](docs/img/ventes.png)

**Objectif** : Historique et suivi des ventes

#### Informations affichées

Pour chaque vente :
- **Vendeuse** : Nom et couleur
- **Articles** : Liste détaillée des produits
- **Total** : Montant en euros
- **Moyen de paiement** : Carte, espèces, chèque, mixte
- **Date et heure** : Horodatage précis
- **Statut** : Validée ou annulée

#### Fonctionnalités

✅ **Consultation** : Liste chronologique des ventes
✅ **Filtrage** : Par vendeuse, date, montant
✅ **Statistiques** : Totaux par vendeuse et moyen de paiement

---

### 3.6 Onglet Diverses

![Écran Diverses](docs/img/diverses.png)

**Objectif** : Ajouter des lignes personnalisées au panier

#### Interface

- **Champ Description** : Nom de l'article divers
- **Champ Montant** : Prix en euros
- **Bouton Ajouter** : Validation et ajout au panier

#### Validations

⚠️ **Description obligatoire** : Le champ ne peut pas être vide
⚠️ **Montant valide** : Doit être un nombre positif
⚠️ **Format numérique** : Accepte les décimales (ex: 15.50)

#### Utilisation typique

- Produits hors catalogue
- Services additionnels
- Remises ou suppléments
- Articles exceptionnels

---

### 3.7 Onglet Annulation

![Écran Annulation](docs/img/annulation.png)

**Objectif** : Gestion des annulations et du panier

#### Fonctionnalités disponibles

##### Gestion du panier

✅ **Vider le panier** : Supprime tous les articles en cours
✅ **Modifier quantités** : Mise à jour ou suppression (si quantité = 0)
✅ **Voir le total** : Calcul automatique du montant

##### Annulation de ventes

✅ **Annuler la dernière vente** : `cancelLastSale()`
✅ **Annuler une vente spécifique** : `cancelSpecificSale(saleId)`

#### Impacts des annulations

Quand une vente est annulée :
- ❌ **Statut** : Marquée comme `canceled: true`
- 📉 **Stats vendeuse** : Décrément de `totalSales` et `dailySales`
- 💰 **Chiffre d'affaires** : Soustraction du montant
- 📊 **Historique** : Vente conservée mais marquée annulée

> **⚠️ Attention** : Les annulations sont définitives et impactent immédiatement les statistiques.

---

### 3.8 Onglet CA (Chiffre d'Affaires)

![Écran CA](docs/img/ca.png)

**Objectif** : Indicateurs de performance en temps réel

#### CA Global affiché

- **Montant total** : Somme des ventes du jour (caisse + factures N8N)
- **Nombre de ventes** : Compteur des transactions
- **Mise à jour** : Calcul automatique et instantané

#### CA par Vendeuse

##### Informations par vendeuse

- **Nom** avec couleur distinctive
- **Chiffre d'affaires** : Montant total du jour
- **Nombre de ventes** : Compteur des transactions
- **Pourcentage** : Part du CA total
- **Panier moyen** : CA ÷ nombre de ventes

##### Classement et badges

- **Top 3** : Badges or/argent/bronze pour les meilleures vendeuses
- **Tri automatique** : Classement par CA décroissant
- **Barre de progression** : Visualisation des performances relatives

#### Statistiques récapitulatives

- **Vendeuses actives** : Nombre ayant réalisé des ventes
- **Panier moyen** : Montant moyen par transaction
- **CA moyen par vendeuse** : Répartition équitable théorique

> **📊 Calcul intelligent** : Seules les ventes du jour sont comptabilisées via `isToday(sale.date)`.

---

### 3.9 Onglet Gestion

![Écran Gestion](docs/img/gestion.png)

**Objectif** : Administration des vendeuses

#### Ajouter une vendeuse

##### Formulaire d'ajout

- **Nom** (obligatoire) : Prénom et nom de la vendeuse
- **Email** (optionnel) : Adresse de contact
- **Couleur** (obligatoire) : Sélection parmi 20 couleurs disponibles

##### Sélecteur de couleurs

- **Palette de 20 couleurs** : Couleurs prédéfinies harmonieuses
- **Gestion des conflits** : Couleurs déjà utilisées grisées
- **Indicateur disponibilité** : "Disponibles : X/20"

#### Gestion des vendeuses existantes

##### Actions disponibles

✅ **Édition** : Modifier nom, email, couleur (bouton ✏️)
✅ **Suppression** : Supprimer définitivement (bouton 🗑️)
✅ **Sélection** : Clic sur une carte pour l'activer

##### Mode édition

- **Formulaire in-line** : Modification directe dans la carte
- **Validation** : Nom obligatoire, couleur obligatoire
- **Aperçu temps réel** : Changements visibles immédiatement

##### Confirmation de suppression

- **Modal sécurisée** : Demande de confirmation explicite
- **Avertissement** : Action irréversible
- **Préservation des données** : Les ventes associées sont conservées

#### Règles de gestion

⚠️ **ID unique** : Généré automatiquement (`vendor-{timestamp}-{random}`)
⚠️ **Couleur unique** : Une seule vendeuse par couleur
⚠️ **Nom obligatoire** : Minimum 1 caractère non vide
⚠️ **Persistance** : Sauvegarde automatique dans IndexedDB

---

### 3.10 Onglet RAZ (Remise À Zéro)

![Écran RAZ](docs/img/raz.png)

**Objectif** : Feuille de caisse professionnelle et remise à zéro

#### Interface principale

##### Feuille de caisse

- **Statistiques complètes** : CA, ventes, moyennes par vendeuse
- **Réglements à venir** : Échéances et montants
- **Informations session** : Nom d'événement, dates de début/fin
- **Export automatique** : PDF, email, WhatsApp

##### Destinataire email par défaut

- **Configuration** : Adresse email de réception
- **Format** : `contact@myconfort.example.com` 
- **Utilisation** : Export automatique des rapports

#### Gestion des événements

##### Champs événement

- **Nom de l'événement** : Description de la manifestation
- **Date de début** : Date/heure d'ouverture  
- **Date de fin** : Date/heure de clôture

##### Blocage de clôture

⚠️ **Règle de sécurité** : La session ne peut pas être clôturée avant la date de fin d'événement prévue.

#### Système RAZ avancé

##### Options disponibles

1. **Ventes du jour** : Remet à zéro les chiffres d'affaires quotidiens ✅
2. **Panier actuel** : Vide le panier en cours (X articles) ✅  
3. **Factures N8N** : Efface les factures synchronisées ✅
4. **Vendeuse sélectionnée** : Désélectionne la vendeuse active
5. **Statistiques vendeuses** : ⚠️ Remet à zéro TOUTES les statistiques
6. **RAZ COMPLÈTE** : 🚨 DANGER - Supprime TOUTES les données

##### Processus d'exécution

1. **Sélection** : Cocher les options désirées
2. **Aperçu** : Liste des actions qui seront effectuées
3. **Export préventif** : Sauvegarde JSON automatique avant RAZ
4. **Confirmation** : Validation explicite des actions
5. **Exécution** : Animation de progression avec feedback
6. **Finalisation** : Modal de succès et retour au dashboard

#### Export et sauvegarde

##### Format JSON d'export

```json
{
  "exportDate": "2025-08-10T17:30:15.383Z",
  "sales": [...],           // Historique des ventes
  "vendorStats": [...],     // Statistiques vendeuses
  "selectedVendor": {...},  // Vendeuse active
  "cart": [...],           // Panier en cours
  "metadata": {
    "totalSales": 5,
    "totalVendors": 8,
    "cartItems": 0,
    "exportVersion": "1.0.0"
  }
}
```

##### Options d'export

✅ **Téléchargement local** : Fichier JSON sur l'appareil
✅ **Impression** : Via react-to-print et navigateur
✅ **Email** : Envoi automatique si configuré
✅ **Export PDF** : Génération via html2canvas + jsPDF

#### Gestion des sessions

##### Actions sur les sessions

- **`sessionService.ensureSession('app')`** : Garantit une session ouverte
- **`sessionService.closeCurrentSession()`** : Ferme la session active
- **`sessionService.computeTodayTotalsFromDB()`** : Calcule les totaux du jour

##### RAZ complète et sessions

Lors d'une RAZ complète :
1. **Clôture** : Fermeture de la session en cours
2. **Ouverture** : Création d'une nouvelle session pour la reprise
3. **Logs** : Traçabilité complète des actions

> **🔐 Sécurité** : Toutes les actions RAZ sont loggées avec horodatage et utilisateur.

---

## 4. Factures & N8N

### Intégration N8N

#### Configuration

L'intégration N8N permet de synchroniser automatiquement les factures depuis un système externe :

**Variables d'environnement :**
```ini
VITE_N8N_ENABLED=true                    # Active la synchronisation
VITE_N8N_URL=/api/n8n                   # Endpoint proxy
VITE_N8N_TARGET=http://localhost:5678   # URL de l'instance N8N
```

#### Fonctionnement du polling

- **Fréquence** : Toutes les 30 secondes
- **Hook** : `useSyncInvoices()` 
- **Endpoint** : `/sync/invoices` (proxifié vers N8N)
- **Gestion d'erreur** : Arrêt automatique en cas d'échec répétés

#### États de synchronisation

- **`idle`** : En attente
- **`syncing`** : Synchronisation en cours  
- **`error`** : Erreur de communication
- **`ECONNREFUSED`** : N8N non démarré (normal)

### Gestion des factures

#### Types de factures

1. **Factures internes** : Créées par l'application de caisse
2. **Factures N8N** : Reçues depuis le système externe
3. **Factures mixtes** : Combinaison des deux sources

#### Statuts disponibles

- **`pending`** : En attente
- **`partial`** : Partiellement traitée
- **`delivered`** : Livrée
- **`cancelled`** : Annulée

#### Reset des factures

##### Reset local (IndexedDB)

```typescript
const { resetInvoices } = useSyncInvoices();
resetInvoices(); // Vide le cache local
```

##### Reset côté N8N

Le reset local ne supprime pas les données à la source N8N. Pour un reset complet :
1. Vider le cache local via l'application
2. Purger les données côté N8N (Data Store/Google Sheet/autre)
3. Relancer la synchronisation

### Bonnes pratiques

#### Pendant les tests

1. **Désactiver le polling** : `VITE_N8N_ENABLED=false`
2. **Vider la source N8N** : Supprimer les données test
3. **Reset local** : Utiliser la fonction de reset des factures
4. **Vérifier les logs** : Surveiller la console pour les erreurs

#### En production

1. **Surveillance** : Vérifier régulièrement les logs de sync
2. **Sauvegarde** : Exporter les données avant les resets
3. **Monitoring** : Alertes en cas d'échec de synchronisation

---

## 5. Sessions

### Concept des sessions

Les **sessions** représentent des périodes de travail définies avec :
- Date/heure d'ouverture et de clôture
- Utilisateur responsable
- Totaux par moyen de paiement
- Informations d'événement (optionnel)

### Service de gestion

#### SessionService API

```typescript
// Garantir une session ouverte
const session = await sessionService.ensureSession('app');

// Obtenir la session courante
const current = await sessionService.getCurrentSession();

// Ouvrir une nouvelle session
const newSession = await sessionService.openSession('username');

// Fermer la session avec totaux
await sessionService.closeCurrentSession({
  closedBy: 'username',
  totals: { card: 1500, cash: 300, cheque: 200 }
});

// Calculer les totaux du jour
const totals = await sessionService.computeTodayTotalsFromDB();
// Retourne: { card: number, cash: number, cheque: number }
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

#### Indicateurs de session

Selon le code, il semble que la gestion des sessions soit principalement en arrière-plan. Les indicateurs visuels de session (ouverte/fermée) ne sont pas explicitement définis dans l'UI principale.

#### Session dans la RAZ

La page RAZ affiche et permet de gérer :
- **Nom de l'événement**
- **Dates de début/fin** 
- **Blocage de clôture** avant la fin d'événement
- **Clôture de session** lors de la RAZ complète

### Automatismes

#### À l'amorçage

```typescript
// Dans main.tsx
await consolidateOnce(); // Migration one-shot
await sessionService.ensureSession('app'); // Session garantie
```

#### Pendant l'utilisation

- **Session garantie** : `ensureSession()` appelé côté app
- **Calculs automatiques** : Totaux recalculés à la demande
- **Persistance** : Sauvegarde automatique dans IndexedDB

---

## 6. Sauvegardes & restauration

### Export JSON automatique

#### Fonctionnement

L'application propose un **export JSON complet** via la fonction `exportDataBeforeReset()` :

```typescript
const dataToExport = {
  exportDate: new Date().toISOString(),
  sales: sales,                    // Historique des ventes
  vendorStats: vendorStats,        // Statistiques vendeuses  
  selectedVendor: selectedVendor,  // Vendeuse active
  cart: cart,                      // Panier en cours
  metadata: {
    totalSales: sales.length,
    totalVendors: vendorStats.length,
    cartItems: cart.length,
    exportVersion: '1.0.0'
  }
};
```

#### Déclenchement automatique

L'export est **automatiquement proposé** avant chaque RAZ pour sécuriser les données.

#### Format du fichier

- **Nom** : `myconfort-backup-YYYY-MM-DD.json`
- **Contenu** : JSON structuré avec toutes les données
- **Métadonnées** : Version, compteurs, horodatage

### Restauration manuelle

#### Méthode recommandée

L'application ne propose pas de fonction de restauration intégrée. Pour restaurer des données :

1. **Accéder aux DevTools** : F12 → Application → IndexedDB
2. **Localiser la base** : `MyConfortCaisseV2`
3. **Vider les tables** : Suppression manuelle des données existantes
4. **Injection manuelle** : Via console ou script personnalisé

#### Script de restauration type

```javascript
// À adapter selon le format de sauvegarde
const backupData = JSON.parse(backupContent);

// Restaurer les ventes
await db.sales.bulkAdd(backupData.sales);

// Restaurer les statistiques vendeuses  
await db.vendorStats.bulkAdd(backupData.vendorStats);

// Restaurer le panier
await db.cart.bulkAdd(backupData.cart);
```

### Alternatives de sauvegarde

#### Export PDF/Email

La feuille de RAZ propose des exports supplémentaires :
- **PDF** : Génération via html2canvas + jsPDF
- **Email** : Envoi automatique si configuré
- **Impression** : Via react-to-print

#### Sauvegarde navigateur

Les données IndexedDB sont automatiquement sauvegardées par le navigateur, mais peuvent être perdues en cas de :
- Suppression du cache navigateur
- Navigation privée
- Quota de stockage dépassé

> **💡 Recommandation** : Effectuer des exports JSON réguliers pour sécuriser les données importantes.

---

## 7. Dépannage

### Problèmes courants

#### Port 5173 occupé

**Symptôme** : Message "Port 5173 is in use, trying another one..."

**Solutions** :
```bash
# Identifier le processus qui utilise le port
lsof -ti:5173

# Tuer le processus
kill -9 $(lsof -ti:5173)

# Ou forcer un port spécifique
npm run dev -- --port 5174
```

#### Erreur ECONNREFUSED N8N

**Symptôme** : `[vite] http proxy error: /sync/invoices - ECONNREFUSED`

**Diagnostic** :
- ✅ **Normal** si N8N n'est pas démarré
- ✅ **Configuration correcte** : l'app essaie bien de se connecter

**Solutions** :
1. **Démarrer N8N** sur localhost:5678
2. **Désactiver temporairement** : `VITE_N8N_ENABLED=false`
3. **Vérifier la configuration** : URL cible et endpoint

#### Problèmes de cache/HMR

**Symptôme** : Modifications non prises en compte, erreurs de build

**Solutions** :
```bash
# Nettoyer le cache Vite
rm -rf node_modules/.vite

# Forcer la reconstruction
npm run dev -- --force

# En cas de problème persistant
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

#### Problèmes IndexedDB

**Symptôme** : Données perdues, erreurs de persistance

**Diagnostic** :
1. **DevTools** : F12 → Application → IndexedDB
2. **Vérifier la base** : `MyConfortCaisseV2` 
3. **Contrôler les tables** : sales, vendorStats, cart, sessions

**Solutions** :
```javascript
// Vider complètement IndexedDB (console navigateur)
indexedDB.deleteDatabase('MyConfortCaisseV2');

// Redémarrer l'application pour recréer la base
location.reload();
```

### Erreurs de développement

#### Erreurs TypeScript/ESLint

**Vérification** :
```bash
# Contrôle TypeScript
npx tsc --noEmit

# Contrôle ESLint  
npm run lint
```

#### Erreurs d'import

**Symptômes** : Module not found, imports non résolus

**Vérifications** :
- Alias `@` configuré dans `vite.config.ts`
- Chemins corrects dans `tsconfig.json`
- Barrel exports dans `/src/*/index.ts`

### Problèmes de performance

#### Application lente

**Causes possibles** :
- IndexedDB surchargée (trop de données)
- Polling N8N trop fréquent
- Animations CSS trop nombreuses

**Solutions** :
1. **Nettoyer les données** : RAZ et export préventif
2. **Désactiver N8N** temporairement
3. **Réduire les animations** : Mode simple

#### Mémoire saturée

**Symptômes** : Onglets qui plantent, lenteurs

**Solutions** :
- Fermer les autres onglets du navigateur
- Redémarrer le navigateur
- Vider le cache navigateur

### Debug et logs

#### Console navigateur

- **Logs Dexie** : `📅 FILTRAGE CA INSTANT`, `👥 CALCUL CA PAR VENDEUSE`
- **Logs Session** : `🔐 Session clôturée et rouverte`
- **Logs RAZ** : `📊 RAZ Action:`, `✅ RAZ ventes du jour effectuée`

#### Variables de debug

```ini
VITE_LOG_LEVEL=debug  # Active les logs détaillés
```

#### Commandes utiles

```bash
# Vérifier les processus Node
ps aux | grep node

# Vérifier les ports occupés
netstat -tulpn | grep :5173

# Redémarrer complètement
pkill -f "vite"
npm run dev
```

---

## 8. Annexes

### Formats et conventions

#### Formats monétaires

- **Devise** : Euro (€)
- **Précision** : 2 décimales
- **Affichage** : `1234.56€` ou `1 234,56€`
- **Calculs** : JavaScript Number (pas de gestion spécifique des arrondis)

#### Dates et heures

- **Format ISO** : `2025-08-10T17:30:15.383Z`
- **Affichage** : Selon la locale du navigateur
- **Comparaisons** : `new Date().toDateString()` pour filtrer par jour

### Raccourcis et navigation

#### Navigation clavier

L'interface est optimisée pour le tactile (iPad), mais supporte :
- **Tab** : Navigation entre éléments
- **Enter** : Validation des formulaires
- **Esc** : Fermeture des modals

#### Gestes tactiles

- **Clic/Tap** : Sélection et validation
- **Scroll** : Navigation dans les listes
- **Pinch** : Zoom (selon le navigateur)

### Architecture des données

#### Schema Dexie simplifié

```typescript
// Tables principales
interface MyConfortDB extends Dexie {
  sales: Table<Sale>;           // Ventes
  vendorStats: Table<Vendor>;   // Vendeuses et stats
  cart: Table<CartItem>;        // Panier
  sessions: Table<SessionDB>;   // Sessions de travail
}

// Types principaux
interface Sale {
  id: string;
  vendorId: string;
  vendorName: string;
  items: ExtendedCartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: Date;
  canceled: boolean;
}

interface Vendor {
  id: string;
  name: string;
  dailySales: number;
  totalSales: number;
  color: string;
  email?: string;
}
```

### Glossaire

#### Termes métier

- **Vendeuse** : Personne responsable des ventes, identifiée par nom et couleur
- **Vente** : Transaction finalisée avec vendeuse, articles, total et moyen de paiement
- **Panier** : Collection d'articles en cours de vente avant validation
- **Facture** : Document commercial, peut venir de la caisse ou de N8N
- **Session** : Période de travail définie avec ouverture/clôture et totaux

#### Termes techniques

- **RAZ** : Remise À Zéro, réinitialisation partielle ou complète des données
- **N8N** : Plateforme d'automatisation pour l'intégration de données externes
- **Dexie** : Surcouche JavaScript d'IndexedDB pour la persistance locale
- **IndexedDB** : Base de données locale du navigateur
- **Vite** : Outil de build et serveur de développement moderne
- **HMR** : Hot Module Replacement, rechargement à chaud en développement

#### États et statuts

- **Pending** : En attente de traitement
- **Partial** : Partiellement traité ou livré
- **Delivered** : Complètement traité et livré
- **Canceled** : Annulé ou supprimé
- **Idle** : Au repos, en attente
- **Syncing** : Synchronisation en cours

---

**Guide généré automatiquement le 10 août 2025**  
**Version de l'application :** Caisse MyConfort v3.x  
**Technologies :** React 18 + TypeScript + Vite + Dexie + N8N

> **📞 Support** : En cas de problème non couvert par ce guide, consulter les logs de la console navigateur et les fichiers de configuration `.env.development`.
