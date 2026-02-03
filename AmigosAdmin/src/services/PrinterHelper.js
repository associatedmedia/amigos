import { BLEPrinter, NetPrinter } from 'react-native-thermal-receipt-printer';

// ✅ MANUALLY DEFINE ESC/POS COMMANDS (Fixes the undefined error)
const PrinterCommands = {
  INIT: '\x1b\x40',
  CENTER: '\x1b\x61\x01',
  LEFT: '\x1b\x61\x00',
  RIGHT: '\x1b\x61\x02',
  BOLD_ON: '\x1b\x45\x01',
  BOLD_OFF: '\x1b\x45\x00',
  TEXT_NORMAL: '\x1b\x21\x00',
  TEXT_BIG: '\x1b\x21\x30', // Double height & width
  FEED_LINES: '\x1b\x64\x03', // Feed 3 lines
};

const PrinterHelper = {
  
  // 1. Initialize
  init: () => {
    BLEPrinter.init();
    NetPrinter.init();
  },

  // 2. Connect Bluetooth
  connectBLE: async (macAddress) => {
    try {
      await BLEPrinter.connectPrinter(macAddress);
      return true;
    } catch (err) {
      console.log("BLE Connection Error", err);
      return false;
    }
  },

  // 3. Connect WiFi
  connectNet: async (ip, port = 9100) => {
    try {
      await NetPrinter.connectPrinter(ip, port);
      return true;
    } catch (err) {
      console.log("Net Connection Error", err);
      return false;
    }
  },

  // 4. PRINT KOT RECEIPT
  printOrder: async (order) => {
    try {
      const { CENTER, LEFT, BOLD_ON, BOLD_OFF, FEED_LINES, INIT } = PrinterCommands;

      let receipt = "";

      // Reset Printer
      receipt += INIT;

      // --- HEADER ---
      receipt += `${CENTER}${BOLD_ON}AMIGOS PIZZA${BOLD_OFF}\n`;
      receipt += `${CENTER}KITCHEN ORDER TICKET (KOT)\n`;
      receipt += `${CENTER}--------------------------------\n`;
      
      // --- ORDER DETAILS ---
      receipt += `${LEFT}${BOLD_ON}Order #${order.id}${BOLD_OFF}\n`;
      receipt += `${LEFT}Date: ${new Date().toLocaleString()}\n`;
      receipt += `${LEFT}Type: ${order.status ? order.status.toUpperCase() : 'ORDER'}\n`;
      if(order.user) receipt += `${LEFT}Cust: ${order.user.name}\n`;
      receipt += `${CENTER}--------------------------------\n`;

      // --- ITEMS ---
      receipt += `${LEFT}${BOLD_ON}QTY   ITEM                  PRICE${BOLD_OFF}\n`;
      
      if(order.items && order.items.length > 0) {
        order.items.forEach(item => {
          // Pad quantity to 4 chars
          const qty = `${item.quantity}`.padEnd(5);
          
          // Truncate name if too long (max 18 chars to fit on line)
          let name = item.product ? item.product.name : "Unknown";
          if(name.length > 18) name = name.substring(0,18) + "..";
          const namePadded = name.padEnd(20);
          
          receipt += `${LEFT}${qty} ${namePadded} ${item.price}\n`;
        });
      } else {
        receipt += `${CENTER}No items found\n`;
      }

      receipt += `${CENTER}--------------------------------\n`;
      
      // --- FOOTER ---
      receipt += `${LEFT}${BOLD_ON}TOTAL: Rs. ${order.total_amount}${BOLD_OFF}\n`;
      receipt += FEED_LINES; // Cut paper space
      
      // Send to Printer
      await BLEPrinter.printBill(receipt);

    } catch (err) {
      console.error("Printing failed", err);
    }
  }
};

export default PrinterHelper;