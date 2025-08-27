import { jsPDF } from 'jspdf'; // ✅ import correct
import html2canvas from 'html2canvas';

export interface PrintJob {
  html?: string; // si fourni, on rend dans un conteneur temporaire
  fileName?: string;
  format?: 'A4' | 'A5' | 'A6';
  landscape?: boolean;
  scale?: number; // multiplicateur de résolution pour html2canvas
  elementId?: string; // alternative à html
  marginMm?: number; // marge intérieure PDF
}

export interface PrintResult {
  ok: boolean;
  path?: string; // laissé pour compat éventuelle (desktop)
  blobUrl?: string; // URL du PDF généré
  error?: string;
}

/**
 * Service d'impression / export PDF robuste (multi-page, haute résolution, couleurs exactes)
 */
export class PrintService {
  // ————————————————————————————————————————————————————————
  // PDF — Capture d'un élément DOM OU d'une string HTML
  // ————————————————————————————————————————————————————————
  static async generatePDF(job: PrintJob): Promise<PrintResult> {
    const {
      elementId,
      html,
      fileName = 'rapport-caisse.pdf',
      format = 'A4',
      landscape = false,
      // Si non précisé, on prend un max(scale, devicePixelRatio) pour la netteté
      scale = Math.max(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 2),
      marginMm = 10,
    } = job;

    let cleanup: (() => void) | null = null;

    try {
      // 1) Récupérer l'élément à rendre
      let target: HTMLElement | null = null;

      if (elementId) {
        target = document.getElementById(elementId);
        if (!target) throw new Error(`Élément introuvable: #${elementId}`);
      } else if (html) {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-10000px';
        container.style.top = '0';
        container.style.width = '794px'; // ~A4 @ 96dpi, ajoute une base pour layout
        container.innerHTML = html;
        document.body.appendChild(container);
        target = container;

        cleanup = () => {
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        };
      } else {
        throw new Error('Vous devez fournir elementId ou html');
      }

      // 2) Capture avec html2canvas (haute résolution)
      const canvas = await html2canvas(target, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
        imageTimeout: 0,
        logging: false,
        foreignObjectRendering: true,
      });

      // 3) Calcul des dimensions selon le format et orientation
      const formats = {
        A4: { w: 210, h: 297 },
        A5: { w: 148, h: 210 },
        A6: { w: 105, h: 148 },
      };

      let { w: pageWidth, h: pageHeight } = formats[format];
      if (landscape) [pageWidth, pageHeight] = [pageHeight, pageWidth];

      // Dimensions utilisables (moins les marges)
      const contentWidth = pageWidth - 2 * marginMm;
      const contentHeight = pageHeight - 2 * marginMm;

      // 4) Création du PDF
      const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: format.toLowerCase() as 'a4' | 'a5' | 'a6',
      });

      // Dimensions image adaptées au contenu
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let yOffset = 0;

      // 5) Pagination (découpage en fenêtres)
      while (remainingHeight > 0) {
        if (yOffset > 0) pdf.addPage(); // Nouvelle page sauf pour la première

        const windowHeight = Math.min(remainingHeight, contentHeight);
        const sourceY = imgHeight - remainingHeight;

        // Découpe de l'image source
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCanvas.width = canvas.width;
        tempCanvas.height = (windowHeight * canvas.width) / imgWidth;

        tempCtx.drawImage(
          canvas,
          0, (sourceY * canvas.width) / imgWidth, // source x, y
          canvas.width, tempCanvas.height, // source width, height
          0, 0, // dest x, y
          canvas.width, tempCanvas.height // dest width, height
        );

        const windowData = tempCanvas.toDataURL('image/png', 1.0);
        pdf.addImage(windowData, 'PNG', marginMm, marginMm, imgWidth, windowHeight);

        remainingHeight -= windowHeight;
        yOffset += windowHeight;
      }

      // 6) Métadonnées
      pdf.setProperties({
        title: 'Rapport de Caisse MyConfort',
        subject: 'Rapport quotidien des ventes',
        author: 'MyConfort POS System',
        creator: 'MyConfort Cash Register',
        keywords: 'caisse, rapport, ventes, myconfort',
      });

      // 7) Sauvegarde + création blob URL
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      pdf.save(fileName);

      console.log('✅ PDF généré avec succès:', fileName);
      return { ok: true, blobUrl };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur génération PDF:', errorMessage);
      return { ok: false, error: `Erreur lors de la génération du PDF: ${errorMessage}` };
    } finally {
      // Nettoyage du conteneur temporaire
      if (cleanup) cleanup();
    }
  }

  // ————————————————————————————————————————————————————————
  // Impression native via fenêtre dédiée
  // ————————————————————————————————————————————————————————
  static async printElement(elementId: string): Promise<PrintResult> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Élément introuvable pour impression: #${elementId}`);
      }

      // Clone pour éviter d'altérer le DOM
      const printContent = element.cloneNode(true) as HTMLElement;

      // Fenêtre d'impression
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error("Impossible d'ouvrir la fenêtre d'impression. Vérifiez le blocage des popups.");
      }

      // CSS optimisé pour l'impression
      const printCSS = `
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * { box-sizing: border-box; }
            .no-print, .print-hidden { display: none !important; }
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
            tr { page-break-inside: avoid; }
            .header {
              background: #007bff !important;
              color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
            }
            .break-before { page-break-before: always; }
            .break-after { page-break-after: always; }
          }
          @media screen {
            body {
              padding: 20px;
              background: #f5f5f5;
            }
          }
        </style>
      `;

      // Contenu HTML de la fenêtre d'impression
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

      // Attendre le rendu complet puis lancer l'impression
      return new Promise((resolve) => {
        printWindow.onload = () => {
          // Double requestAnimationFrame pour garantir le rendu
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                printWindow.print();
                setTimeout(() => {
                  printWindow.close();
                  resolve({ ok: true });
                }, 500);
              }, 250);
            });
          });
        };
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur impression:', errorMessage);
      return { ok: false, error: `Erreur lors de l'impression: ${errorMessage}` };
    }
  }

  // ————————————————————————————————————————————————————————
  // Méthode de convenance pour PDF depuis élément (rétrocompatibilité)
  // ————————————————————————————————————————————————————————
  static async generatePDFFromElement(elementId: string, filename: string = 'rapport-caisse.pdf'): Promise<boolean> {
    const result = await this.generatePDF({ elementId, fileName: filename });
    if (!result.ok && result.error) {
      throw new Error(result.error);
    }
    return result.ok;
  }

  // ————————————————————————————————————————————————————————
  // Utils de formatage (cohérentes avec le projet)
  // ————————————————————————————————————————————————————————
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  }

  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    }).format(date);
  }

  static formatTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  }

  static formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  }
}
