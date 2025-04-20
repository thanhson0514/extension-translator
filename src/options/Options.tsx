import React, { useEffect, useState } from "react";
import { ApiConfig, TranslationService } from "../types/translation";

const Options: React.FC = () => {
  // State cho cấu hình
  const [config, setConfig] = useState<ApiConfig>({
    defaultTargetLanguage: "vi",
    defaultTranslationService: "google" as TranslationService,
  });

  // State cho thông báo
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Lấy cấu hình đã lưu khi component được tải
  useEffect(() => {
    chrome.storage.sync.get(
      {
        defaultTargetLanguage: "vi",
        defaultTranslationService: "google",
      },
      (items) => {
        setConfig(items as ApiConfig);
      }
    );
  }, []);

  // Xử lý khi thay đổi input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý khi lưu cấu hình
  const handleSave = () => {
    chrome.storage.sync.set(config, () => {
      // Kiểm tra xem có lỗi trong Chrome khi lưu không
      if (chrome.runtime.lastError) {
        setNotification({
          type: "error",
          message: `Lỗi: ${chrome.runtime.lastError.message}`,
        });
      } else {
        setNotification({
          type: "success",
          message: "Đã lưu cấu hình thành công!",
        });

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }
    });
  };

  return (
    <div className="container">
      <div className="header">
        <div className="logo">
          <span className="logo-icon">🔍</span>
          <span className="logo-text">AI Translator - Tùy chọn</span>
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="section">
        <h2 className="section-title">Thông tin</h2>
        <p className="info-text">
          Extension này sử dụng các dịch vụ dịch miễn phí không cần API key.
          Chức năng này có thể không ổn định trong dài hạn nếu các dịch vụ thay
          đổi.
        </p>
        <p className="info-text">
          - <strong>Google Translate</strong>: Dịch nhanh, đơn giản
        </p>
        <p className="info-text">
          - <strong>Advanced Translation</strong>: Cố gắng cung cấp nhiều nghĩa
          và phân tích ngữ cảnh
        </p>
      </div>

      <div className="section">
        <h2 className="section-title">Tùy chọn dịch</h2>

        <div className="form-group">
          <label htmlFor="defaultTranslationService" className="form-label">
            Dịch vụ dịch mặc định
          </label>
          <select
            id="defaultTranslationService"
            name="defaultTranslationService"
            className="form-select"
            value={config.defaultTranslationService}
            onChange={handleChange}
          >
            <option value="chatgpt">Advanced Translation (nhiều nghĩa)</option>
            <option value="google">Google Translate (nhanh hơn)</option>
          </select>
          <p className="form-description">
            Chọn dịch vụ dịch mặc định khi sử dụng extension.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="defaultTargetLanguage" className="form-label">
            Ngôn ngữ dịch mặc định
          </label>
          <select
            id="defaultTargetLanguage"
            name="defaultTargetLanguage"
            className="form-select"
            value={config.defaultTargetLanguage}
            onChange={handleChange}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">Tiếng Anh</option>
            <option value="zh-CN">Tiếng Trung (Giản thể)</option>
            <option value="zh-TW">Tiếng Trung (Phồn thể)</option>
            <option value="ja">Tiếng Nhật</option>
            <option value="ko">Tiếng Hàn</option>
            <option value="fr">Tiếng Pháp</option>
            <option value="de">Tiếng Đức</option>
            <option value="ru">Tiếng Nga</option>
            <option value="es">Tiếng Tây Ban Nha</option>
            <option value="pt">Tiếng Bồ Đào Nha</option>
            <option value="it">Tiếng Ý</option>
            <option value="nl">Tiếng Hà Lan</option>
            <option value="ar">Tiếng Ả Rập</option>
            <option value="hi">Tiếng Hindi</option>
            <option value="th">Tiếng Thái</option>
          </select>
        </div>
      </div>

      <div className="button-row">
        <button className="save-button" onClick={handleSave}>
          Lưu cấu hình
        </button>
      </div>

      <div className="footer">
        <p>AI Translator Extension - v1.1.0</p>
        <p className="disclaimer">
          Lưu ý: Extension này chỉ dành cho mục đích giáo dục và cá nhân.
        </p>
      </div>
    </div>
  );
};

export default Options;
