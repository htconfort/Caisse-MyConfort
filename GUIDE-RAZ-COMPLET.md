# Guide d'utilisation - Système RAZ (Remise À Zéro)

## Vue d'ensemble

Le système RAZ permet de gérer efficacement les événements avec un stock physique qui évolue indépendamment du stock général. Il offre une solution complète pour l'initialisation, le suivi et la clôture des événements.

## Architecture du système

### Deux types de stock

1. **Stock général** : Inventaire principal de tous les produits
   - Déduit à chaque vente locale
   - Déduit à chaque facture N8N (tous types de livraison)
   - Persistant entre les événements

2. **Stock physique** : Stock réel sur site lors d'un événement
   - Initialisé au début de chaque événement
   - Déduit lors des ventes locales
   - Déduit uniquement pour les factures N8N "emporté"
   - Remis à zéro en fin d'événement

## Fonctionnalités principales

### 1. Initialisation d'événement

**Bouton : "Nouvel événement"**

- Initialise le stock physique avec des quantités prédéfinies
- Sauvegarde le stock de début d'événement pour référence
- Prépare le système pour un nouvel événement

**Utilisation :**
1. Cliquer sur "Nouvel événement" dans l'onglet "Stock physique"
2. Confirmer l'initialisation
3. Le stock physique est prêt pour l'événement

### 2. Gestion en temps réel

**Déductions automatiques :**
- **Ventes locales** : Déduction immédiate du stock physique
- **Factures N8N "emporté"** : Déduction automatique du stock physique
- **Factures N8N "livraison"** : Pas de déduction du stock physique

**Interface :**
- Suivi en temps réel des quantités
- Alertes de stock faible
- Édition manuelle (avec déverrouillage PIN)

### 3. Remise À Zéro (RAZ)

**Bouton : "RAZ Stock"**

- Génère automatiquement les rapports de fin d'événement
- Exporte les données en PDF
- Envoie les rapports par email
- Remet le stock physique à zéro
- Conserve l'historique

## Processus détaillé

### Début d'événement

1. **Préparation**
   - Vérifier le stock général
   - Planifier les quantités nécessaires

2. **Initialisation**
   - Cliquer sur "Nouvel événement"
   - Le système initialise le stock physique
   - Le stock de début est sauvegardé

3. **Validation**
   - Vérifier les quantités initialisées
   - Ajuster manuellement si nécessaire (déverrouillage requis)

### Pendant l'événement

1. **Ventes automatiques**
   - Toutes les ventes déduisent automatiquement le stock physique
   - Le stock général est également mis à jour

2. **Synchronisation N8N**
   - Les factures "emporté" déduisent le stock physique
   - Les factures "livraison" ne déduisent que le stock général

3. **Suivi en temps réel**
   - Surveillance des niveaux de stock
   - Alertes automatiques pour stock faible

### Fin d'événement (RAZ)

1. **Lancement de la RAZ**
   - Cliquer sur "RAZ Stock"
   - Confirmer l'opération

2. **Génération automatique**
   - Rapport du stock physique restant
   - Feuille de caisse complète
   - Calcul des statistiques

3. **Export et envoi**
   - Génération PDF des rapports
   - Envoi automatique par email
   - Sauvegarde locale

4. **Remise à zéro**
   - Stock physique remis à zéro
   - Stock général conservé
   - Historique sauvegardé

## Interface utilisateur

### Navigation

```
Stock → Stock physique
├── Statistiques en temps réel
├── Bouton "Nouvel événement" (vert)
├── Bouton "RAZ Stock" (rouge)
├── Bouton "Déverrouiller l'édition" (vert/rouge)
└── Tableau des produits avec édition
```

### Modales de confirmation

#### Nouvel événement
- Description de l'initialisation
- Liste des produits qui seront ajoutés
- Bouton de confirmation

#### RAZ (Remise À Zéro)
- Description des opérations à effectuer
- Liste des rapports générés
- Avertissement sur l'irréversibilité
- Bouton de confirmation

### États visuels

- **Traitement en cours** : Spinner avec message
- **Succès** : Icône de validation avec message
- **Erreur** : Message d'erreur détaillé

## Rapports générés

### 1. Rapport de stock physique

**Contenu :**
- Stock restant par produit
- Valeur totale du stock restant
- Articles en rupture
- Articles à stock faible
- Mouvements de stock pendant l'événement

### 2. Feuille de caisse

**Contenu :**
- Liste de toutes les ventes
- Totaux par mode de paiement
- Statistiques par vendeur
- Total général de l'événement

### 3. Historique d'événement

**Sauvegarde :**
- Date et heure de l'événement
- Stock de début
- Stock de fin
- Ventes réalisées
- Rapports générés

## Avantages du système

### Pour la gestion
- **Traçabilité complète** des mouvements de stock
- **Rapports automatiques** en fin d'événement
- **Historique** de tous les événements

### Pour l'opérationnel
- **Simplicité d'utilisation** avec boutons intuitifs
- **Automatisation** des déductions de stock
- **Synchronisation** en temps réel avec N8N

### Pour le suivi
- **Deux niveaux de stock** (général + physique)
- **Alertes automatiques** de stock faible
- **Export PDF** et envoi email automatique

## Sécurité et contrôles

### Déverrouillage PIN
- Protection contre les modifications accidentelles
- Code PIN requis pour éditer le stock manuellement
- Verrouillage automatique après utilisation

### Confirmations
- Double confirmation pour la RAZ
- Messages d'avertissement clairs
- Impossibilité d'annuler une RAZ

### Sauvegardes
- Historique automatique de tous les événements
- Sauvegarde des rapports en local
- Backup des données avant chaque RAZ

## Dépannage

### Problèmes courants

1. **Stock physique incohérent**
   - Utiliser l'édition manuelle pour corriger
   - Vérifier les logs de synchronisation N8N

2. **Erreur lors de la RAZ**
   - Vérifier la connexion réseau
   - Consulter les logs dans la console

3. **Rapports non générés**
   - Vérifier les permissions d'écriture
   - Relancer la RAZ si nécessaire

### Logs et débogage

- Console du navigateur pour les erreurs détaillées
- Messages de confirmation pour chaque opération
- Historique des mouvements de stock

## Conclusion

Le système RAZ offre une solution complète et automatisée pour la gestion des stocks lors d'événements. Il permet un suivi précis, une clôture rapide et une traçabilité complète de toutes les opérations.

L'interface intuitive et les automatisations intégrées réduisent les risques d'erreur tout en fournissant tous les outils nécessaires pour une gestion efficace des événements.
