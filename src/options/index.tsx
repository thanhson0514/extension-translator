import React from "react";
import { createRoot } from "react-dom/client";
import Options from "./Options";
import "./options.css";

// Render component vào element root
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}
