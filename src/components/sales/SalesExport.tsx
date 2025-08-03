import React from 'react';

const ExportButtons: React.FC = () => {
    return (
        <div className="flex gap-3">
            <button className="px-4 py-2 bg-[#C4D144] text-[#14281D] rounded-lg font-medium hover:bg-[#B0C639] transition-colors">
                📤 Export CSV
            </button>
            <button className="px-4 py-2 bg-[#14281D] text-white rounded-lg font-medium hover:bg-[#1a2e22] transition-colors">
                📄 Export PDF
            </button>
        </div>
    );
};

export default ExportButtons;
