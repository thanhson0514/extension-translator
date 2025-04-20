// Định nghĩa kiểu dữ liệu cho position của văn bản được chọn
interface SelectionPosition {
  top: number;
  left: number;
}

// Khai báo biến toàn cục
let translationIcon: HTMLElement | null = null;
let isIconVisible = false;
let lastSelectedText = "";

// Hàm tạo icon dịch
function createTranslationIcon(): HTMLElement {
  // Tạo một element mới
  const icon = document.createElement("div");

  // Thiết lập style cho icon
  icon.style.position = "absolute";
  icon.style.width = "32px";
  icon.style.height = "32px";
  icon.style.borderRadius = "50%";
  icon.style.backgroundColor = "#4285f4";
  icon.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
  icon.style.cursor = "pointer";
  icon.style.zIndex = "9999";
  icon.style.display = "flex";
  icon.style.justifyContent = "center";
  icon.style.alignItems = "center";

  // Thêm biểu tượng (dùng emoji hoặc có thể thay bằng SVG)
  icon.innerHTML = '<span style="color: white; font-size: 16px;">🔍</span>';

  // Thêm sự kiện khi người dùng nhấp vào icon
  icon.addEventListener("click", handleIconClick);

  // Thêm vào body
  document.body.appendChild(icon);

  return icon;
}

// Hàm xác định vị trí để hiển thị icon
function getSelectionPosition(): SelectionPosition | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Vị trí icon sẽ ở góc trên bên phải của vùng được chọn
  return {
    top: rect.top + window.scrollY - 40, // Đặt icon cao hơn một chút so với vùng chọn
    left: rect.right + window.scrollX + 5, // Đặt icon bên phải vùng chọn
  };
}

// Hàm hiển thị icon tại vị trí của văn bản được chọn
function showTranslationIcon(): void {
  // Lấy văn bản được chọn
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim() || "";

  // Chỉ hiển thị icon nếu có văn bản được chọn
  if (selectedText && selectedText.length > 0) {
    lastSelectedText = selectedText;

    // Lấy vị trí để hiển thị icon
    const position = getSelectionPosition();

    if (position) {
      // Tạo icon nếu chưa có
      if (!translationIcon) {
        translationIcon = createTranslationIcon();
      }

      // Cập nhật vị trí của icon
      translationIcon.style.top = `${position.top}px`;
      translationIcon.style.left = `${position.left}px`;
      translationIcon.style.display = "flex";

      isIconVisible = true;
    }
  } else {
    hideTranslationIcon();
  }
}

// Hàm ẩn icon
function hideTranslationIcon(): void {
  if (translationIcon && isIconVisible) {
    translationIcon.style.display = "none";
    isIconVisible = false;
  }
}

// Xử lý khi người dùng nhấp vào icon
function handleIconClick(): void {
  if (lastSelectedText) {
    // Gửi thông báo đến background script để xử lý dịch
    chrome.runtime.sendMessage({
      action: "translate",
      text: lastSelectedText,
    });
  }

  // Ẩn icon sau khi click
  hideTranslationIcon();
}

// Bắt sự kiện khi người dùng chọn văn bản
document.addEventListener("mouseup", (event) => {
  // Đợi một chút để đảm bảo selection đã hoàn tất
  setTimeout(() => {
    showTranslationIcon();
  }, 200);
});

// Bắt sự kiện khi người dùng click vào nơi khác trên trang
document.addEventListener("mousedown", (event) => {
  // Kiểm tra xem click có phải vào icon không
  const target = event.target as Node;
  if (translationIcon && !translationIcon.contains(target)) {
    hideTranslationIcon();
  }
});

// Bắt sự kiện khi scroll để cập nhật vị trí icon nếu cần
document.addEventListener("scroll", () => {
  if (isIconVisible) {
    const position = getSelectionPosition();
    if (position && translationIcon) {
      translationIcon.style.top = `${position.top}px`;
      translationIcon.style.left = `${position.left}px`;
    }
  }
});

// Xử lý tin nhắn từ background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showTranslation") {
    // Tại đây có thể hiển thị kết quả trực tiếp trên trang nếu muốn
    // Nhưng chúng ta sẽ để việc hiển thị kết quả cho popup
    console.log("Received translation result:", request.result);
  }
});
