// Abstraction over an e-signature provider (Autentique, Clicksign, D4Sign...).
// Not implemented in the MVP — contracts are marked as signed manually — but
// the interface is defined now so a real provider can be plugged in later by
// implementing it and wiring its webhook to update contracts.status_assinatura.

export interface ESignatureRequest {
  contractId: string;
  documentUrl: string;
  signerName: string;
  signerEmail: string;
}

export interface ESignatureProvider {
  /** Sends a document out for signature; returns the provider's tracking id. */
  requestSignature(request: ESignatureRequest): Promise<{ externalId: string }>;

  /** Parses a provider webhook payload into a normalized signature status update. */
  parseWebhookPayload(payload: unknown): { externalId: string; signed: boolean } | null;
}
