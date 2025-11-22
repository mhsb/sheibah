export enum ProcessingStatus {
  IDLE = 'IDLE',
  READING = 'READING',
  OPTIMIZING = 'OPTIMIZING', // Gemini Step
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ProcessedFile {
  originalName: string;
  content: string;
  mobileDocxBlob?: Blob;
}

export interface DocSettings {
  pageSize: 'mobile' | 'tablet';
  fontSize: number;
  margin: number;
}