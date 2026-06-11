import { defineStore } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth';

export const useLedgerStore = defineStore('ledger', {
    state: () => ({
        balance: 0,
        maxBalance: 250,
        threshold: 150,
        history: [],
        loading: false
    }),
    getters: {
        balancePercentage: (state) => {
            return Math.max(0, (state.balance / state.maxBalance) * 100);
        },
        isAtRisk: (state) => {
            return state.balance < state.threshold;
        }
    },
    actions: {
        async fetchLedgerData() {
            this.loading = true;
            try {
                const authStore = useAuthStore();
                const studentId = authStore.user?.student_id;
                if(!studentId) {
                    throw new Error("No student ID found.");
                }

                const balanceResponse = await api.get(`/students/${studentId}/ledger`);
                this.balance = balanceResponse.data.data?.balance || balanceResponse.data.balance;

                const entriesResponse = await api.get(`/students/${studentId}/ledger/entries`);
                this.history = entriesResponse.data.data || [];
            } catch (error) {
                console.error("Failed to fetch live ledger data:", error);
            } finally {
                this.loading = false;
            }
        }
    }
});