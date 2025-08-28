# 📋 BLUEPRINT COMPLET - SYSTÈ#### **💾 "Sauvegarde"** 
- **📧 Foncti#### **🔴 "RAZ Fin Session"** (si session active)
- **📧 Fonction :** Remet à zéro TOUT + clôture session
- **📎 Contenu :** Factures + règlements + session complète
- **🔄 RAZ :** **Complète** (supprime tout)
- **⏰ Timing :** Instantané
- **🎯 Usage :** **Fin d'événement définitive**
- **⚠️ Supprime :** TOUT y compris règlements différés
- **💻 Code :** `onClick={effectuerRAZFinSession}` (fonction `effectuerRAZFinSession`) Export JSON des données avant RAZ
- **📎 Contenu :** Toutes les données de la session
- **🔄 RAZ :** **JAMAIS**
- **⏰ Timing :** Instantané
- **🎯 Usage :** **Sécurité avant RAZ**
- **💻 Code :** `onClick={exportDataBeforeReset}`

#### **🔄 "RAZ Journée"**
- **📧 Fonction :** Remet à zéro UNIQUEMENT les données du jour
- **📎 Contenu :** Factures externes + données UI
- **🔄 RAZ :** **Partielle** (conserve règlements à venir)
- **⏰ Timing :** Instantané
- **🎯 Usage :** **Nettoyage quotidien**
- **⚠️ Préserve :** Session + règlements différés
- **💻 Code :** `onClick={effectuerRAZ}` (fonction `effectuerRAZ`)

#### **🔴 "RAZ Fin Session"** (si session active)
- **📧 Fonction :** Remet à zéro TOUT + clôture session
- **📎 Contenu :** Factures + règlements + session complète
- **🔄 RAZ :** **Complète** (supprime tout)
- **⏰ Timing :** Instantané
- **🎯 Usage :** **Fin d'événement définitive**
- **⚠️ Supprime :** TOUT y compris règlements différés
- **💻 Code :** `onClick={effectuerRAZFinSession}` (fonction `effectuerRAZFinSession`)onfort

**📅 Date de création :** 28 août 2025  
**🎯 Version :** 3.7.0  
**👨‍💻 Équipe :** GitHub Copilot + Bruno Priem

---

## 🎯 **VUE D'ENSEMBLE DU SYSTÈME**

Le système MyConfort dispose de **TROIS BOUTONS PRINCIPAUX** dans l'onglet "RAZ" (composant `FeuilleDeRAZPro.tsx`) :
1. **"Sauvegarde"** : Export JSON des données (jamais de RAZ)
2. **"RAZ Journée"** : Nettoie données UI + factures externes (préserve règlements)
3. **"RAZ Fin Session"** : RAZ complète + purge règlements + clôture session

**IMPORTANT :** Il n'y a PAS d'onglet "Email RAZ" séparé dans l'application.

---

## � **SYSTÈME R.A.Z PRINCIPAL (Onglet "RAZ")**

### **📍 Localisation :** Onglet principal "RAZ" - Composant `FeuilleDeRAZPro.tsx`

### **�️ Interface Utilisateur :**
- **Feuille de caisse** : Affichage professionnel des données du jour
- **Statistiques session** : Informations sur la session active
- **Boutons d'action** : Sauvegarde + 2 types de RAZ

### **� Boutons Principaux :**

#### **� "Sauvegarde"** 
- **📧 Fonction :** Export JSON des données avant RAZ
- **📎 Contenu :** Toutes les données de la session
- **🔄 RAZ :** **JAMAIS**
- **⏰ Timing :** Instantané
- **🎯 Usage :** **Sécurité avant RAZ**

#### **� "RAZ Journée"**
- **📧 Fonction :** Remet à zéro UNIQUEMENT les données du jour
- **📎 Contenu :** Factures externes + données UI
- **🔄 RAZ :** **Partielle** (conserve règlements à venir)
- **⏰ Timing :** Instantané
- **🎯 Usage :** **Nettoyage quotidien**
- **⚠️ Préserve :** Session + règlements différés

#### **� "RAZ Fin de Session"** (si session active)
- **📧 Fonction :** Remet à zéro TOUT + clôture session
- **📎 Contenu :** Factures + règlements + session complète
- **🔄 RAZ :** **Complète** (supprime tout)
- **⏰ Timing :** Instantané
- **🎯 Usage :** **Fin d'événement définitive**
- **⚠️ Supprime :** TOUT y compris règlements différés

---

## � **SYSTÈME EMAIL SÉPARÉ (Onglet "Email RAZ")**

### **📍 Localisation :** Onglet "Email RAZ" - Composant `EmailRAZSystem.tsx`

### **🏗️ Architecture en 3 Onglets :**

#### **� Onglet "Envoi Manuel"**
- **� "Envoyer Rapport"** : Envoi email immédiat + RAZ optionnelle
- **🔵 "Test Email"** : Test configuration (jamais de RAZ)
- **🟡 "Aperçu"** : Prévisualisation email (jamais de RAZ)
- **🔴 "Exporter PDF"** : Téléchargement PDF direct (jamais de RAZ)
- **🟠 "Aperçu PDF"** : Prévisualisation PDF (jamais de RAZ)

#### **� Onglet "Envoi Automatique"**  
- **🟣 "Configurer Envoi Auto"** : Programmation quotidienne + RAZ optionnelle

#### **⚙️ Onglet "Configuration"**
- **📧 Configuration des emails** : Destinataires, sujet, options
- **⚠️ Option critique** : "Effectuer une RAZ après envoi"

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

