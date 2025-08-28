# 📋 BLUEPRINT COMPLET - SYSTÈME R.A.Z & EMAIL MyConfort

**📅 Date de création :** 28 août 2025  
**🎯 Version :** 3.7.0  
**👨‍💻 Équipe :** GitHub Copilot + Bruno Priem

---

## 🎯 **VUE D'ENSEMBLE DU SYSTÈME**

Le système MyConfort dispose de **DEUX SYSTÈMES R.A.Z DISTINCTS** :
1. **R.A.Z Classique** : Remise à zéro des données (stock, ventes, etc.)
2. **R.A.Z Email** : Envoi automatique de rapports + remise à zéro optionnelle

---

## 🔄 **SYSTÈME R.A.Z CLASSIQUE**

### **📍 Localisation :** Onglet principal "R.A.Z"

### **🎛️ Options Disponibles :**
- **📊 Ventes du jour** : Efface uniquement les ventes de la journée
- **🛒 Panier actuel** : Vide le panier en cours
- **👤 Vendeuse sélectionnée** : Désélectionne la vendeuse active
- **📈 Statistiques vendeuses** : ⚠️ Remet à zéro TOUTES les stats
- **🚨 RAZ Complète** : ⚠️ DANGER - Supprime TOUT

### **🔒 Sécurité :**
- **Sauvegarde automatique** : Bouton "Sauvegarder les données" (JSON)
- **Aperçu des actions** : Liste détaillée avant exécution
- **Confirmations** : Modal de validation
- **Animations** : Feedback visuel pendant l'exécution

---

## 📧 **SYSTÈME EMAIL R.A.Z**

### **📍 Localisation :** Onglet "Email RAZ"

### **🏗️ Architecture en 3 Onglets :**

---

## 📤 **ONGLET 1 : ENVOI MANUEL**

### **🎯 Fonction :** Contrôle total de l'envoi de rapports

### **📊 Zone d'Aperçu des Données :**
- **CA du jour** : Montant total des ventes
- **Nombre de ventes** : Compteur des transactions
- **Vendeuses actives** : Nombre de vendeuses
- **Détails inclus** : Nombre de détails à joindre

### **🎛️ Boutons d'Action :**

#### **🟢 "Envoyer Rapport"** - BOUTON PRINCIPAL
- **📧 Fonction :** Envoie IMMÉDIATEMENT le rapport par email
- **📎 Contenu :** Données du jour + PDF (si activé)
- **🔄 RAZ :** **SEULEMENT si cochée** dans Configuration
- **⏰ Timing :** Instantané
- **🎯 Usage :** **Envoi quotidien principal**

#### **🔵 "Test Email"**
- **📧 Fonction :** Envoie un email de test
- **📎 Contenu :** Données fictives avec préfixe [TEST]
- **🔄 RAZ :** **JAMAIS**
- **⏰ Timing :** Instantané
- **🎯 Usage :** Vérification configuration

#### **🟡 "Aperçu"**
- **📧 Fonction :** Ouvre fenêtre avec aperçu HTML de l'email
- **📎 Contenu :** Vue exacte de l'email qui sera envoyé
- **🔄 RAZ :** **JAMAIS**
- **⏰ Timing :** Instantané
- **🎯 Usage :** Contrôle visuel

#### **🔴 "Exporter PDF"**
- **📧 Fonction :** Télécharge directement le PDF
- **📎 Contenu :** Feuille de caisse complète en PDF
- **🔄 RAZ :** **JAMAIS**
- **⏰ Timing :** Instantané
- **🎯 Usage :** Sauvegarde locale

#### **🟠 "Aperçu PDF"**
- **📧 Fonction :** Ouvre modal avec prévisualisation PDF
- **📎 Contenu :** Vue du PDF dans le navigateur
- **🔄 RAZ :** **JAMAIS**
- **⏰ Timing :** Instantané
- **🎯 Usage :** Contrôle qualité PDF

---

## 🔄 **ONGLET 2 : ENVOI AUTOMATIQUE**

### **🎯 Fonction :** Programmation d'envois quotidiens

### **⚙️ Configuration :**
- **✅ Case à cocher :** "Activer l'envoi automatique quotidien"
- **⏰ Sélecteur d'heure :** Choix de l'heure d'envoi (ex: 20:00)

### **🎛️ Bouton Principal :**

#### **🟣 "Configurer Envoi Auto"**
- **📧 Fonction :** Active la programmation quotidienne
- **📎 Contenu :** Même contenu que l'envoi manuel
- **🔄 RAZ :** **Si activée** dans Configuration
- **⏰ Timing :** **Tous les jours** à l'heure configurée
- **🎯 Usage :** **Automation complète**

---

## ⚙️ **ONGLET 3 : CONFIGURATION**

### **🎯 Fonction :** Paramétrage du système email

### **📧 Configuration Email :**
- **Destinataire principal** : Email obligatoire
- **Emails en copie (CC)** : Emails séparés par virgules
- **Sujet de l'email** : Template avec [DATE] automatique

### **📎 Options d'Envoi :**
- **☑️ Joindre le rapport en PDF** : Active/désactive la pièce jointe PDF
- **☑️ Inclure les détails des ventes** : Inclut max 50 détails de ventes
- **⚠️ Effectuer une RAZ après envoi** : **OPTION CRITIQUE**

---

## 🔥 **OPTION CRITIQUE : RAZ APRÈS ENVOI**

### **📍 Localisation :** Onglet Configuration, dernière case à cocher

### **⚠️ ATTENTION :** Cette option est **ROUGE** et marquée "Attention!"

