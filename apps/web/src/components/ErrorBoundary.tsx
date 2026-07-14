import { Component, type ErrorInfo, type ReactNode } from "react";
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
          <h1>Az oldal nem tölthető be</h1>
          <p>{this.state.error.message}</p>
          <a className="button" href="/">
            Vissza a Today oldalra
          </a>
        </div>
      );
    return this.props.children;
  }
}
