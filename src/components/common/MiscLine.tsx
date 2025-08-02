import React, { useState } from 'react';
import { MiscItem, THEME_COLORS } from '../../types';

const MiscLine: React.FC = () => {
  const [items, setItems] = useState<MiscItem[]>([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  const addMiscItem = () => {
    if (description.trim() && price) {
      const newItem: MiscItem = {
        id: Date.now().toString(),
        description: description.trim(),
        price: parseFloat(price)
      };
      setItems([...items, newItem]);
      setDescription('');
      setPrice('');
    }
  };

  const removeMiscItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        📝 <span>Lignes Diverses</span>
      </h2>
      
      {/* Formulaire d'ajout */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Service, remise, frais..."
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>
        
        <button
          onClick={addMiscItem}
          disabled={!description.trim() || !price}
          className={`
            mt-4 w-full py-3 rounded-lg font-semibold transition-all duration-200 touch-manipulation
            ${description.trim() && price
              ? `bg-[${THEME_COLORS.primary}] text-white hover:opacity-90 transform hover:scale-[1.02] active:scale-[0.98] shadow-md`
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          ➕ Ajouter la ligne
        </button>
      </div>

      {/* Liste des items */}
      {items.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-700">Lignes ajoutées:</h3>
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <span className="font-medium text-gray-800">{item.description}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-green-600">
                  {item.price.toFixed(2)}€
                </span>
                <button
                  onClick={() => removeMiscItem(item.id)}
                  className={`
                    px-3 py-2 bg-[${THEME_COLORS.warning}] text-white rounded-lg 
                    hover:opacity-90 transition-all duration-200 touch-manipulation
                    transform hover:scale-105 active:scale-95
                  `}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          
          {/* Total */}
          <div className="border-t-2 pt-4">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span className="text-gray-700">Total lignes diverses:</span>
              <span className={`text-[${THEME_COLORS.primary}]`}>
                {total.toFixed(2)}€
              </span>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg">Aucune ligne diverse ajoutée</p>
          <p className="text-sm">Utilisez le formulaire ci-dessus pour ajouter des lignes personnalisées</p>
        </div>
      )}
    </div>
  );
};

export default MiscLine;
