export interface TTSSynthesisRequest {
  text: string;
  voiceName?: string;
  speed?: string;
  volume?: string;
  format?: 'mp3' | 'wav';
}

export interface TTSSynthesisResponse {
  audioData: string;
  format: 'mp3' | 'wav';
  provider: string;
}

export interface ITTSProvider {
  synthesize(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse>;
  isReady(): boolean;
  updateConfig?(config: unknown): void;
}
