# 🔧 Guide de correction CORS pour N8N

## 🎯 Problème identifié
Le diagnostic révèle une erreur CORS : le serveur N8N bloque les requêtes depuis le navigateur.

## ✅ Solution : Configurer CORS dans le workflow N8N

### 1. Ouvrir le workflow N8N
- Aller sur votre instance N8N
- Ouvrir le workflow qui contient le webhook `caisse/facture`

### 2. Modifier le node Webhook
- Cliquer sur le node **Webhook**
- Dans les paramètres, ajouter :
  - **Response Mode** : `On Received`
  - **Response Code** : `200`

### 3. Ajouter un node "Set" pour CORS
Après le node Webhook, ajouter un node **"Set"** avec :

**Name**: `CORS Headers`

**Options**:
- **Keep Only Set**: `OFF`
- **Assignments**:
  ```
  Access-Control-Allow-Origin = *
  Access-Control-Allow-Methods = POST, GET, OPTIONS
  Access-Control-Allow-Headers = Content-Type, Authorization
  ```

### 4. Ajouter un node "Respond to Webhook"
Après le node "Set", ajouter **"Respond to Webhook"** :

**Response Code**: `200`
**Response Body**: 
```json
{
  "success": true,
  "message": "Webhook reçu avec succès",
  "data": {{ $json }}
}
```

### 5. Gérer les requêtes OPTIONS
Pour les requêtes CORS preflight, ajouter une branche conditionnelle :

**Condition**: `{{ $json.method === 'OPTIONS' }}`

Si `true` → Répondre immédiatement avec les headers CORS
Si `false` → Continuer avec le traitement normal

### 6. Structure finale du workflow
```
Webhook → Set (CORS Headers) → [Condition OPTIONS] → Traitement → Respond
```

### 7. Activer le workflow
- Vérifier que le workflow est **ACTIVÉ**
- S'assurer que l'URL est en mode **Production** (pas Test)

## 🧪 Test après correction

1. Sauvegarder le workflow
2. Revenir sur la page de diagnostic
3. Cliquer sur "Lancer tous les tests"
4. Vérifier que CORS passe au vert

## 📋 URL de test à utiliser
```
https://n8n.myconfort.fr/webhook/caisse/facture
```

## ⚡ Alternative rapide : Test direct
Si la correction CORS ne fonctionne pas immédiatement, vous pouvez tester directement avec curl :

```bash
curl -X POST https://n8n.myconfort.fr/webhook/caisse/facture \
  -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "numero_facture": "TEST-001",
    "nom_client": "Test Client",
    "montant_ttc": 100,
    "produits": [{"nom": "Test", "quantite": 1, "prix_ttc": 100}]
  }'
```

## 🔍 Vérification
Après la correction, tous les tests doivent passer :
- ✅ Connexion Internet
- ✅ Résolution DNS  
- ✅ CORS ← **Doit devenir vert**
- ✅ Webhook GET
- ✅ Webhook POST
- ✅ Timeout



