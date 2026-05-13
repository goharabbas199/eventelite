import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Dismiss page loader after React's first paint
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const loader = document.getElementById("page-loader");
    if (!loader) return;
    loader.classList.add("dismissing");
    setTimeout(() => { loader.style.display = "none"; }, 650);
  });
});
