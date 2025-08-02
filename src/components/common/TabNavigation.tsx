import React from "react";

const tabs = [
  { label: "👤 Vendeuse", value: "vendeuse", color: "bg-[#89BBFE]" },
  { label: "🛍️ Produits", value: "produits", color: "bg-[#477A0C]" },
  { label: "💳 Règlements", value: "reglements", color: "bg-[#D68FD6]" },
  { label: "📝 Diverses", value: "diverses", color: "bg-[#F2EFE2]", textColor: "text-gray-800" },
  { label: "❌ Annulation", value: "annulation", color: "bg-[#F55D3E]" },
  { label: "📊 CA", value: "ca", color: "bg-[#14281D]" },
  { label: "🔄 RAZ", value: "raz", color: "bg-[#080F0F]" },
];

export default function CashierTabs({ currentTab, onChange }: { currentTab: string, onChange: (t: any) => void }) {
  return (
    <nav className="flex gap-3 justify-center flex-wrap p-4 bg-white rounded-xl shadow-lg border border-gray-100">
      {tabs.map(tab => (
        <button
          key={tab.value}
          className={`
            px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-200 
            touch-manipulation transform hover:scale-105 active:scale-95 shadow-md
            min-w-[120px] min-h-[48px]
            ${currentTab === tab.value 
              ? `${tab.color} ${tab.textColor || 'text-white'} shadow-lg ring-2 ring-offset-2 ring-blue-200` 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}