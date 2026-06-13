import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useAttendanceStore = defineStore('attendance', () => {
    const loading = ref(false);
    const lastScanResult = ref(null);
    const sessionLogs = ref([]);
    const scanState = ref('scanning');

    function resetScan() {
        scanState.value = 'scanning';
        lastScanResult.value = null;
        loading.value = false;
    }

    async function submitScan(qrCodeString) {
        if (loading.value) return;
        loading.value = true;
        
        try {
            const response = await api.post('/attendance/scan', {
                session_qr_code: qrCodeString
            });
            
            const responseData = response.data?.data || response.data;
            lastScanResult.value = responseData;
            
            const status = responseData?.status;
            if (status === 'arrived') {
                scanState.value = 'checked-in';
            } else if (status === 'left') {
                scanState.value = 'checked-out';
            } else if (status === 'completed') {
                scanState.value = 'duplicate';
            } else {
                scanState.value = 'checked-in';
            }
        } catch (error) {
            const response = error.response;
            const status = response?.status;
            const backendMsg = response?.data?.message || '';
            
            lastScanResult.value = {
                message: backendMsg || 'Scan processing failed.'
            };

            if (status === 409 || /already|completed/i.test(backendMsg)) {
                scanState.value = 'duplicate';
            } else if (status === 410 || /expired/i.test(backendMsg)) {
                scanState.value = 'expired';
            } else if (status === 403 || /active today|wrong day/i.test(backendMsg)) {
                scanState.value = 'wrong-day';
            } else if (status === 422 || status === 400 || status === 404 || /invalid/i.test(backendMsg)) {
                scanState.value = 'invalid';
            } else {
                scanState.value = 'error';
            }
        } finally {
            loading.value = false;
        }
    }

    return {
        loading,
        lastScanResult,
        sessionLogs,
        scanState,
        resetScan,
        submitScan
    };
});