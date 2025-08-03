import React from 'react';

const SalesHistory: React.FC = () => {
    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-bold mb-3 text-[#14281D]">📋 Historique des Ventes</h3>
            
            <div className="text-center py-8 text-gray-500">
                <p>Aucune vente enregistrée pour le moment</p>
                <p className="text-sm mt-2">Les ventes apparaîtront ici une fois effectuées</p>
            </div>
        </div>
    );
};

export default SalesHistory;
