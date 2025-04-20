// Định nghĩa kiểu dữ liệu cho kết quả dịch
export interface TranslationResult {
  mainTranslation: string;
  alternativeMeanings: {
    asNoun?: string[];
    asVerb?: string[];
    asAdjective?: string[];
    inContext?: string[];
  };
  sourceService: "chatgpt" | "google";
}

// Định nghĩa kiểu dữ liệu cho kết quả dịch từ Google
export interface GoogleTranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
}

// Định nghĩa kiểu dữ liệu cho trạng thái dịch
export type TranslationStatus = "idle" | "loading" | "success" | "error";

// Định nghĩa kiểu dữ liệu cho thông báo lỗi
export interface TranslationError {
  message: string;
}

// Định nghĩa kiểu dịch vụ dịch
export type TranslationService = "chatgpt" | "google";

// Định nghĩa kiểu dữ liệu cho cấu hình
export interface ApiConfig {
  defaultTargetLanguage: string;
  defaultTranslationService: TranslationService;
}