### **🔄 Onglet "RAZ" (Boutons Principaux)**

| Bouton | Localisation | Envoi Email | PDF | RAZ | Conserve Règlements | Usage Principal |
|--------|--------------|-------------|-----|-----|-------------------|-----------------|
| **Sauvegarde** | RAZ | ❌ NON | ❌ NON | ❌ JAMAIS | ✅ OUI | Sécurité |
| **RAZ Journée** | RAZ | ❌ NON | ❌ NON | ✅ Partielle | ✅ OUI | **Quotidien** |
| **RAZ Fin Session** | RAZ | ❌ NON | ❌ NON | ✅ Complète | ❌ NON | **Fin d'événement** |

### **📧 Onglet "Email RAZ" (Boutons Secondaires)**

| Bouton | Onglet Email | Envoi Email | PDF | RAZ | Timing | Usage Principal |
|--------|--------------|-------------|-----|-----|--------|-----------------|
| **Envoyer Rapport** | Manuel | ✅ OUI | ✅ Joint | ⚠️ Si activée | Immédiat | Communication |
| **Test Email** | Manuel | ✅ Test | ❌ NON | ❌ JAMAIS | Immédiat | Vérification |
| **Aperçu Email** | Manuel | ❌ NON | ❌ NON | ❌ JAMAIS | Immédiat | Prévisualisation |
| **Exporter PDF** | Manuel | ❌ NON | ✅ Télécharge | ❌ JAMAIS | Immédiat | Sauvegarde |
| **Aperçu PDF** | Manuel | ❌ NON | ✅ Préview | ❌ JAMAIS | Immédiat | Contrôle qualité |
| **Configurer Auto** | Automatique | ✅ Programmé | ✅ Joint | ⚠️ Si activée | Quotidien | Automation |

---

## 🎯 **RÉPONSE CORRIGÉE À TES QUESTIONS**

### **❓ "Est-ce que la feuille de caisse est envoyée par email automatiquement ?"**

**✅ OUI, MAIS dans l'onglet "Email RAZ" uniquement :**

1. **📍 Va dans l'onglet "Email RAZ"** (pas l'onglet "RAZ")
2. **📍 Sous-onglet "Envoi Automatique"**
3. **✅ Coche "Activer l'envoi automatique quotidien"**
4. **⏰ Choisis une heure** (ex: 20:00)
5. **🔘 Clique "Configurer Envoi Auto"**

### **❓ "Quel bouton réalise l'opération ?"**

**🎯 Pour l'envoi automatique :** Bouton **"Configurer Envoi Auto"** dans l'onglet "Email RAZ"

**🎯 Pour la RAZ quotidienne :** Bouton **"RAZ Journée"** dans l'onglet "RAZ"

### **❓ "RAZ après envoi automatique ?"**

**⚠️ ATTENTION :** C'est une **OPTION SÉPARÉE** dans l'onglet "Email RAZ" → "Configuration"

- **Si tu coches** "Effectuer une RAZ après envoi" → L'email enverra ET fera une RAZ
- **Si tu ne coches pas** → L'email enverra SANS faire de RAZ

---

## 🔄 **WORKFLOWS CORRIGÉS**

### **🌅 Workflow Quotidien Normal :**
```
1. Fin de journée dans l'onglet "RAZ"
2. Clic "Sauvegarde" (sécurité)
3. Clic "RAZ Journée" (conserve règlements)
4. → Données du jour effacées, règlements préservés
```

### **📧 Workflow Email Manuel :**
```
1. Onglet "Email RAZ" → "Envoi Manuel"
2. Clic "Envoyer Rapport"
3. → Email envoyé + RAZ SI configurée
```

### **🔄 Workflow Email Automatique :**
```
1. Configuration une fois dans "Email RAZ"
2. Chaque jour à l'heure programmée :
   - Email envoyé automatiquement
   - RAZ effectuée SI configurée
```

### **🏁 Workflow Fin d'Événement :**
```
1. Onglet "RAZ" 
2. Clic "Sauvegarde" (sécurité)
3. Clic "RAZ Fin de Session"
4. → TOUT supprimé + session fermée
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

## 🎯 **RÉSUMÉ EXÉCUTIF CORRIGÉ**

**Le système MyConfort a DEUX endroits distincts pour les RAZ :**

### **🔄 Onglet "RAZ" (Principal)**
✅ **"RAZ Journée"** : Bouton principal pour usage quotidien (conserve règlements)  
✅ **"RAZ Fin de Session"** : Bouton pour fermeture définitive d'événement  
✅ **"Sauvegarde"** : Export JSON de sécurité  

### **📧 Onglet "Email RAZ" (Communication)**  
✅ **Envoi manuel** : Boutons pour email et PDF à la demande  
✅ **Envoi automatique** : Programmation quotidienne  
✅ **Configuration** : RAZ optionnelle après envoi email  

**🎯 RÉPONSE FINALE :**
- **RAZ quotidienne** = Bouton "RAZ Journée" dans l'onglet "RAZ"
- **Email automatique** = Configuration dans l'onglet "Email RAZ" 
- **RAZ après email** = Option dans "Email RAZ" → "Configuration"

**Ces deux systèmes sont INDÉPENDANTS : tu peux faire une RAZ sans email, ou envoyer un email sans RAZ !**

---

**📞 Support :** GitHub Copilot  
**🔄 Dernière mise à jour :** 28 août 2025, 12:40  
**📋 Document :** Blueprint Système Email RAZ v3.7.0
