import React from "react";
import ReactDOM from "react-dom/client";
import { BrandKitView } from "./BrandKitView";
import "./brand-kit.css";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Iruka root element is missing");
}

if (window.location.hash === "#brand-kit") {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrandKitView />
    </React.StrictMode>
  );
} else {
  void import("./app-main").then(({ renderApplication }) => {
    renderApplication(root);
  });
}
