import React from 'react';
import { exportToCSV, exportToPDF } from '../../services/exportService';

const SalesExport: React.FC = () => {
    const handleExportCSV = () => {
        exportToCSV();
    };

    const handleExportPDF = () => {
        exportToPDF();
    };

    return (
        <div className="sales-export">
            <h2>Exporter les ventes</h2>
            <button onClick={handleExportCSV}>Exporter en CSV</button>
            <button onClick={handleExportPDF}>Exporter en PDF</button>
        </div>
    );
};

export default SalesExport;