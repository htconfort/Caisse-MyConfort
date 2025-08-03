import React, { useState } from 'react';

const MiscLine: React.FC = () => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-[#14281D]">📝 Lignes Diverses</h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#C4D144] focus:outline-none"
                        placeholder="Saisir la description de la ligne..."
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-2">Montant (€)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#C4D144] focus:outline-none"
                        placeholder="0,00"
                        step="0.01"
                    />
                </div>
                
                <button className="w-full px-6 py-3 bg-[#C4D144] text-[#14281D] rounded-lg font-medium hover:bg-[#B0C639] transition-colors">
                    ➕ Ajouter au panier
                </button>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Exemples de lignes diverses</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Frais de livraison</li>
                    <li>• Montage/Installation</li>
                    <li>• Réduction exceptionnelle</li>
                    <li>• Service après-vente</li>
                </ul>
            </div>
        </div>
    );
};

export default MiscLine;