### **🔄 Comportement :**
- **Si COCHÉE :** Tous les envois (manuel + auto) feront une RAZ après
- **Si DÉCOCHÉE :** Aucun envoi ne fera de RAZ

### **🎯 Impact sur TOUS les Boutons :**
- **"Envoyer Rapport"** → Envoi + RAZ si cochée
- **"Configurer Envoi Auto"** → Programmation avec RAZ si cochée
- **"Test Email"** → Test uniquement (jamais de RAZ)

---

## 📊 **TABLEAU RÉCAPITULATIF COMPLET**

| Bouton | Onglet | Envoi Email | PDF | RAZ | Timing | Usage Principal |
|--------|--------|-------------|-----|-----|--------|-----------------|
| **Envoyer Rapport** | Manuel | ✅ OUI | ✅ Joint | ⚠️ Si activée | Immédiat | **Action quotidienne** |
| **Test Email** | Manuel | ✅ Test | ❌ NON | ❌ JAMAIS | Immédiat | Vérification |
| **Aperçu Email** | Manuel | ❌ NON | ❌ NON | ❌ JAMAIS | Immédiat | Prévisualisation |
| **Exporter PDF** | Manuel | ❌ NON | ✅ Télécharge | ❌ JAMAIS | Immédiat | Sauvegarde |
| **Aperçu PDF** | Manuel | ❌ NON | ✅ Préview | ❌ JAMAIS | Immédiat | Contrôle qualité |
| **Configurer Auto** | Automatique | ✅ Programmé | ✅ Joint | ⚠️ Si activée | Quotidien | **Automation** |

---

## 🎯 **RÉPONSE À LA QUESTION : "ENVOI AUTOMATIQUE ?"**

### **📝 La Réponse :**
**OUI, la feuille de caisse PEUT être envoyée automatiquement, MAIS seulement si :**

1. **✅ Tu vas dans l'onglet "Envoi Automatique"**
2. **✅ Tu coches "Activer l'envoi automatique quotidien"**
3. **✅ Tu choisis une heure (ex: 20:00)**
4. **✅ Tu cliques "Configurer Envoi Auto"**

### **🔄 Pour la RAZ Automatique :**
**OUI, la RAZ peut être automatique APRÈS l'envoi, MAIS seulement si :**

1. **✅ Tu vas dans l'onglet "Configuration"**
2. **⚠️ Tu coches "Effectuer une RAZ après envoi"**

---

## 🎛️ **WORKFLOWS TYPES**

### **🌅 Workflow Quotidien Manuel :**
```
1. Fin de journée
2. Onglet "Email RAZ" → "Envoi Manuel"
3. Vérifier les données dans l'aperçu
4. Clic "Envoyer Rapport"
5. RAZ automatique SI configurée
```

### **🔄 Workflow Automatique :**
```
1. Configuration initiale une seule fois
2. Chaque jour à 20h00 :
   - Email envoyé automatiquement
   - RAZ effectuée automatiquement SI configurée
   - Aucune intervention manuelle
```

### **🔧 Workflow de Dépannage :**
```
1. Problème d'envoi ?
2. "Test Email" pour vérifier
3. "Aperçu" pour contrôler le contenu
4. "Exporter PDF" pour sauvegarder localement
```

---

## 🚨 **POINTS D'ATTENTION CRITIQUES**

### **⚠️ 1. RAZ Accidentelle :**
- **Problème :** RAZ non désirée après envoi
- **Solution :** Toujours vérifier la case "RAZ après envoi" dans Configuration

### **⚠️ 2. Double RAZ :**
- **Problème :** RAZ manuelle + RAZ automatique
- **Solution :** Choisir UN seul mode (manuel OU automatique)

### **⚠️ 3. Email Non Configuré :**
- **Problème :** Pas de destinataire
- **Solution :** Configuration obligatoire avant premier envoi

### **⚠️ 4. Webhook n8n :**
- **Problème :** Variables d'environnement manquantes
- **Solution :** Configurer `VITE_N8N_EMAIL_WEBHOOK` et `VITE_N8N_RAZ_WEBHOOK`

---

## 🛠️ **CONFIGURATION TECHNIQUE**

### **📁 Fichiers Impliqués :**
- `EmailRAZSystem.tsx` : Interface utilisateur complète
- `emailService.ts` : Logique d'envoi et webhooks n8n
- `printService.ts` : Génération PDF avec autoDownload
- `.env` : Variables webhook n8n

### **🔗 Intégrations :**
- **n8n Webhook** : Envoi email automatique
- **n8n RAZ Webhook** : Remise à zéro à distance
- **PrintService v2** : PDF avec autoDownload intelligent
- **LocalStorage** : Sauvegarde configuration utilisateur

---

## 🎯 **RÉSUMÉ EXÉCUTIF**

**Le système Email RAZ de MyConfort offre :**

✅ **Flexibilité** : Mode manuel ET automatique  
✅ **Sécurité** : Confirmations et aperçus  
✅ **Contrôle** : RAZ optionnelle et configurable  
✅ **Automation** : Envoi quotidien programmable  
✅ **Qualité** : PDF professionnel et aperçus  
✅ **Intégration** : n8n pour l'envoi réel  

**Le bouton principal pour l'utilisation quotidienne est "Envoyer Rapport" qui peut envoyer ET faire la RAZ selon la configuration choisie.**

---

**📞 Support :** GitHub Copilot  
**🔄 Dernière mise à jour :** 28 août 2025, 12:40  
**📋 Document :** Blueprint Système Email RAZ v3.7.0
