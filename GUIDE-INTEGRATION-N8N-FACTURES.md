# 🔗 Guide d'Intégration N8N avec MyConfort

## 📋 Vue d'ensemble

Ce guide explique comment intégrer le workflow N8N existant avec le nouveau système de factures externes MyConfort. Votre workflow continuera de fonctionner normalement, mais enverra également les données vers l'application de caisse pour un affichage unifié.

## 🎯 Objectif

- ✅ Conserver votre workflow N8N actuel
- ✅ Ajouter l'envoi vers MyConfort en parallèle
- ✅ Affichage unifié des factures dans l'application
- ✅ Design compact optimisé tablette
- ✅ Synchronisation en temps réel

## 🛠️ Étapes d'intégration

### 1. Préparation de l'endpoint MyConfort

Déployez le fichier `invoice-receiver-api.ts` sur votre plateforme :
- Cloudflare Workers
- Vercel Edge Functions
- Netlify Functions

**URL d'exemple :** `https://votre-domaine.com/api/receive-invoice`

### 2. Configuration du token d'authentification

Générez un token sécurisé pour l'authentification :
```bash
# Générer un token aléatoire
openssl rand -hex 32
```

Configurez ce token dans :
- Votre endpoint API (variable d'environnement `AUTH_TOKEN`)
- Votre workflow N8N (en-tête `X-Auth-Token`)

### 3. Modification du workflow N8N

#### 3.1 Ajouter un nœud Code

Après votre nœud de traitement des données existant, ajoutez un nœud **Code** avec le contenu suivant :

```javascript
// Conversion des données pour l'API MyConfort
const invoiceData = {
  invoiceNumber: $json.numero_facture,
  invoiceDate: $json.date_facture,
  client: {
    name: $json.nom_du_client,
    email: $json.email_client,
    phone: $json.telephone_client,
    address: $json.adresse_client,
    postalCode: $json.client_code_postal,
    city: $json.client_ville,
    siret: $json.client_siret
  },
  items: $json.produits.map(p => ({
    sku: `${$json.numero_facture}-${p.nom.replace(/\\s+/g, '-')}`,
    name: p.nom,
    qty: p.quantite,
    unitPriceHT: p.prix_ht,
    tvaRate: p.taux_tva / 100
  })),
  totals: {
    ht: $json.montant_ht,
    tva: $json.montant_tva,
    ttc: $json.montant_ttc
  },
  payment: {
    method: $json.mode_paiement,
    paid: $json.acompte >= $json.montant_ttc || $json.montant_restant === 0,
    paidAmount: $json.acompte || 0,
    depositRate: $json.acompte ? $json.acompte / $json.montant_ttc : 0
  },
  channels: {
    source: $json.lieu_evenement || 'MyConfort',
    via: 'N8N Webhook'
  },
  pdfBase64: $json.fichier_facture,
  idempotencyKey: $json.numero_facture
};

// Brancher en parallèle : données originales + données converties
return [
  { json: $json },              // Flux principal (email, sheets, etc.)
  { json: invoiceData }         // Nouveau flux vers MyConfort
];
```

#### 3.2 Ajouter un nœud HTTP Request

Connectez le **second output** du nœud Code vers un nouveau nœud **HTTP Request** :

**Configuration :**
- **Method :** POST
- **URL :** `https://votre-domaine.com/api/receive-invoice`
- **Headers :**
  ```json
  {
    "Content-Type": "application/json",
    "X-Auth-Token": "votre-token-secret"
  }
  ```
- **Body :** `={{ JSON.stringify($json) }}`
- **Options :**
  - Timeout: 30000ms
  - Retry on failure: Oui (3 tentatives)

### 4. Test de l'intégration

#### 4.1 Test avec données fictives

Créez une facture de test avec ces données minimales :

```json
{
  "numero_facture": "TEST-001",
  "date_facture": "2025-08-09",
  "nom_du_client": "Client Test",
  "email_client": "test@email.com",
  "telephone_client": "06 12 34 56 78",
  "produits": [{
    "nom": "Matelas Test",
    "quantite": 1,
    "prix_ht": 1000,
    "prix_ttc": 1200,
    "taux_tva": 20
  }],
  "montant_ht": 1000,
  "montant_tva": 200,
  "montant_ttc": 1200,
  "mode_paiement": "carte bleue"
}
```

#### 4.2 Vérification dans MyConfort

1. Ouvrez l'application MyConfort
2. Allez dans l'onglet **Factures**
3. Cliquez sur **Vue Compacte** ou **Externes**
4. Votre facture de test doit apparaître avec le badge "Externe"

## 🎨 Interface utilisateur

### Design compact optimisé tablette

L'application affiche maintenant les factures avec :
- **Vue Compacte** : Toutes les factures (internes + externes) en lignes compactes
- **Vue Externes** : Factures reçues via N8N uniquement
- **Vue Détails** : Affichage détaillé d'une facture sélectionnée

### Statistiques en temps réel

- Nombre total de factures
- Chiffre d'affaires global
- Répartition internes/externes
- Factures reçues aujourd'hui

## 🔍 Dépannage

### Problèmes courants

**❌ Erreur 401 Unauthorized**
- Vérifiez que le token `X-Auth-Token` est correct
- Assurez-vous que le token est configuré côté API

**❌ Erreur 400 Bad Request**
- Vérifiez la structure des données envoyées
- Assurez-vous que `numero_facture` et `nom_du_client` sont présents

**❌ Facture non visible dans MyConfort**
- Vérifiez les logs de l'endpoint API
- Testez la synchronisation manuelle dans l'interface
- Vérifiez que l'`idempotencyKey` est unique

### Logs et monitoring

```javascript
// Ajouter dans le nœud Code pour debug
console.log('Données converties pour MyConfort:', JSON.stringify(invoiceData, null, 2));
```

## 📊 Métriques et monitoring

L'interface MyConfort affiche :
- ✅ Statut de synchronisation en temps réel
- 📈 Statistiques des factures reçues
- 🔄 Bouton de synchronisation manuelle
- ⚠️ Notifications d'erreurs

## 🚀 Déploiement en production

### Checklist de déploiement

- [ ] Token d'authentification configuré
- [ ] Endpoint API déployé et accessible
- [ ] Workflow N8N modifié et testé
- [ ] Test avec données réelles
- [ ] Monitoring des logs activé
- [ ] Équipe formée sur la nouvelle interface

### Variables d'environnement

```bash
# API Endpoint
AUTH_TOKEN=votre-token-secret-32-caracteres
CORS_ORIGIN=https://votre-app-myconfort.com

# N8N Workflow
MYCONFORT_API_URL=https://votre-domaine.com/api/receive-invoice
MYCONFORT_AUTH_TOKEN=votre-token-secret-32-caracteres
```

## 🎉 Résultat final

Après l'intégration, vous aurez :

1. **Workflow N8N inchangé** : Email, Google Sheets, etc. continuent de fonctionner
2. **Nouveau flux vers MyConfort** : Les factures apparaissent automatiquement dans l'app
3. **Interface unifiée** : Vue d'ensemble de toutes les factures (internes + N8N)
4. **Design moderne** : Interface optimisée tablette avec lignes compactes
5. **Temps réel** : Synchronisation automatique et bouton de refresh manuel

L'équipe peut maintenant voir toutes les factures au même endroit, avec un design élégant et des statistiques en temps réel ! 🎯
