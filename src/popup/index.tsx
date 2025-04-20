import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "./Popup";
import "./popup.css";

// Render component vào element root
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
