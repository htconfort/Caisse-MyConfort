# 🔄 SYSTÈME DE DÉDUCTION AUTOMATIQUE DU STOCK N8N

## 📋 **RÉSUMÉ DE L'IMPLÉMENTATION**

**Date**: 25 janvier 2025  
**Version**: v3.0.0-deduction-stock-automatique  
**Statut**: ✅ Implémenté et opérationnel

### 🎯 **FONCTIONNALITÉ CRÉÉE**

Le système déduit automatiquement les produits du stock physique chaque fois qu'une facture arrive par N8N.

---

## 🛠️ **DÉTAILS TECHNIQUES**

### **1. Nouvelles Interfaces TypeScript**

```typescript
// Stock physique
interface PhysicalStock {
  productName: string;
  category: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lastUpdated: Date;
  minStockAlert: number;
}

// Mouvements de stock  
interface StockMovement {
  id: string;
  productName: string;
  category: string;
  movementType: 'deduction' | 'addition' | 'correction';
  quantity: number;
  reason: string;
  invoiceNumber?: string;
  previousStock: number;
  newStock: number;
  timestamp: Date;
  vendorName?: string;
}
```

### **2. Logique de Déduction Automatique**

#### **Processus lors de l'arrivée d'une facture N8N :**

1. **Réception facture** → `getInvoices()` récupère les données N8N
2. **Détection nouveauté** → `processNewInvoicesForStockDeduction()` vérifie si la facture est nouvelle
3. **Déduction automatique** → `deductStockFromInvoice()` soustrait les quantités du stock
4. **Traçabilité** → Chaque mouvement est enregistré avec l'ID facture et le vendeur
5. **Alertes** → Notifications automatiques si stock faible/critique

### **3. Exemples de Déduction**

**Facture reçue :**
- 1x Matelas Memory Foam 160x200
- 2x Pack 2 oreillers confort *(= 4 oreillers individuels)*
- 1x Couette 4 saisons 220x240

**Déductions appliquées :**
- Matelas : 5 → 4 unités (-1)
- Pack oreillers : 15 → 13 packs (-2)
- Couette : 10 → 9 unités (-1)

---

## 📱 **INTERFACE UTILISATEUR**

### **Nouvel Onglet : "Stock Physique"**

**Localisation :** `Stock` > `Stock physique`

**Fonctionnalités :**
- ✅ Vue en temps réel du stock physique
- ✅ Alertes visuelles (🚨 Critique, ⚠️ Faible, ✅ OK)
- ✅ Historique des mouvements de stock
- ✅ Filtrage et recherche
- ✅ Mise à jour automatique lors de nouvelles factures N8N

### **Indicateurs Visuels**

```
🚨 CRITIQUE : Stock ≤ seuil minimum
⚠️ FAIBLE   : Stock ≤ 2x seuil minimum  
✅ OK       : Stock > 2x seuil minimum
```

---

## 🗂️ **FICHIERS MODIFIÉS/CRÉÉS**

### **1. Service Principal**
- **`src/services/syncService.ts`** : Logique de déduction automatique
  - Nouvelles méthodes pour gestion stock physique
  - Déduction lors de la synchronisation N8N
  - Sauvegarde des mouvements de stock

### **2. Interface Utilisateur**
- **`src/components/PhysicalStockManager.tsx`** : Composant d'affichage du stock
- **`src/components/tabs/StockTab.tsx`** : Ajout du sous-onglet "Stock physique"

### **3. Script de Test**
- **`test-deduction-stock.sh`** : Script de simulation et test

### **4. Documentation**
- **`DEDUCTION-STOCK-AUTOMATIQUE-v3.0.0.md`** : Documentation complète

---

## 🧪 **TESTS ET VALIDATION**

### **Script de Test Automatique**

```bash
# Lancer le test de déduction
./test-deduction-stock.sh
```

**Le test simule :**
1. Stock initial par défaut
2. Arrivée d'une nouvelle facture N8N
3. Déduction automatique des quantités
4. Génération des alertes de stock faible
5. Traçabilité complète des mouvements

### **Test avec Vraies Données N8N**

1. **Démarrer l'application** : `npm run dev`
2. **Vérifier sync N8N** : Onglet Factures → nouvelles factures apparaissent
3. **Vérifier déduction** : Onglet Stock → Stock physique → voir les déductions
4. **Consulter mouvements** : Bouton "Voir Mouvements" → historique complet

