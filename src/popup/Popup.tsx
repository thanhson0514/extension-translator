import React, { useEffect, useState } from "react";
import {
  TranslationResult,
  TranslationStatus,
  TranslationService,
} from "../types/translation";

const Popup: React.FC = () => {
  // State để lưu trữ dữ liệu
  const [originalText, setOriginalText] = useState<string>("");
  const [translationResult, setTranslationResult] =
    useState<TranslationResult | null>(null);
  const [status, setStatus] = useState<TranslationStatus>("idle");
  const [error, setError] = useState<string>("");
  const [currentService, setCurrentService] =
    useState<TranslationService>("chatgpt");

  // Hàm để sao chép văn bản vào clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Hiển thị thông báo thành công (tùy chọn)
        alert("Đã sao chép vào clipboard!");
      })
      .catch((err) => {
        console.error("Không thể sao chép: ", err);
      });
  };

  // Hàm mở trang tùy chọn
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  // Hàm chuyển đổi dịch vụ dịch
  const switchTranslationService = (service: TranslationService) => {
    if (service !== currentService) {
      setStatus("loading");
      setCurrentService(service);

      // Gửi yêu cầu chuyển đổi dịch vụ đến background script
      chrome.runtime.sendMessage({
        action: "switchTranslationService",
        service: service,
      });
    }
  };

  // Lấy kết quả dịch từ storage khi component được tải
  useEffect(() => {
    setStatus("loading");

    // Kiểm tra xem có kết quả dịch trong storage không
    chrome.storage.local.get(["translationResult", "originalText"], (data) => {
      if (data.translationResult) {
        const result = data.translationResult as TranslationResult;
        setTranslationResult(result);
        setOriginalText(data.originalText || "");
        setCurrentService(result.sourceService);
        setStatus("success");
      } else {
        setStatus("idle");
      }
    });

    // Lắng nghe tin nhắn từ background
    const messageListener = (message: any) => {
      if (message.action === "translationStarted") {
        setStatus("loading");
        setCurrentService(message.service);
      } else if (message.action === "translationComplete") {
        setTranslationResult(message.result);
        setCurrentService(message.result.sourceService);
        setStatus("success");
      } else if (message.action === "translationError") {
        setError(message.error);
        setStatus("error");
      }
    };

    // Đăng ký lắng nghe tin nhắn
    chrome.runtime.onMessage.addListener(messageListener);

    // Hủy đăng ký khi component unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Render màn hình loading
  if (status === "loading") {
    return (
      <div className="container">
        <div className="header">
          <div className="logo">
            <span className="logo-icon">🔍</span>
            <span className="logo-text">ChatGPT Translator</span>
          </div>
          <button className="settings-button" onClick={openOptions}>
            ⚙️
          </button>
        </div>
        <div className="loader">
          <p>Đang dịch...</p>
        </div>
      </div>
    );
  }

  // Render màn hình lỗi
  if (status === "error") {
    return (
      <div className="container">
        <div className="header">
          <div className="logo">
            <span className="logo-icon">🔍</span>
            <span className="logo-text">ChatGPT Translator</span>
          </div>
          <button className="settings-button" onClick={openOptions}>
            ⚙️
          </button>
        </div>
        <div className="error">
          <p>Có lỗi xảy ra: {error}</p>
        </div>
      </div>
    );
  }

  // Render màn hình trống (chưa có dịch)
  if (status === "idle" || !translationResult) {
    return (
      <div className="container">
        <div className="header">
          <div className="logo">
            <span className="logo-icon">🔍</span>
            <span className="logo-text">ChatGPT Translator</span>
          </div>
          <button className="settings-button" onClick={openOptions}>
            ⚙️
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">Chưa có văn bản nào được dịch</h3>
          <p className="empty-description">
            Hãy chọn văn bản trên trang web và nhấn vào biểu tượng dịch hoặc sử
            dụng menu chuột phải.
          </p>
        </div>
      </div>
    );
  }

  // Render kết quả dịch
  return (
    <div className="container">
      <div className="header">
        <div className="logo">
          <span className="logo-icon">🔍</span>
          <span className="logo-text">AI Translator</span>
        </div>
        <button className="settings-button" onClick={openOptions}>
          ⚙️
        </button>
      </div>

      <div className="service-switcher">
        <button
          className={`service-button ${
            currentService === "chatgpt" ? "active" : ""
          }`}
          onClick={() => switchTranslationService("chatgpt")}
          disabled={(status as TranslationStatus) === "loading"}
        >
          ChatGPT
        </button>
        <button
          className={`service-button ${
            currentService === "google" ? "active" : ""
          }`}
          onClick={() => switchTranslationService("google")}
          disabled={(status as TranslationStatus) === "loading"}
        >
          Google Translate
        </button>
      </div>

      {originalText && (
        <div className="original-text">
          <strong>Văn bản gốc:</strong> {originalText}
        </div>
      )}

      <div className="translation-container">
        <div className="translation-source">
          {translationResult.sourceService === "chatgpt"
            ? "Dịch bởi ChatGPT"
            : "Dịch bởi Google Translate"}
        </div>

        <div className="translation-title">Bản dịch chính</div>
        <div className="translation-content">
          {translationResult.mainTranslation}
          <button
            className="copy-button"
            style={{ float: "right", marginLeft: "8px" }}
            onClick={() => copyToClipboard(translationResult.mainTranslation)}
          >
            Sao chép
          </button>
        </div>

        {/* Chỉ hiển thị các nghĩa khác khi sử dụng ChatGPT và có dữ liệu */}
        {translationResult.sourceService === "chatgpt" &&
          Object.keys(translationResult.alternativeMeanings).length > 0 && (
            <div className="alternative-meanings">
              <div className="translation-title">Các nghĩa khác</div>

              {translationResult.alternativeMeanings.asNoun &&
                translationResult.alternativeMeanings.asNoun.length > 0 && (
                  <>
                    <div className="meaning-type">Như danh từ:</div>
                    <ul className="meaning-list">
                      {translationResult.alternativeMeanings.asNoun.map(
                        (meaning, index) => (
                          <li key={`noun-${index}`} className="meaning-item">
                            {meaning}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}

              {translationResult.alternativeMeanings.asVerb &&
                translationResult.alternativeMeanings.asVerb.length > 0 && (
                  <>
                    <div className="meaning-type">Như động từ:</div>
                    <ul className="meaning-list">
                      {translationResult.alternativeMeanings.asVerb.map(
                        (meaning, index) => (
                          <li key={`verb-${index}`} className="meaning-item">
                            {meaning}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}

              {translationResult.alternativeMeanings.asAdjective &&
                translationResult.alternativeMeanings.asAdjective.length >
                  0 && (
                  <>
                    <div className="meaning-type">Như tính từ:</div>
                    <ul className="meaning-list">
                      {translationResult.alternativeMeanings.asAdjective.map(
                        (meaning, index) => (
                          <li key={`adj-${index}`} className="meaning-item">
                            {meaning}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}

              {translationResult.alternativeMeanings.inContext &&
                translationResult.alternativeMeanings.inContext.length > 0 && (
                  <div className="context-meaning">
                    <div className="meaning-type">Nghĩa trong ngữ cảnh:</div>
                    <div>
                      {translationResult.alternativeMeanings.inContext[0]}
                    </div>
                  </div>
                )}
            </div>
          )}
      </div>

      <div className="footer">
        <div className="powered-by">
          {translationResult.sourceService === "chatgpt"
            ? "Powered by ChatGPT"
            : "Powered by Google Translate"}
        </div>
      </div>
    </div>
  );
};

export default Popup;
