import { defineStore } from 'pinia';
import axios from 'axios';

export const useAttendanceStore = defineStore('attendance', {
    state: () => ({
        attendanceRecords: [],
        loading: false,
        scanStatus: "idle",
        lastScanData: null,
        scanError: null
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
        async scanQrCode(encryptedData) {
            this.scanStatus = "scanning";
            this.scanError = null;
            try {
                const response = await axios.post(`${API_URL}/attendance/scan`, {
                    session_qr_code: encryptedPayload,
                    student_id: 1
                }, {
                    headers: {
                        'Authorization': 'Bearer 1|ZhOgRhryvO7FNOgq6r7gbDKlkrvDBEsr0Xv12TqI1f7ba1af',
                        'Content-Type': 'application/json'
                    }
                });

                this.lastScanData = response.data.data;
                this.scanStatus = 'success';

            }
            catch (error) {
                this.scanError = error.response?.data?.message || "Failed to scan QR code.";
                this.scanStatus = "error";
            }
        }
    }
});