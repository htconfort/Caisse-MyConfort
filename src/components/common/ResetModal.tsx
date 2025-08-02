import React, { useState } from 'react';
import { THEME_COLORS } from '../../types';

const ResetModal: React.FC = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [exportBeforeReset, setExportBeforeReset] = useState(true);

  const handleReset = () => {
    if (exportBeforeReset) {
      // Exporter les données avant la remise à zéro
      exportDailyData();
    }
    
    // Réinitialiser toutes les données
    localStorage.removeItem('cart');
    localStorage.removeItem('dailySales');
    localStorage.removeItem('sales');
    localStorage.setItem('lastReset', new Date().toISOString());
    
    setShowConfirm(false);
    
    // Recharger l'application pour refléter les changements
    window.location.reload();
  };

  const exportDailyData = () => {
    const today = new Date().toLocaleDateString('fr-FR');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const dailySales = JSON.parse(localStorage.getItem('dailySales') || '{}');
    
    const exportData = {
      date: today,
      sales,
      dailySales,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caisse-myconfort-${today.replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLastResetInfo = () => {
    const lastReset = localStorage.getItem('lastReset');
    if (lastReset) {
      return new Date(lastReset).toLocaleString('fr-FR');
    }
    return 'Jamais';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        🔄 <span>Remise à Zéro (RAZ)</span>
      </h2>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">
              Attention - Action irréversible
            </h3>
            <p className="text-yellow-700 mt-2">
              Cette action va supprimer toutes les données de la journée :
              panier actuel, ventes, chiffre d'affaires par vendeuse.
            </p>
          </div>
        </div>
      </div>

      {/* Informations système */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          📊 Informations système
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Dernière RAZ:</span>
            <div className="text-gray-800">{getLastResetInfo()}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Date actuelle:</span>
            <div className="text-gray-800">
              {new Date().toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Options d'export */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          💾 Options de sauvegarde
        </h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={exportBeforeReset}
            onChange={(e) => setExportBeforeReset(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-blue-700">
            Exporter automatiquement les données avant la remise à zéro
          </span>
        </label>
        <p className="text-xs text-blue-600 mt-2 ml-8">
          Recommandé pour conserver un historique des ventes
        </p>
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowConfirm(true)}
          className={`
            flex-1 py-4 px-6 bg-[${THEME_COLORS.warning}] text-white rounded-lg 
            font-semibold text-lg transition-all duration-200 touch-manipulation
            transform hover:scale-[1.02] active:scale-[0.98] shadow-md
            hover:opacity-90
          `}
        >
          🔄 Effectuer la RAZ
        </button>
        
        <button
          onClick={exportDailyData}
          className={`
            flex-1 py-4 px-6 bg-[${THEME_COLORS.primary}] text-white rounded-lg 
            font-semibold text-lg transition-all duration-200 touch-manipulation
            transform hover:scale-[1.02] active:scale-[0.98] shadow-md
            hover:opacity-90
          `}
        >
          💾 Export uniquement
        </button>
      </div>

      {/* Modal de confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              🚨 Confirmation de la RAZ
            </h3>
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir effectuer la remise à zéro ? 
              Cette action est <strong>irréversible</strong>.
            </p>
            
            {exportBeforeReset && (
              <div className="bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
                <p className="text-green-700 text-sm">
                  ✅ Les données seront exportées automatiquement avant la RAZ
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReset}
                className={`
                  flex-1 py-3 px-4 bg-[${THEME_COLORS.warning}] text-white rounded-lg 
                  font-semibold hover:opacity-90 transition-all
                `}
              >
                Confirmer la RAZ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetModal;
