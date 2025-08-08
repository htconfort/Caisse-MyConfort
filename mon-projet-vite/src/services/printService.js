import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PrintService {
  static async generatePDF(elementId, filename = 'rapport-caisse.pdf') {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Élément non trouvé pour l\'impression');
      }

      // Configuration pour une meilleure qualité d'impression
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Dimensions A4 en mm
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      // Première page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Métadonnées du PDF
      pdf.setProperties({
        title: 'Rapport de Caisse MyConfort',
        subject: 'Rapport quotidien des ventes',
        author: 'MyConfort POS System',
        creator: 'MyConfort Cash Register',
        producer: 'MyConfort App v1.0'
      });
      
      pdf.save(filename);
      
      console.log('✅ PDF généré avec succès:', filename);
      return true;
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      throw new Error(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  }
  
  static async printElement(elementId) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Élément non trouvé pour l\'impression');
      }

      // Cloner l'élément pour l'impression
      const printContent = element.cloneNode(true);
      
      // Créer une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups ne sont pas bloqués.');
      }

      // CSS spécifique pour l'impression
      const printCSS = `
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            * {
              box-sizing: border-box;
            }
            .no-print {
              display: none !important;
            }
            .printable-content {
              width: 100%;
              max-width: none;
              box-shadow: none !important;
            }
            table {
              page-break-inside: avoid;
              border-collapse: collapse;
              width: 100%;
            }
            tr {
              page-break-inside: avoid;
            }
            .header {
              background: #007bff !important;
              color: white !important;
              -webkit-print-color-adjust: exact;
            }
          }
          @media screen {
            body {
              padding: 20px;
              background: #f5f5f5;
            }
          }
        </style>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Rapport de Caisse - MyConfort</title>
          ${printCSS}
        </head>
        <body>
          <div class="printable-content">
            ${printContent.innerHTML}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Attendre le chargement puis imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 500);
        }, 250);
      };
      
      console.log('✅ Impression lancée avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur impression:', error);
      throw new Error(`Erreur lors de l'impression: ${error.message}`);
    }
  }
  
  static formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
  
  static formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
  
  static formatTime(date) {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
