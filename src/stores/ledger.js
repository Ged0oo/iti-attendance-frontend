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
                const userId = authStore.user?.id; 
                if (!userId) throw new Error("No user ID found.");

                const response = await api.get(`/students/${userId}/ledger`);
                
                const ledgerData = response.data.data;
                this.balance = ledgerData.balance;
                
                this.history = ledgerData.entries || [];
            } catch (error) {
                console.error("Failed to fetch live ledger data:", error);
            } finally {
                this.loading = false;
            }
        }
    }
});