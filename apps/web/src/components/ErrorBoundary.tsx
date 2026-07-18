import { Component, type ErrorInfo, type ReactNode } from "react";
import { translateCurrent } from "../i18n";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }
  render() {
    if (this.state.error)
      return (
        <div className="center-card">
          <h1>{translateCurrent("error.title")}</h1>
          <p>{this.state.error.message}</p>
          <a className="button" href="/">
            {translateCurrent("error.back")}
          </a>
        </div>
      );
    return this.props.children;
  }
}
