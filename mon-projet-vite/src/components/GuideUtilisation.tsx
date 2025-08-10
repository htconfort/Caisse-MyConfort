import React, { useState } from 'react';
import { Book, ChevronDown, ChevronRight, ExternalLink, FileText } from 'lucide-react';

interface GuideUtilisationProps {
  onClose?: () => void;
}

export const GuideUtilisation: React.FC<GuideUtilisationProps> = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const sections = [
    {
      id: 'presentation',
      title: '📱 Présentation générale',
      content: `
        **Caisse MyConfort** est une application de caisse événementielle moderne construite avec React, TypeScript et Vite.
        
        **Technologies utilisées :**
        - Frontend : React 18 + TypeScript + Vite
        - Stockage : Dexie (IndexedDB) pour la persistance locale
        - Intégration : N8N pour la synchronisation des factures
        - UI : Lucide React (icônes) + CSS moderne
        
        **Application accessible sur :** http://localhost:5173
      `
    },
    {
      id: 'navigation',
      title: '🧭 Navigation et onglets',
      content: `
        L'application dispose de **10 onglets principaux** :
        
        1. **👩‍💼 Vendeuse** - Sélection obligatoire de la vendeuse active
        2. **📦 Produits** - Catalogue de 49 produits (recherche + ajout panier)
        3. **📄 Factures** - Consultation factures N8N + mode élégant
        4. **📊 Stock** - Gestion inventaires (4 sous-onglets + 3 modes vue)
        5. **🛒 Ventes** - Historique des transactions
        6. **➕ Diverses** - Articles personnalisés hors catalogue
        7. **❌ Annulation** - Gestion panier + annulation ventes
        8. **💰 CA** - Chiffre d'affaires et classement vendeuses
        9. **⚙️ Gestion** - Administration des vendeuses (vous êtes ici !)
        10. **🔄 RAZ** - Remise à zéro et rapports
      `
    },
    {
      id: 'workflow',
      title: '🔄 Workflow de vente',
      content: `
        **Processus standard :**
        
        1. **Sélectionner une vendeuse** (onglet Vendeuse) - OBLIGATOIRE
        2. **Ajouter des produits** (onglet Produits ou Diverses)
        3. **Vérifier le panier** (visible en permanence en bas)
        4. **Finaliser la vente** (bouton Valider dans le panier)
        5. **Choisir le moyen de paiement** (Carte/Espèces/Chèque/Mixte)
        
        **Le panier flottant** reste accessible sur tous les onglets et affiche :
        - Nombre d'articles
        - Total en euros
        - Actions : Modifier quantités, Vider, Valider
      `
    },
    {
      id: 'stock',
      title: '📦 Gestion du stock',
      content: `
        **4 types de stock disponibles :**
        
        - **Général** : Stock principal avec déductions automatiques N8N
        - **Stand** : Stock physique sur le stand
        - **Remorque** : Stock en attente dans la remorque
        - **Physique** : Inventaire physique et comptages
        
        **3 modes de vue :**
        - **Vue Cartes** : Navigation avec cartes élégantes (par défaut)
        - **Vue Compacte** : Cartes plus petites sans descriptions
        - **Vue Horizontale** : Boutons compacts sur une ligne
        
        **Déduction automatique :** Les factures N8N déduisent automatiquement du stock général.
      `
    },
    {
      id: 'factures',
      title: '📄 Factures et N8N',
      content: `
        **Synchronisation automatique :**
        - Toutes les 30 secondes si N8N est activé
        - Endpoint : /sync/invoices
        - Proxy vers http://localhost:5678
        
        **Mode élégant ✨**
        Un bouton en haut à droite permet de basculer vers un mode élégant avec :
        - Interface modernisée (glassmorphism)
        - Animations fluides
        - Design sophistiqué
        
        **Configuration N8N :**
        - VITE_N8N_ENABLED=true/false
        - VITE_N8N_URL=/api/n8n
        - VITE_N8N_TARGET=http://localhost:5678
      `
    },
    {
      id: 'raz',
      title: '🔄 RAZ et sauvegarde',
      content: `
        **Options de remise à zéro :**
        
        1. **Ventes du jour** : Remet à zéro les CA quotidiens
        2. **Panier actuel** : Vide le panier en cours
        3. **Factures N8N** : Efface les factures synchronisées
        4. **Vendeuse sélectionnée** : Désélectionne la vendeuse active
        5. **Statistiques vendeuses** : ⚠️ Remet à zéro TOUTES les stats
        6. **RAZ COMPLÈTE** : 🚨 DANGER - Supprime TOUTES les données
        
        **Export automatique :** Sauvegarde JSON proposée avant chaque RAZ.
        **Gestion des sessions :** Clôture/ouverture automatique avec totaux.
      `
    },
    {
      id: 'depannage',
      title: '🔧 Dépannage',
      content: `
        **Problèmes courants :**
        
        - **Port occupé :** lsof -ti:5173 puis kill -9 <PID>
        - **N8N ECONNREFUSED :** Normal si N8N pas démarré
        - **Cache Vite :** rm -rf node_modules/.vite puis npm run dev --force
        - **Données perdues :** Vérifier IndexedDB (F12 → Application → IndexedDB)
        
        **Logs utiles :**
        - Console navigateur : Logs Dexie, Session, RAZ
        - Variables debug : VITE_LOG_LEVEL=debug
        
        **Reset IndexedDB :** indexedDB.deleteDatabase('MyConfortCaisseV2')
      `
    }
  ];

  const openGuideFile = (filename: string) => {
    const baseUrl = window.location.origin;
    const guidePath = `/guide-d-utilisation/${filename}`;
    window.open(baseUrl + guidePath, '_blank');
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      {/* En-tête du guide */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Book size={28} />
            Guide d'Utilisation
          </h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            Documentation interactive de Caisse MyConfort
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => openGuideFile('Guide-utilisation-Caisse-MyConfort.md')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}
            title="Ouvrir le guide utilisateur complet"
          >
            <FileText size={16} />
            Guide Utilisateur
          </button>
          
          <button
            onClick={() => openGuideFile('Guide-utilisation-Caisse-MyConfort-Complet.md')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}
            title="Ouvrir le guide technique complet"
          >
            <ExternalLink size={16} />
            Guide Technique
          </button>
        </div>
      </div>

      {/* Sections du guide */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <div
              key={section.id}
              style={{
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {/* Header de section */}
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%',
                  background: isExpanded ? '#f8f9fa' : 'white',
                  border: 'none',
                  padding: '15px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#495057',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{section.title}</span>
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              
              {/* Contenu de section */}
              {isExpanded && (
                <div style={{
                  padding: '20px',
                  background: '#fafbfc',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#495057',
                    whiteSpace: 'pre-line'
                  }}>
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pied de page */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#e9ecef',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
          📁 Documentation complète disponible dans le dossier projet
        </div>
        <div>
          <strong>Emplacement :</strong> /guide-d-utilisation/ 
          • <strong>Version :</strong> Caisse MyConfort v3.x 
          • <strong>Dernière mise à jour :</strong> 10 août 2025
        </div>
      </div>
    </div>
  );
};

export default GuideUtilisation;
