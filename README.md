# 🏪 Caisse MyConfort - Application de Gestion

## 🎯 PROJET PRINCIPAL : `mon-projet-vite/`

**⚠️ IMPORTANT** : Utiliser UNIQUEMENT le projet Vite dans le dossier `mon-projet-vite/`

## ⚡ VS Code Turbo – MyConfort

Configuration optimisée pour une productivité maximale avec React + Vite + TypeScript + Tailwind.

**📋 Setup complet :** [`docs/dev/VSCode-Setup.md`](./docs/dev/VSCode-Setup.md)

**TL;DR :**
- 🚀 Startup épuré, format automatique on save
- 🤖 Copilot activé pour le code uniquement  
- 🎯 Port 5173 exclusif, optimisations Vite
- 🎤 Flow dictée sans interférences VS Code

### 🚀 Démarrage

```bash
cd mon-projet-vite
npm run dev
```

**URL** : http://localhost:5173 (ou 5174, 5175 selon disponibilité)

### ✨ Fonctionnalités

- ✅ **Interface factures élégante** avec tableau produits
- ✅ **Déduction automatique du stock** lors de l'arrivée de factures N8N
- ✅ **Synchronisation N8N** en temps réel
- ✅ **Gestion du stock physique** avec alertes visuelles
- ✅ **Traçabilité complète** des mouvements de stock
- ✅ **Interface intuitive** avec onglets dédiés

### 📱 Navigation

- **Onglet Factures** : Visualisation des factures N8N avec interface élégante
- **Onglet Stock > Stock physique** : Gestion du stock avec déductions automatiques
- **Autres onglets** : Ventes, Produits, etc.

### 🔄 Workflow Automatique

1. **Facture N8N reçue** → Synchronisation automatique
2. **Produits détectés** → Déduction automatique du stock
3. **Alertes générées** → Notifications visuelles si stock faible
4. **Traçabilité** → Historique complet des mouvements

### 📚 Documentation

- `DEDUCTION-STOCK-AUTOMATIQUE-v3.0.0.md` : Documentation de la déduction automatique
- `AMELIORATION-INTERFACE-FACTURES-v2.1.0.md` : Documentation de l'interface factures

### 🔗 Synchronisation des factures (n8n)

#### Endpoints principaux

- POST `/webhook/caisse/facture` — reçoit une facture individuelle (peut inclure `html_content` pour un email HTML pré‑rendu)
- GET `/sync/invoices` — récupère la liste des factures depuis n8n
- PATCH `/webhook/invoices/{id}/items/{itemId}/status` — met à jour le statut d’un produit

#### Payload JSON attendu (exemple)

```json
{
  "numero_facture": "TEST-012",
  "date_facture": "2025-09-19",
  "nom_client": "Client Demo",
  "email_client": "demo@example.com",
  "telephone_client": "...",
  "montant_ht": 1200,
  "montant_ttc": 1440,
  "total_tva": 240,
  "payment_method": "CB",
  "status": "pending",
  "produits": [
    { "nom": "Produit A", "quantite": 2, "prix_ht": 600, "prix_ttc": 720, "tva": 120 }
  ],
  "html_content": "<html>...</html>"
}
```

#### Services & scripts côté app

- `mon-projet-vite/src/services/externalInvoiceService.ts` (réception/normalisation/cache)
- `mon-projet-vite/src/services/syncService.ts` (GET/PATCH n8n)
- Scripts de diagnostic: `diagnostic-factures.js`, `raz-complet-factures.js`, `test-factures.sh`

#### Variables d’environnement utiles

- `VITE_EXTERNAL_INVOICES_URL`, `VITE_INVOICE_AUTH_TOKEN`, `VITE_EXTERNAL_RUN_SECRET`
- `VITE_N8N_WEBHOOK_URL`, `VITE_N8N_URL`

#### Notes d’intégration

- L’app supporte l’envoi d’un HTML pré‑rendu via `html_content` pour l’email client (contournement des limites de template côté Gmail/n8n).
- La synchronisation peut être déclenchée manuellement (bouton) ou automatiquement (timer).

### 🗂️ Archive

L'ancien projet React a été archivé dans `archive-ancien-projet-react-*/` pour éviter toute confusion.

**Version actuelle** : v3.0.0-deduction-stock-automatique
