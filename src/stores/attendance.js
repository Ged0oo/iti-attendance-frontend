import { defineStore } from 'pinia';
import api from '@/services/api';

export const useAttendanceStore = defineStore('attendance', {
    state: () => ({
        isProcessing: false,
        lastScan: null,
        sessionLogs: []
    }),
    actions: {
        async submitScan(qrCodeString) {
            this.isProcessing = true;
            this.lastScan = null;
            
            try {
                const response = await api.post('/attendance/scan', { 
                    session_qr_code: qrCodeString 
                });
                
                const responseData = response.data.data || response.data;
                
                // Force the message to be a string
                let displayMessage = 'Scan successful!';
                if (typeof responseData.message === 'string') {
                    displayMessage = responseData.message;
                }
                
                this.lastScan = {
                    success: true,
                    status: responseData.status,
                    timestamp: responseData.timestamp,
                    message: displayMessage
                };
                
                return this.lastScan;
            } catch (error) {
                // Safely extract error messages even if Laravel returns an object
                let errorMsg = 'Invalid or expired QR code.';
                const backendMessage = error.response?.data?.message;
                
                if (typeof backendMessage === 'string') {
                    errorMsg = backendMessage;
                } else if (typeof backendMessage === 'object') {
                    // If it's a validation object, stringify it so we can read it
                    errorMsg = JSON.stringify(backendMessage); 
                }

                this.lastScan = {
                    success: false,
                    message: errorMsg
                };
                throw this.lastScan;
            } finally {
                this.isProcessing = false;
            }
        }
    }
});