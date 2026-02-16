import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to remove diacritics for standard font compatibility
const removeDiacritics = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
};

export const generateInvoice = (date, orderData, cartItems, total) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(139, 0, 0); // Chianti Red
    doc.text("Restaurant Chianti", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("Strada Stefan cel Mare, Roman", pageWidth / 2, 27, { align: 'center' });
    doc.text("Tel: 0233 123 456", pageWidth / 2, 32, { align: 'center' });

    // Divider
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(10, 38, pageWidth - 10, 38);

    // --- Invoice Details (Left Side) ---
    let leftY = 50;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`COMANDA #${date.getTime().toString().slice(-6)}`, 14, leftY);

    leftY += 7;
    doc.setFontSize(10);
    doc.text(`Data: ${date.toLocaleString('ro-RO')}`, 14, leftY);

    leftY += 6;
    let deliveryLabel = 'Livrare la Domiciliu';
    if (orderData.deliveryMethod === 'pickup') deliveryLabel = 'Ridicare Personala';
    else if (orderData.deliveryMethod === 'dinein') deliveryLabel = 'Servire in Restaurant';
    else if (orderData.deliveryMethod === 'event-restaurant') deliveryLabel = 'Eveniment la Restaurant';
    else if (orderData.deliveryMethod === 'event-location') deliveryLabel = 'Eveniment la Locatie';

    doc.text(`Mod Livrare: ${deliveryLabel}`, 14, leftY);

    // --- Client Details (Right Side) ---
    const rightColX = pageWidth - 90; // Moved slightly left to give more space
    let rightY = 50;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text("Date Client:", rightColX, rightY);

    rightY += 7;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    // Name / Company
    const clientName = orderData.clientType === 'juridica'
        ? orderData.companyName
        : `${orderData.firstName || ''} ${orderData.lastName || ''}`;
    doc.text(removeDiacritics(clientName), rightColX, rightY);

    // CUI
    if (orderData.clientType === 'juridica' && orderData.cui) {
        rightY += 6;
        doc.text(`CUI: ${orderData.cui}`, rightColX, rightY);
    }

    // Phone
    if (orderData.phone) {
        rightY += 6;
        doc.text(`Tel: ${orderData.phone}`, rightColX, rightY);
    }

    // Address (only if delivery or event-location)
    if (orderData.deliveryMethod === 'delivery' || orderData.deliveryMethod === 'event-location') {
        rightY += 6;
        const rawAddress = `Adresa: ${orderData.city || ''}, ${orderData.neighborhood || ''}, ${orderData.address || ''}`;
        const cleanAddress = removeDiacritics(rawAddress);

        // Split address into multiple lines if needed (max width 80)
        const addressLines = doc.splitTextToSize(cleanAddress, 80);
        doc.text(addressLines, rightColX, rightY);

        // Increase rightY based on number of lines
        rightY += (addressLines.length * 4);
    }

    // --- Items Table ---
    // Start table below the lowest point of header info + padding
    const startY = Math.max(leftY, rightY) + 15;

    const tableData = cartItems.map(item => [
        removeDiacritics(item.name),
        `${item.quantity} buc`,
        `${item.price.toFixed(2)} Lei`,
        `${(item.price * item.quantity).toFixed(2)} Lei`
    ]);

    autoTable(doc, {
        startY: startY,
        head: [['Produs', 'Cantitate', 'Pret Unitar', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 'auto' }, // Item name
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' }
        }
    });

    // --- Totals ---
    const finalY = doc.lastAutoTable.finalY + 10;
    const labelsX = pageWidth - 70;
    const valuesX = pageWidth - 14;

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryCost = total - subtotal;

    doc.setFontSize(10);
    doc.text("Subtotal:", labelsX, finalY);
    doc.text(`${subtotal.toFixed(2)} Lei`, valuesX, finalY, { align: 'right' });

    doc.text("Transport:", labelsX, finalY + 6);
    doc.text(`${deliveryCost.toFixed(2)} Lei`, valuesX, finalY + 6, { align: 'right' });

    // Total Bold
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("TOTAL DE PLATA:", labelsX - 10, finalY + 14); // Moved label slightly left
    doc.setTextColor(139, 0, 0);
    doc.text(`${total.toFixed(2)} Lei`, valuesX, finalY + 14, { align: 'right' });

    // --- Footer ---
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.text("Va multumim pentru comanda!", pageWidth / 2, finalY + 30, { align: 'center' });

    // Save PDF
    doc.save(`Factura_Chianti_${date.getTime()}.pdf`);
};
