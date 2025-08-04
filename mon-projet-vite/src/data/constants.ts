import type { TabType } from '../types';
import { User, Package, BarChart, FileText, RotateCcw, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Configuration des onglets de navigation
export const tabs: Array<{id: TabType, label: string, icon: LucideIcon}> = [
  { id: 'vendeuse', label: 'Vendeuse', icon: User },
  { id: 'produits', label: 'Produits', icon: Package },
  { id: 'ventes', label: 'Ventes', icon: BarChart },
  { id: 'diverses', label: 'Diverses', icon: FileText },
  { id: 'annulation', label: 'Annulation', icon: RotateCcw },
  { id: 'ca', label: 'CA Instant', icon: BarChart },
  { id: 'raz', label: 'RAZ', icon: RefreshCw },
];

// Configuration des catégories de produits
export const categories = ['Matelas', 'Sur-matelas', 'Couettes', 'Oreillers', 'Plateau', 'Accessoires'] as const;

// Configuration des moyens de paiement
export const paymentMethods = [
  { id: 'card', label: '💳 Carte' },
  { id: 'cash', label: '💵 Espèces' },
  { id: 'check', label: '📝 Chèque' },
  { id: 'multi', label: '🔄 Multi' }
] as const;
