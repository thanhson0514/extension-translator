// Import các kiểu dữ liệu từ types/translation.ts
import {
  ApiConfig,
  TranslationResult,
  GoogleTranslationResult,
  TranslationService,
} from "../types/translation";

// Khởi tạo menu chuột phải
function setupContextMenu(): void {
  chrome.contextMenus.create({
    id: "translate-selection",
    title: "Dịch văn bản",
    contexts: ["selection"],
  });
}

// Lấy cấu hình từ storage
async function getApiConfig(): Promise<ApiConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        defaultTargetLanguage: "vi",
        defaultTranslationService: "chatgpt",
      },
      (items) => {
        resolve(items as ApiConfig);
      }
    );
  });
}

// Hàm dịch với Google Translate (không cần API key)
async function translateWithGoogle(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  try {
    // Sử dụng dịch vụ translate không chính thức, không cần API key
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    // Gọi API Google Translate không chính thức
    const response = await fetch(url);

    // Xử lý kết quả
    if (!response.ok) {
      throw new Error(
        `Google API request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    // Kết quả dịch nằm trong mảng lồng nhau: data[0][0][0]
    const translatedText = data[0].map((item: any) => item[0]).join("");
    const detectedLanguage = data[2] || "auto";

    // Chuyển đổi kết quả từ Google sang định dạng chung
    const result: TranslationResult = {
      mainTranslation: translatedText,
      alternativeMeanings: {},
      sourceService: "google",
    };

    return result;
  } catch (error) {
    console.error("Error translating with Google:", error);
    return {
      mainTranslation: `Lỗi Google Translate: ${
        error instanceof Error ? error.message : "Không thể dịch"
      }`,
      alternativeMeanings: {},
      sourceService: "google",
    };
  }
}

// Hàm dịch với dịch vụ tương tự ChatGPT (không cần API key)
async function translateWithChatGPT(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  try {
    // Đầu tiên, sử dụng Google Translate để có bản dịch cơ bản
    const googleResult = await translateWithGoogle(text, targetLanguage);
    const translatedText = googleResult.mainTranslation;

    // Sau đó, gửi yêu cầu đến dịch vụ từ điển công khai để lấy các nghĩa khác nhau
    // Sử dụng Free Dictionary API cho tiếng Anh (nếu đích là tiếng Anh)
    // hoặc WordReference API (không chính thức) cho các ngôn ngữ khác
    let alternativeMeanings: any = {};

    // Nếu văn bản nguồn đủ ngắn (một từ hoặc cụm từ ngắn), thử lấy các nghĩa khác
    if (text.split(" ").length <= 3 && targetLanguage === "vi") {
      try {
        // Dùng Free Dictionary API cho từ tiếng Anh
        const dictResponse = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
            text
          )}`
        );

        if (dictResponse.ok) {
          const dictData = await dictResponse.json();

          // Phân loại các nghĩa theo loại từ
          alternativeMeanings = {
            asNoun: [],
            asVerb: [],
            asAdjective: [],
          };

          let asNoun: Promise<any>[] = [];
          let asVerb: Promise<any>[] = [];
          let asAdjective: Promise<any>[] = [];

          if (Array.isArray(dictData) && dictData.length > 0) {
            dictData[0].meanings.forEach((meaning: any) => {
              const partOfSpeech = meaning.partOfSpeech.toLowerCase();
              const definitions = meaning.definitions.map(
                (def: any) => def.definition
              );

              if (partOfSpeech === "noun") {
                asNoun = definitions
                  .slice(0, 3)
                  .map(
                    async (def: any) =>
                      await translateWithGoogle(def, targetLanguage)
                  );
              } else if (partOfSpeech === "verb") {
                asVerb = definitions
                  .slice(0, 3)
                  .map(
                    async (def: any) =>
                      await translateWithGoogle(def, targetLanguage)
                  );
              } else if (partOfSpeech === "adjective") {
                asAdjective = definitions
                  .slice(0, 3)
                  .map(
                    async (def: any) =>
                      await translateWithGoogle(def, targetLanguage)
                  );
              }
            });
          }

          alternativeMeanings.asNoun = (await Promise.all(asNoun))
            .filter((def) => ![".", "", " "].includes(def.mainTranslation))
            .map((def) => def.mainTranslation);
          alternativeMeanings.asVerb = (await Promise.all(asVerb))
            .filter((def) => ![".", "", " "].includes(def.mainTranslation))
            .map((def) => def.mainTranslation);
          alternativeMeanings.asAdjective = (await Promise.all(asAdjective))
            .filter((def) => ![".", "", " "].includes(def.mainTranslation))
            .map((def) => def.mainTranslation);
        }
      } catch (dictError) {
        console.error("Error fetching dictionary data:", dictError);
        // Tiếp tục nếu không lấy được nghĩa từ từ điển
      }
    }

    // Thêm nghĩa trong ngữ cảnh (chỉ là bản dịch có sẵn trong trường hợp này)
    alternativeMeanings.inContext = [translatedText];

    // Tạo kết quả theo định dạng TranslationResult
    const result: TranslationResult = {
      mainTranslation: translatedText,
      alternativeMeanings: alternativeMeanings,
      sourceService: "chatgpt",
    };

    return result;
  } catch (error) {
    console.error("Error translating with ChatGPT alternative:", error);
    return {
      mainTranslation: `Lỗi dịch: ${
        error instanceof Error ? error.message : "Không thể dịch"
      }`,
      alternativeMeanings: {},
      sourceService: "chatgpt",
    };
  }
}

