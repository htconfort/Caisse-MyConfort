# 📋 Guide d'Utilisation : Détails de Règlement

## 🎯 Comment consulter les détails de règlement

### 1️⃣ Accéder à l'onglet Factures
- Cliquez sur l'onglet **"Factures"** dans la navigation
- Les factures s'affichent avec un badge indiquant le nombre de factures

### 2️⃣ Localiser les détails de règlement
- Dans chaque carte de facture, descendez jusqu'à la section **"💳 Détails du règlement"**
- Cette section a un fond bleu clair pour la distinguer

### 3️⃣ Comprendre les informations affichées

#### 💰 Informations de Base
```
Mode de paiement: Chèque(s)     |  Total: 1198.00€
Statut: 🔄 Partiel              |  Payé: 400.00€
                                |  Restant: 798.00€
```

#### 📝 Détails des Chèques (si applicable)
```
📝 Détails des chèques
Total chèques: 3        |  Prochain chèque: 01/02/2025
Reçus: 1               |
À venir: 2             |

Caractéristiques: 3 chèques : 400€ + 400€ + 398€
```

#### 💳 Transactions Électroniques (si applicable)
```
💳 Détails de la transaction
Référence: CB-240125-001
Banque: Crédit Agricole
Carte: **** 1234
```

#### 📅 Paiements Échelonnés (si applicable)
```
📅 Paiement échelonné
Total échéances: 3      |  Prochaine échéance: 25/02/2025
Payées: 1              |
Montant échéance: 162.67€
```

## 🎨 Codes Couleur et Icônes

### Statuts de Paiement
- ⏳ **Gris** : En attente
- 🔄 **Orange** : Partiel  
- ✅ **Vert** : Payé
- ⚠️ **Rouge** : En retard

### Modes de Paiement
- 💰 **Espèces**
- 💳 **Carte bancaire**
- 📝 **Chèque(s)**
- 🏦 **Virement**
- 📅 **Échelonnement**
- 🔄 **Paiement multiple**

### Sections Spécialisées
- **Bleu** : Détails des chèques
- **Vert** : Transactions électroniques
- **Violet** : Paiements échelonnés
- **Gris** : Notes de règlement

## 🔍 Cas d'Usage Pratiques

### ✅ Vérifier les chèques à venir
1. Regardez la section "📝 Détails des chèques"
2. Notez le nombre de "Chèques à venir"
3. Vérifiez la "Prochaine échéance"

### ✅ Suivre les paiements partiels
1. Consultez les montants "Payé" vs "Restant"
2. Vérifiez le statut 🔄 Partiel
3. Planifiez le suivi client

### ✅ Contrôler les transactions CB
1. Vérifiez la référence de transaction
2. Notez les 4 derniers chiffres de la carte
3. Confirmez la banque émettrice

### ✅ Gérer les échelonnements
1. Suivez le nombre d'échéances payées
2. Notez la prochaine date de paiement
3. Vérifiez le montant de chaque échéance

## 🔄 Synchronisation Automatique

- Les détails de règlement sont **automatiquement synchronisés** depuis l'iPad de facturation via N8N
- Aucune saisie manuelle n'est requise
- Les informations se mettent à jour en temps réel lors de la synchronisation

## 📱 Affichage Responsive

- **Mobile** : Informations empilées verticalement
- **Tablette** : Grid à 2 colonnes
- **Desktop** : Affichage complet optimisé

## ❓ Questions Fréquentes

**Q : Pourquoi je ne vois pas de détails de règlement ?**
R : Vérifiez que la facture contient bien des informations de paiement depuis l'iPad. Les anciennes factures peuvent ne pas avoir ces détails.

**Q : Comment savoir si un chèque est en retard ?**
R : Le statut passera automatiquement à ⚠️ En retard si la date d'échéance est dépassée.

**Q : Les informations sont-elles mises à jour en temps réel ?**
R : Oui, via la synchronisation N8N toutes les 30 secondes en arrière-plan.

---

*Pour toute question technique, consultez le fichier DETAILS-REGLEMENT-FACTURES.md*
