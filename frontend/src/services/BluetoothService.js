/**
 * BluetoothService.js
 * Handles Web Bluetooth communication with ESC/POS Thermal Printers.
 */

class BluetoothService {
    constructor() {
        this.device = null;
        this.characteristic = null;
    }

    async connect() {
        try {
            console.log("Requesting Bluetooth Device...");
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Generic printer service UUID
                    { namePrefix: 'BT-PRINTER' },
                    { namePrefix: 'Thermal' }
                ],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });

            console.log("Connecting to GATT Server...");
            const server = await this.device.gatt.connect();

            console.log("Getting Service...");
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');

            console.log("Getting Characteristic...");
            const characteristics = await service.getCharacteristics();
            // Usually the first characteristic is the write one for these printers
            this.characteristic = characteristics[0];

            console.log("Connected to Printer!");
            return true;
        } catch (error) {
            console.error("Bluetooth Connection Error:", error);
            return false;
        }
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
            console.log("Disconnected from Printer.");
        }
    }

    async print(data) {
        if (!this.characteristic) {
            throw new Error("Printer not connected. Please connect first.");
        }

        const encoder = new TextEncoder();
        const bytes = encoder.encode(data + '\n\n\n'); // Add some padding for the tear-off
        await this.characteristic.writeValue(bytes);
    }

    // Helper to format a receipt for HMS Arena
    generateOutpassReceipt(residentName, rollNo, type, outDate, inDate, passId) {
        const divider = "--------------------------------\n";
        return [
            "\x1B\x61\x01", // Center align
            "\x1B\x21\x30", // Double height/width
            "HMS ARENA\n",
            "\x1B\x21\x00", // Normal font
            "HOSTEL MANAGEMENT SYSTEM\n",
            divider,
            "\x1B\x61\x00", // Left align
            `PASS TYPE: ${type}\n`,
            `RESIDENT : ${residentName}\n`,
            `ROLL NO  : ${rollNo}\n`,
            `OUT DATE : ${outDate}\n`,
            `IN DATE  : ${inDate}\n`,
            divider,
            "\x1B\x61\x01", // Center
            `ID: ${passId}\n`,
            "VERIFIED BY WARDEN\n",
            "\n\n\x1B\x69" // Cut paper command (if supported)
        ].join('');
    }

    generateTokenReceipt(residentName, rollNo, foodName, session, tokenId) {
        const divider = "--------------------------------\n";
        return [
            "\x1B\x61\x01", // Center align
            "\x1B\x21\x30", // Double height/width
            "HMS MESS TOKEN\n",
            "\x1B\x21\x00", // Normal font
            divider,
            `FOOD: ${foodName}\n`,
            `SESSION: ${session}\n`,
            divider,
            "\x1B\x61\x00", // Left align
            `STUDENT : ${residentName}\n`,
            `ROLL NO : ${rollNo}\n`,
            divider,
            "\x1B\x61\x01", // Center
            `TOKEN ID: ${tokenId}\n`,
            "ENJOY YOUR MEAL!\n",
            "\n\n\x1B\x69"
        ].join('');
    }
}

export default new BluetoothService();