// Xử lý yêu cầu dịch
async function handleTranslateRequest(
  text: string,
  forceService?: TranslationService
): Promise<void> {
  try {
    // Lưu văn bản gốc vào storage
    chrome.storage.local.set({ originalText: text });

    // Lấy cấu hình
    const config = await getApiConfig();

    // Xác định dịch vụ dịch sẽ sử dụng
    const serviceToUse = forceService || config.defaultTranslationService;

    // Thông báo rằng đang bắt đầu dịch
    chrome.runtime.sendMessage({
      action: "translationStarted",
      service: serviceToUse,
    });

    let result: TranslationResult;

    // Dịch với dịch vụ được chọn
    if (serviceToUse === "google") {
      result = await translateWithGoogle(text, config.defaultTargetLanguage);
    } else {
      result = await translateWithChatGPT(text, config.defaultTargetLanguage);
    }

    // Lưu kết quả dịch vào storage để popup có thể truy cập
    chrome.storage.local.set({
      translationResult: result,
      originalText: text,
    });

    // Thông báo cho popup và content script rằng có kết quả mới
    chrome.runtime.sendMessage({
      action: "translationComplete",
      result: result,
    });
  } catch (error) {
    console.error("Error handling translation request:", error);
    chrome.runtime.sendMessage({
      action: "translationError",
      error: error instanceof Error ? error.message : "Lỗi không xác định",
    });
  }
}

// Khởi tạo extension
function init(): void {
  // Thiết lập menu chuột phải
  setupContextMenu();

  // Xử lý sự kiện khi người dùng nhấp vào menu chuột phải
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate-selection" && info.selectionText) {
      handleTranslateRequest(info.selectionText);

      // Mở popup để hiển thị kết quả
      chrome.action.openPopup();
    }
  });

  // Xử lý tin nhắn từ content script và popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
      handleTranslateRequest(request.text, request.service);

      // Mở popup để hiển thị kết quả
      chrome.action.openPopup();
    } else if (request.action === "switchTranslationService") {
      // Lấy văn bản gốc từ storage
      chrome.storage.local.get("originalText", (data) => {
        if (data.originalText) {
          // Dịch lại với dịch vụ mới
          handleTranslateRequest(data.originalText, request.service);
        }
      });
    }
  });
}

// Chạy khởi tạo khi extension được tải
init();
