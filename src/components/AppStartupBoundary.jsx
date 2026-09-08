import { Component } from "react";

export default class AppStartupBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    // Keep the server document and its links available if a JS chunk fails.
    if (document.querySelector("[data-seo-prerender]")) return null;
    return <p role="alert">Не удалось открыть интерфейс. Попробуйте обновить страницу.</p>;
  }
}
