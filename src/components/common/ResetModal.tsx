import React, { useState } from 'react';

const ResetModal: React.FC = () => {
    const [showConfirm, setShowConfirm] = useState(false);

    const handleReset = () => {
        // Ici on ajouterait la logique de reset
        alert('Données réinitialisées !');
        setShowConfirm(false);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-red-600">⚠️ Remise à Zéro</h2>
            
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-800 mb-2">Attention !</h3>
                <p className="text-red-700">
                    Cette action va supprimer définitivement toutes les données :
                </p>
                <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                    <li>Historique des ventes</li>
                    <li>Chiffre d'affaires des vendeuses</li>
                    <li>Données du panier en cours</li>
                    <li>Paramètres de session</li>
                </ul>
            </div>
            
            {!showConfirm ? (
                <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                    🗑️ Demander la remise à zéro
                </button>
            ) : (
                <div className="space-y-3">
                    <p className="text-center font-medium text-red-800">
                        Êtes-vous vraiment sûr(e) de vouloir tout supprimer ?
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            ✅ Oui, tout supprimer
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                        >
                            ❌ Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResetModal;
