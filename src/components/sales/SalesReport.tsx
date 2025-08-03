import React from 'react';

const SalesReport: React.FC = () => {
    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-[#14281D]">📊 Chiffre d'Affaires</h2>
            
            <div className="mb-6 p-4 bg-gradient-to-r from-[#F2EFE2] to-[#E8F5E8] rounded-lg">
                <h3 className="text-xl font-semibold text-[#14281D]">
                    Total du jour: <span className="text-[#C4D144]">0,00 €</span>
                </h3>
            </div>
            
            <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-medium">Ventes par vendeuse</h4>
                    <p className="text-sm text-gray-600">Aucune vente enregistrée</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-medium">Statistiques</h4>
                    <p className="text-sm text-gray-600">Nombre de ventes: 0</p>
                    <p className="text-sm text-gray-600">Ticket moyen: 0,00 €</p>
                </div>
            </div>
        </div>
    );
};

export default SalesReport;
