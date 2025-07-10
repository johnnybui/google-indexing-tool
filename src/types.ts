export interface IndexingResult {
  url: string;
  success: boolean;
  response?: any;
  error?: string;
}

export interface IndexingRequest {
  urls: string[];
}

export interface IndexingResponse {
  results: IndexingResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface GoogleIndexingApiResponse {
  urlNotificationMetadata?: {
    url: string;
    latestUpdate?: {
      url: string;
      type: string;
      notifyTime: string;
    };
  };
}

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}
