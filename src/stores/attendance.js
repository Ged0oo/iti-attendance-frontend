import { defineStore } from 'pinia';
import api from '@/services/api';

export const useAttendanceStore = defineStore('attendance', {
    state: () => ({
        scanState: 'scanning',
        loading: false,
        lastScanResult: null,
        isProcessing: false,
        lastScan: null,
        sessionLogs: []
    }),
    actions: {
        resetScan() {
            this.scanState = 'scanning';
            this.loading = false;
            this.lastScanResult = null;
            this.isProcessing = false;
            this.lastScan = null;
        },
        async submitScan(qrCodeString, studentId) {
            this.loading = true;
            this.isProcessing = true;
            this.lastScanResult = null;
            this.lastScan = null;
            
            try {
                const response = await api.post('/attendance/scan', { 
                    session_qr_code: qrCodeString,
                    student_id: studentId
                });
                
                const responseData = response.data.data || response.data;
                
                // Force the message to be a string
                let displayMessage = 'Scan successful!';
                if (typeof responseData.message === 'string') {
                    displayMessage = responseData.message;
                }
                
                // Map backend status to scanState
                // Backend returns status: 'arrived' or 'left' or 'completed'
                let nextScanState = 'checked-in';
                if (responseData.status === 'left') {
                    nextScanState = 'checked-out';
                } else if (responseData.status === 'completed') {
                    nextScanState = 'duplicate';
                }
                
                this.scanState = nextScanState;
                this.lastScanResult = {
                    success: true,
                    status: responseData.status,
                    timestamp: responseData.timestamp,
                    message: displayMessage,
                    session: responseData.session || null
                };
                
                this.lastScan = this.lastScanResult; // For backward compatibility
                return this.lastScanResult;
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

                // Determine appropriate scanState based on error message/status
                let nextScanState = 'error';
                const status = error.response?.status;
                const msgLower = errorMsg.toLowerCase();
                
                if (status === 400 && msgLower.includes('expired')) {
                    nextScanState = 'expired';
                } else if (status === 400 && msgLower.includes('invalid')) {
                    nextScanState = 'invalid';
                } else if (status === 403 || msgLower.includes('active today') || msgLower.includes('wrong day')) {
                    nextScanState = 'wrong-day';
                } else if (status === 422) {
                    if (msgLower.includes('closed') || msgLower.includes('expired')) {
                        nextScanState = 'expired';
                    } else {
                        nextScanState = 'invalid';
                    }
                } else if (msgLower.includes('invalid')) {
                    nextScanState = 'invalid';
                }
                
                this.scanState = nextScanState;
                this.lastScanResult = {
                    success: false,
                    message: errorMsg
                };
                this.lastScan = this.lastScanResult; // For backward compatibility
                throw this.lastScanResult;
            } finally {
                this.loading = false;
                this.isProcessing = false;
            }
        }
    }
});