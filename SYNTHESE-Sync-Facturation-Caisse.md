## Synthèse vulgarisée — Synchronisation Facturation ↔ Caisse (n8n + Supabase)

### En une phrase
La Facturation envoie chaque facture à n8n, n8n l’enregistre dans la base Supabase, puis la Caisse peut lire la liste des factures à jour et afficher/déduire dans le panier.

### Ce qui se passe (pas à pas)
1. Facturation envoie la facture (JSON) vers un webhook n8n.
2. n8n “range” les champs, calcule ce qui manque (ex: TVA), puis fait un upsert dans Supabase (table `public.factures`).
3. n8n renvoie une réponse au caller avec la facture insérée/mise à jour + une liste triée des dernières factures.
4. Côté Caisse (front), on peut lire la liste des factures (via un GET n8n) et l’afficher dans l’onglet Factures / panier.

### Les 3 webhooks côté n8n
- POST `/caisse/facture` (déjà en place): crée/MAJ une facture dans Supabase puis renvoie `{ inserted, list }`.
- POST `/caisse/status` (ajouté dans l’export): met à jour le statut d’une facture (paid/refunded/cancelled…).
- GET `/caisse/factures` (ajouté dans l’export): retourne la liste paginée/filtrée, triée par `created_at DESC`.
- Cron (horaire): relit les 24 dernières heures pour rattraper une éventuelle panne réseau.

Fichier d’export prêt à importer dans n8n:
- `n8n-workflow-caisse-supabase.json`

Prévu pour utiliser un Credential n8n “HTTP Header Auth” nommé `supabase_service_role` et une variable d’env `N8N_SUPABASE_URL`.

### Où est le code côté Caisse (front Vite)
- Client Supabase: `mon-projet-vite/src/lib/supabaseClient.ts`
- Test d’insertion (bouton 🧪): `mon-projet-vite/src/services/supabaseTest.ts`
- UI Factures (inclut bouton Mémo, test Supabase, lecture externes): `mon-projet-vite/src/components/InvoicesTabCompact.tsx`
- Mémo intégré (guide rapide, tests, dépannage): `mon-projet-vite/src/components/SupabaseN8nMemo.tsx`

### Variables à configurer (prod Netlify)
- `VITE_SUPABASE_URL` (ex: `https://doxvtfojavrjrmwpafnf.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` (clé anon publique Supabase)
- `VITE_N8N_ENABLED=true`
- `VITE_N8N_URL` (ex: `https://n8n.srv765811.hstgr.cloud/webhook`)
- `VITE_EXTERNAL_INVOICES_URL` (ex: `.../webhook/caisse/factures`)
- `VITE_EXTERNAL_INVOICES_RUN_URL` (ex: `.../webhook/caisse/facture`)
- `VITE_EXTERNAL_AUTOSYNC=true`

Astuce: Faire “Clear cache & Deploy” après mise à jour.

### Côté Supabase (base de données)
- Table: `public.factures` (colonnes: `numero_facture`, `date_facture`, client, montants, `produits` jsonb, etc.)
- Vue pratique: `public.factures_ordre` (tri `created_at DESC`)
- Contrainte unique: `numero_facture`
- RLS: si on utilise la clé `anon` côté n8n, créer des policies; si `service_role`, pas nécessaire.

### Sécurité recommandée
- Signature HMAC des webhooks (anti-spoof et anti-replay) avec un secret côté serveur n8n.

### Tests rapides
- Bouton dans la Caisse: “🧪 Test insert Supabase” (affiche “Insert OK” si tout est bon).
- cURL Facture:
  - POST facture: `curl -X POST "https://n8n.../webhook/caisse/facture" -H "Content-Type: application/json" -d '{ ... }'`
  - GET liste: `curl -X GET "https://n8n.../webhook/caisse/factures?limit=50"`
  - POST statut: `curl -X POST "https://n8n.../webhook/caisse/status" -H "Content-Type: application/json" -d '{ ... }'`

### Points importants à retenir
- Domaine Supabase: `doxvtfojavrjrmwpafnf.supabase.co` (bien `tfo`).
- Dev local: port Vite 5173.
- En cas d’écran blanc: vérifier les variables d’environnement (remplacer tous les placeholders) et regarder la console du navigateur.


