// import React from "react";
// import ReactDOM from "react-dom/client";
// import "@/index.css";
// import App from "@/App";

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(<App />);
import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "@/index.css";
import App from "@/App";
import AppStartupBoundary from "@/components/AppStartupBoundary";
import BootstrapSeo from "@/components/BootstrapSeo";
import { installPublicNavigation, preserveServerPage } from "@/lib/pageBootstrap";

preserveServerPage();
installPublicNavigation();
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <HelmetProvider>
    <BootstrapSeo />
    <AppStartupBoundary><App /></AppStartupBoundary>
  </HelmetProvider>,
);
