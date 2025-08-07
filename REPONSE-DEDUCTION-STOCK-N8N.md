## 📋 RÉPONSE DÉFINITIVE : Déduction automatique du stock lors de l'arrivée d'une facture N8N

### ❌ **NON, les produits d'une facture N8N ne sont PAS automatiquement déduits du stock général**

Après analyse complète du code de l'application Caisse MyConfort, voici les conclusions :

---

## 🔍 **ANALYSE TECHNIQUE DÉTAILLÉE**

### 1. **Logique de synchronisation des factures N8N**
- **Fichier analysé** : `src/services/syncService.ts`
- **Fonction principale** : `getInvoices()` et `transformInvoicesData()`
- **Comportement** : Les factures N8N sont **récupérées et affichées** mais **ne modifient PAS le stock**

### 2. **Mécanisme de gestion du stock actuel**
- **Fichier analysé** : `src/hooks/useStockManagement.ts`
- **Logique** : Le stock est **calculé en READ-ONLY** à partir des factures existantes
- **Fonction `getStockOverview()`** : Analyse les statuts des produits dans les factures pour créer une vue d'ensemble du stock
- **Aucune déduction automatique** : Le stock est une vue calculée, pas une base de données mise à jour

### 3. **Statuts des produits dans les factures**
Les produits des factures N8N ont des statuts :
- `pending` : En attente
- `available` : Disponible  
- `delivered` : Livré
- `cancelled` : Annulé

Ces statuts permettent de **calculer** le stock apparent mais ne **déduisent pas** physiquement du stock.

### 4. **Système de vente depuis la caisse**
- **Fichier analysé** : `src/App.tsx` → fonction `completeSale()`
- Les ventes depuis la caisse créent des enregistrements de vente mais **ne déduisent pas non plus du stock automatiquement**
- Le stock est géré comme une vue d'ensemble des commandes et factures

---

## 🎯 **RÉPONSE CLAIRE**

### **Question** : "Est-ce que les produits d'une facture N8N sont déduits du stock général ?"

### **Réponse** : **NON**, voici pourquoi :

1. **Pas de déduction automatique** : Aucune ligne de code ne décrémente automatiquement les quantités en stock lors de la réception d'une facture N8N

2. **Stock calculé** : Le "stock" affiché est une vue calculée basée sur les statuts des produits dans toutes les factures (N8N + locales)

3. **Réservation conceptuelle** : Le champ `stockReserved: boolean` indique si un produit est "réservé" mais ne déduit pas physiquement du stock

4. **Workflow actuel** :
   - Une facture N8N arrive → Affichage dans l'onglet factures
   - Les produits sont marqués avec des statuts (`pending`, `available`, etc.)
   - Le "stock apparent" est recalculé pour affichage
   - **Aucune déduction réelle du stock physique**

---

## 💡 **IMPLICATIONS PRATIQUES**

- **Stock physique** : Doit être géré manuellement ou via un autre système
- **Vue consolidée** : L'application offre une vue d'ensemble des commandes mais ne gère pas l'inventaire physique
- **Traçabilité** : Les factures N8N permettent de suivre les commandes mais pas de gérer automatiquement le stock

---

## 📝 **RECOMMANDATIONS**

Si vous souhaitez une **déduction automatique du stock** :

1. **Ajouter une logique de déduction** dans `syncService.ts` lors de la réception de nouvelles factures
2. **Créer un système de stock physique** séparé de la vue calculée
3. **Implémenter des règles métier** pour déterminer quand déduire (à la commande, à la livraison, etc.)

**Date d'analyse** : 25 janvier 2025  
**Version du code** : v2.1.0-interface-factures-amelioree  
**Statut** : ✅ Analyse complète terminée
