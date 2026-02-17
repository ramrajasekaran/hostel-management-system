const net = require('net');

/**
 * PrinterService.js
 * Handles raw TCP/IP communication with Thermal Printers on Port 9100.
 */
class PrinterService {
    constructor() {
        this.defaultIP = '192.168.1.100'; // Placeholder for default printer IP
        this.port = 9100;
    }

    async printNetwork(ip, data) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();

            client.setTimeout(5000); // 5 second timeout

            client.connect(this.port, ip || this.defaultIP, () => {
                console.log(`Connected to printer at ${ip}`);
                client.write(data);
                client.end();
            });

            client.on('end', () => {
                console.log('Finished print job and disconnected.');
                resolve(true);
            });

            client.on('error', (err) => {
                console.error('Printer connection error:', err);
                client.destroy();
                reject(err);
            });

            client.on('timeout', () => {
                console.error('Printer connection timeout');
                client.destroy();
                reject(new Error('Connection timeout'));
            });
        });
    }

    // Helper to format ESC/POS strings (same as Bluetooth logic but for Node.js)
    generateESC(content) {
        // For basic text, we can just return the string. 
        // For actual ESC/POS commands, we would return a Buffer.
        return Buffer.from(content, 'utf-8');
    }
}

module.exports = new PrinterService();
