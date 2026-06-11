import { defineStore } from 'pinia';
import axios from 'axios';

export const useAttendanceStore = defineStore('attendance', {
    state: () => ({
        attendanceRecords: [],
        loading: false,
        scanStatus: "idle",
        lastScanData: null,
        scanError: null,
        isProcessing: false,
        lastScan: null,
        sessionLogs: []
    }),
    actions: {
        async fetchLogs(sessionId) {
            this.loading = true;
            try {
                const response = await axios.get(`/sessions/${sessionId}/attendance`);
                this.attendanceRecords = response.data;
            } catch (error) {
                console.error("Failed to fetch attendance logs:", error);
            } finally {
                this.loading = false;
            }
        },
        async submitScan(qrCodeString) {
            this.isProcessing = true;
            this.lastScan = null;
            
            try {
                const response = await api.post('/attendance/scan', { 
                    session_qr_code: qrCodeString 
                });
                
                this.lastScan = {
                    success: true,
                    status: response.data.status,
                    timestamp: response.data.timestamp,
                    message: response.data.message || 'Scan successful!'
                };
                
                return this.lastScan;
            } catch (error) {
                this.lastScan = {
                    success: false,
                    message: error.response?.data?.message || 'Invalid or expired QR code.'
                };
                throw this.lastScan;
            } finally {
                this.isProcessing = false;
            }
        }
    }
});