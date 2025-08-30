# 📊 GUIDE COMPLET - Synchronisation Automatique Google Sheets

## 🎯 Objectif

Chaque RAZ Journée dans la Caisse déclenche automatiquement :
- ✅ Envoi des ventes vers n8n 
- ✅ Alimentation du Google Sheet (récap + ventes détaillées)
- ✅ Sauvegarde snapshot XLSX horodaté
- ✅ Gestion hors-ligne avec queue de retry

---

## 🏗️ Architecture Complète

```
[CAISSE] RAZ Journée 
    ↓ 
[Payload JSON] → VITE_N8N_SYNC_WEBHOOK
    ↓
[n8n Workflow] "Sync_Caisse_Google_Sheets"
    ↓
[Google Sheets] Append données + recalcul automatique
    ↓  
[Google Drive] Snapshot XLSX horodaté
```

---

## 📋 ÉTAPE 1 : Configuration Google Drive

### 1.1 Créer le Google Sheet modèle

1. **Aller sur Google Drive** : https://drive.google.com
2. **Créer un nouveau Google Sheet** 
3. **Nom** : `Salaires_Foire_2025`
4. **Emplacement** : `/MyConfort/Salaires/2025/`

### 1.2 Structure des onglets

Pour chaque vendeuse, créer 2 onglets :

#### **Onglet `X_Recap`** (ex: `Lucia_Recap`)
| Date | Chèque | CB | Espèces | Total | Salaire | Transport | Logement |
|------|--------|----|---------| ------|---------|-----------|----------|
| 2025-09-01 | 230.00 | 300.00 | 50.00 | 580.00 | 140.00 | 150.00 | 300.00 |

#### **Onglet `X_Ventes`** (ex: `Lucia_Ventes`)
| Date | Prénom | Nom | Adresse | CP | Produit | Montant | Mode | Chèque à venir | Nb chèques | Montant chèque |
|------|--------|-----|---------|----|---------| --------|------|----------------|------------|----------------|
| 2025-09-01 | Jean | Dupont | 10 rue X | 75011 | Matelas Bamboo 160x200 | 899.00 | CB | Non | 0 | 0.00 |

### 1.3 Récupérer l'ID du fichier

1. **Ouvrir le Google Sheet** créé
2. **Copier l'URL** : `https://docs.google.com/spreadsheets/d/[ID_DU_FICHIER]/edit`
3. **Noter l'ID** : la partie entre `/d/` et `/edit`

---

## ⚙️ ÉTAPE 2 : Configuration Côté Caisse

### 2.1 Variables d'environnement

Dans `/mon-projet-vite/.env` :

```env
# Webhook existants
VITE_N8N_EMAIL_WEBHOOK=https://n8n.srv765811.hstgr.cloud/webhook/email/report
VITE_N8N_RAZ_WEBHOOK=https://n8n.srv765811.hstgr.cloud/webhook/raz

# Nouveau webhook pour synchronisation Google Drive
VITE_N8N_SYNC_WEBHOOK=https://n8n.srv765811.hstgr.cloud/webhook/sync/daily
```

### 2.2 Payload envoyé automatiquement

À chaque RAZ Journée, la caisse envoie :

```json
{
  "sessionId": "foire-paris-2025",
  "date": "2025-09-05", 
  "idempotencyKey": "foire-paris-2025_2025-09-05",
  "vendors": [
    {
      "name": "Lucia",
      "rules": {
        "rate": 0.20,
        "threshold": 1500,
        "fixedIfUnder": 140,
        "transport": 150,
        "housing": 300
      },
      "lines": [{
        "date": "2025-09-05",
        "cheque": 230.00,
        "card": 300.00,
        "cash": 50.00,
        "total": 580.00,
        "salary": 140.00
      }],
      "sales": [
        {
          "date": "2025-09-05",
          "firstName": "Jean",
          "lastName": "Dupont", 
          "address": "10 rue X",
          "zip": "75011",
          "product": "Matelas Bamboo 160x200",
          "amount": 899.00,
          "payment": "CB",
          "postDatedCheck": "Non",
          "checksCount": 0,
          "checkAmount": 0.00
        }
      ]
    }
  ]
}
```

---

## 🔧 ÉTAPE 3 : Configuration n8n

### 3.1 Créer le workflow n8n

1. **Se connecter à n8n** : https://n8n.srv765811.hstgr.cloud
2. **Créer un nouveau workflow** : `Sync_Caisse_Google_Sheets` 
3. **Activer le workflow** (toggle en haut à droite)

### 3.2 Nœuds du workflow

#### **Nœud 1 : Webhook**
- **Type** : `Webhook`
- **Path** : `sync/daily`
- **Method** : `POST`
- **Response** : `200 OK` avec message de confirmation

#### **Nœud 2 : Code - Vérification Idempotence**
```javascript
// Vérifier si cette date a déjà été traitée
const data = $input.all()[0].json;
const idempotencyKey = data.idempotencyKey;

// Récupérer les clés déjà traitées depuis le Data Store
const processedKeys = $('Data Store').get('processed_keys') || [];

if (processedKeys.includes(idempotencyKey)) {
  // Déjà traité, ignorer
  return [{
    json: { 
      status: 'ignored', 
      message: `Données déjà traitées pour ${idempotencyKey}`,
      idempotencyKey 
    }
  }];
}

// Nouveau, ajouter à la liste et continuer
processedKeys.push(idempotencyKey);
$('Data Store').set('processed_keys', processedKeys);

return [{
  json: { 
    status: 'new',
    data: data,
    idempotencyKey 
  }
}];
```

