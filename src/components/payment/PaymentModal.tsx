import React from 'react';

const PaymentModal: React.FC = () => {
    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-[#14281D]">💳 Règlements</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <button className="p-4 bg-gradient-to-br from-[#C4D144] to-[#B0C639] text-[#14281D] rounded-lg font-medium hover:shadow-lg transition-all">
                    💰 Espèces
                </button>
                <button className="p-4 bg-gradient-to-br from-[#F2EFE2] to-[#E8F5E8] text-[#14281D] rounded-lg font-medium hover:shadow-lg transition-all border-2 border-[#C4D144]">
                    💳 Carte Bancaire
                </button>
                <button className="p-4 bg-gradient-to-br from-[#14281D] to-[#1a2e22] text-white rounded-lg font-medium hover:shadow-lg transition-all">
                    📝 Chèque
                </button>
                <button className="p-4 bg-gradient-to-br from-[#F2EFE2] to-[#E8F5E8] text-[#14281D] rounded-lg font-medium hover:shadow-lg transition-all border-2 border-[#14281D]">
                    🔄 Multi-Paiement
                </button>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Total à encaisser</h3>
                <p className="text-2xl font-bold text-[#C4D144]">0,00 €</p>
            </div>
            
            <div className="flex gap-3 mt-6">
                <button className="flex-1 px-6 py-3 bg-[#C4D144] text-[#14281D] rounded-lg font-medium hover:bg-[#B0C639] transition-colors">
                    ✅ Valider le paiement
                </button>
                <button className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors">
                    ❌ Annuler
                </button>
            </div>
        </div>
    );
};

export default PaymentModal;
