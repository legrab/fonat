import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "katex/dist/katex.min.css";
import "mafs/core.css";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import "./styles.css";
import { App } from "./App";
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 2_000 } },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme
      appearance="inherit"
      accentColor="blue"
      grayColor="mauve"
      radius="large"
    >
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>,
);