#### **Nœud 3 : Google Sheets - Append Recap**
- **Type** : `Google Sheets`
- **Operation** : `Append`
- **Spreadsheet ID** : `[ID_DU_FICHIER_RECUPERE]`
- **Sheet** : `{{$json.data.vendors[0].name}}_Recap` (dynamique)
- **Data** : Mapper les champs `lines[0]` vers les colonnes

#### **Nœud 4 : Google Sheets - Append Ventes**
- **Type** : `Google Sheets` 
- **Operation** : `Append`
- **Spreadsheet ID** : `[ID_DU_FICHIER_RECUPERE]`
- **Sheet** : `{{$json.data.vendors[0].name}}_Ventes` (dynamique)
- **Data** : Mapper le tableau `sales[]` vers les colonnes

#### **Nœud 5 : Google Drive - Snapshot (optionnel)**
- **Type** : `Google Drive`
- **Operation** : `Copy`
- **Source** : ID du Google Sheet
- **Destination** : `/MyConfort/Salaires/2025/Archives/`
- **Nouveau nom** : `Salaires_Foire_2025__{{$json.data.date}}.xlsx`

---

## 🚀 ÉTAPE 4 : Test et Validation

### 4.1 Test manuel du webhook

```bash
curl -X POST "https://n8n.srv765811.hstgr.cloud/webhook/sync/daily" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-2025",
    "date": "2025-08-28",
    "idempotencyKey": "test-2025_2025-08-28",
    "vendors": [{
      "name": "Lucia",
      "rules": { "rate": 0.20, "threshold": 1500, "fixedIfUnder": 140, "transport": 150, "housing": 300 },
      "lines": [{ "date": "2025-08-28", "cheque": 100, "card": 200, "cash": 0, "total": 300, "salary": 140 }],
      "sales": [{ "date": "2025-08-28", "firstName": "Test", "lastName": "User", "address": "Test St", "zip": "12345", "product": "Test Product", "amount": 300, "payment": "CB", "postDatedCheck": "Non", "checksCount": 0, "checkAmount": 0 }]
    }]
  }'
```

### 4.2 Test depuis la caisse

1. **Démarrer Vite** : `npm run dev`
2. **Aller sur RAZ** 
3. **Effectuer une RAZ Journée**
4. **Vérifier les logs console** pour la synchronisation
5. **Vérifier le Google Sheet** pour les nouvelles données

---

## 📊 ÉTAPE 5 : Résultats Attendus

### 5.1 Chaque RAZ Journée

✅ **Données dans Google Sheet** :
- Nouvelles lignes dans `X_Recap` avec totaux par mode de paiement
- Nouvelles lignes dans `X_Ventes` avec détail des ventes
- Formules de calcul mises à jour automatiquement

✅ **Snapshot archivé** :
- Fichier XLSX dans `/MyConfort/Salaires/2025/Archives/`
- Nom : `Salaires_Foire_2025__YYYY-MM-DD.xlsx`

✅ **Gestion hors-ligne** :
- Si pas de réseau → mise en queue locale
- Dès retour réseau → synchronisation automatique

### 5.2 Interface utilisateur

✅ **Statut visible** :
- 🟢 "Google Drive: Synchronisé" → tout va bien
- 🟠 "Google Drive: 2 en attente" → hors-ligne avec queue
- 🔴 "Google Drive: Hors-ligne" → pas de réseau, pas de queue

---

## 🔒 ÉTAPE 6 : Sécurité et Fiabilité

### 6.1 Idempotence
- **Clé unique** : `sessionId_date` (ex: `foire-paris-2025_2025-09-05`)
- **Prévention doublons** : n8n ignore les requêtes déjà traitées
- **Data Store n8n** : stockage persistant des clés traitées

### 6.2 Gestion d'erreurs
- **Retry automatique** : queue locale en cas d'échec réseau
- **Logs détaillés** : console de la caisse + execution logs n8n
- **Alertes** : possibilité d'ajouter notifications email si échec récurrent

### 6.3 Performance
- **Non-bloquant** : RAZ continue même si sync échoue
- **Async** : synchronisation en arrière-plan
- **Optimisé** : pause 1s entre requêtes pour ne pas surcharger n8n

---

## 🛠️ ÉTAPE 7 : Maintenance

### 7.1 Monitoring
- **n8n Dashboard** : vérifier les executions du workflow
- **Google Sheets** : contrôler que les données arrivent
- **Console Caisse** : surveiller les logs de synchronisation

### 7.2 Résolution de problèmes
- **Webhook inaccessible** → vérifier URL et activation n8n
- **Erreur Google Sheets** → vérifier permissions et structure onglets
- **Queue qui grossit** → forcer retry manuel ou vérifier réseau

### 7.3 Évolutions futures
- **Multi-événements** : support de plusieurs sessions simultanées
- **Real-time** : WebSockets pour sync instantanée
- **Analytics** : dashboard de suivi des syncs et performances

---

## 🎉 Récapitulatif

🔄 **Workflow automatique** :
`RAZ Journée` → `Sync Google Sheets` → `Archive Snapshot` → `✅ Terminé`

📊 **Données centralisées** :
- Récap quotidien par vendeuse  
- Détail de toutes les ventes
- Calculs de commission automatiques
- Historique immuable des snapshots

🛡️ **Fiabilité garantie** :
- Idempotence anti-doublons
- Queue hors-ligne avec retry
- Logs complets pour debug
- Interface de statut en temps réel

**💡 Votre tableau Excel automatiquement alimenté chaque jour !**