---

## 🔧 **PARAMÉTRAGE**

### **Stock Initial par Défaut**

Le système initialise automatiquement un stock par défaut :

```typescript
// Exemples de produits avec stock initial
'Matelas Memory Foam 160x200' : 5 unités (seuil: 2)
'Pack 2 oreillers confort'    : 15 packs (seuil: 5)  
'Couette 4 saisons 220x240'  : 10 unités (seuil: 5)
'Oreiller ergonomique'        : 20 unités (seuil: 10)
```

### **Correspondance Produits**

Le système utilise une **normalisation intelligente** pour faire correspondre les produits :
- Suppression des caractères spéciaux
- Normalisation des espaces
- Comparaison insensible à la casse

**Exemple :**
- Facture N8N : `"MATELAS BAMBOU 160 x 200"`
- Stock : `"Matelas Bambou 160x200"`
- → ✅ **Correspondance trouvée et déduction appliquée**

---

## 📊 **FONCTIONNALITÉS AVANCÉES**

### **1. Gestion des Stocks Négatifs**
- Le stock ne peut pas descendre en dessous de 0
- Alerte automatique si tentative de déduction > stock disponible

### **2. Traçabilité Complète**
- Chaque mouvement enregistré avec ID unique
- Référence à la facture N8N d'origine
- Nom du vendeur/conseiller
- Horodatage précis

### **3. Prévention du Double Traitement**
- Chaque facture N8N n'est traitée qu'une seule fois
- Système de cache des factures déjà traitées
- Évite les déductions multiples accidentelles

### **4. Notifications en Temps Réel**
- Alertes visuelles sur stock faible/critique
- Notifications dans l'interface lors de nouvelles déductions
- Mise à jour automatique de l'affichage

---

## 🚀 **UTILISATION OPÉRATIONNELLE**

### **Workflow Normal**

1. **Une commande arrive sur le système N8N**
2. **La facture est synchronisée** automatiquement dans l'application
3. **Le stock est déduit** instantanément et automatiquement
4. **Les alertes sont générées** si seuils dépassés
5. **L'équipe peut consulter** l'état du stock en temps réel

### **Cas Pratiques**

**Commande Client :**
- Client commande 1 matelas + 2 oreillers + 1 couette
- Facture générée dans N8N
- **Stock automatiquement mis à jour** dans la caisse
- **Alerte** si l'un des produits passe en stock faible

**Livraison Fournisseur :**
- Réception de 10 matelas
- Correction manuelle du stock via l'interface
- Traçabilité de l'ajout conservée

---

## ⚠️ **POINTS D'ATTENTION**

### **1. Correspondance Produits**
- Vérifier que les noms de produits N8N correspondent au stock
- Ajouter manuellement nouveaux produits si nécessaire

### **2. Seuils d'Alerte**
- Ajuster les seuils selon les besoins opérationnels
- Surveiller les alertes de stock critique

### **3. Sauvegarde**
- Données stockées dans localStorage du navigateur
- Prévoir sauvegarde/export régulier pour sécurité

---

## 🔄 **RESTAURATION/ROLLBACK**

Si besoin de désactiver la déduction automatique :

```typescript
// Dans syncService.ts, commenter cette ligne :
// await this.processNewInvoicesForStockDeduction(invoices);
```

**Ou revenir à la version précédente :**
```bash
git checkout v2.1.0-interface-factures-amelioree
```

---

## 📞 **SUPPORT**

**En cas de problème :**

1. **Vérifier les logs** dans la console navigateur (`F12`)
2. **Tester le script** : `./test-deduction-stock.sh`
3. **Vérifier la sync N8N** : `./test-factures-reelles.sh`
4. **Reset stock** : Supprimer `localStorage` et redémarrer

---

## ✅ **VALIDATION FINALE**

- ✅ Déduction automatique opérationnelle
- ✅ Interface utilisateur intuitive
- ✅ Traçabilité complète des mouvements
- ✅ Alertes de stock en temps réel
- ✅ Tests de validation passants
- ✅ Documentation complète
- ✅ Script de test inclus

**Le système répond parfaitement à la demande :**
> *"Chaque fois qu'une facture arrive par N8N, visualiser les produits et les déduire automatiquement du stock général"*

**🎉 FONCTIONNALITÉ LIVRÉE ET OPÉRATIONNELLE ! 🎉**
