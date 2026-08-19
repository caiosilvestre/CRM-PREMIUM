// Abstraction over the financial system (Conta Azul). Simulated in the MVP:
// closing a contract writes a finance_sync_log row with status
// "pendente_integracao" instead of calling a real API.

export interface FinanceEntry {
  contractId: string;
  leadNome: string;
  valorTotal: number;
  fechadoEm: string; // ISO timestamp
}

export interface FinanceSyncProvider {
  /** Pushes a closed contract to the external financial system. */
  syncContract(entry: FinanceEntry): Promise<{ status: "sincronizado" | "erro" | "pendente_integracao"; payload: unknown }>;
}
