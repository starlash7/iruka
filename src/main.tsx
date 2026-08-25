import React from "react";
import ReactDOM from "react-dom/client";
import { HomeEntry } from "./HomeEntry";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Iruka root element is missing");
}

if (import.meta.env.PROD) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <HomeEntry canEnter={false} onEnter={() => undefined} />
    </React.StrictMode>
  );
} else {
  void import("./app-main").then(({ renderApplication }) => {
    renderApplication(root);
  });
}
