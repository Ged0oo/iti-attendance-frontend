import { defineStore } from 'pinia';
import api from '../services/api';

export const useAttendanceStore = defineStore('attendance', {
    state: () => ({
        activeSession: null,
        scanStatus: 'idle', // 'idle', 'scanning', 'success', 'error'
        scanMessage: '',
    }),
    actions: {
        async scanQr(qrPayload) {
            this.scanStatus = 'scanning';
            try {
                const response = await api.post('/api/attendance/scan', {
                    session_qr_code: qrPayload
                });
                this.scanStatus = 'success';
                this.scanMessage = response.data.message;
            } catch (error) {
                this.scanStatus = 'error';
                this.scanMessage = error.response?.data?.message || 'Scan failed';
            }
        },
        async scanNfc(serialNumber, sessionId) {
            try {
                const response = await api.post('/api/nfc/scan', {
                    serial_number: serialNumber,
                    session_id: sessionId
                });
                return response.data;
            } catch (error) {
                throw error.response?.data?.message;
            }
        }
    }
});