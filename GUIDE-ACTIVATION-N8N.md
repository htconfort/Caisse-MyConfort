# 🚀 Guide d'activation webhook N8N

## ⚠️ Problème actuel
Le webhook N8N répond toujours : **"The requested webhook 'sync/invoices' is not registered"**

## 🔧 Solutions à essayer

### **Solution 1 : Activation temporaire**
1. **Connectez-vous à N8N** : https://n8n.srv765811.hstgr.cloud
2. **Ouvrez votre workflow "Sync Caisse-Facturation"**
3. **Cliquez sur "Test workflow"** (bouton en haut)
4. **Testez immédiatement** avec cette commande :
   ```bash
   curl "https://n8n.srv765811.hstgr.cloud/webhook-test/sync/invoices"
   ```

### **Solution 2 : Activation permanente**
1. **Dans votre workflow N8N**
2. **Cliquez sur "Activate"** (bouton toggle en haut à droite)
3. **Vérifiez que le workflow est "Active"** (voyant vert)

### **Solution 3 : Vérification de l'URL du webhook**
Dans votre nœud Webhook N8N, vérifiez :
- **Path** : `sync/invoices`
- **Method** : `GET` et `POST`
- **Mode** : `Production`

### **Solution 4 : Headers CORS**
Dans votre nœud "Set Headers" (ou Response), ajoutez :
```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}
```

## 🧪 Test rapide
Une fois configuré, testez avec :
```bash
./test-n8n-webhook.sh
```

## 🚨 Vérifications importantes
1. ✅ Le workflow est-il **activé** ?
2. ✅ Le webhook path est-il **sync/invoices** ?
3. ✅ Les méthodes GET/POST sont-elles **autorisées** ?
4. ✅ Les headers CORS sont-ils **configurés** ?

## 📞 Test depuis l'application
1. Ouvrez http://localhost:5175
2. Ouvrez la console développeur (F12)
3. Tapez : `localStorage.setItem("n8n-test-mode", "true")`
4. Rechargez la page
5. Allez sur l'onglet Factures
6. Vérifiez les logs dans la console
