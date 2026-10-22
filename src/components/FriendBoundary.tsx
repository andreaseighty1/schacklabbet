import { Component, type ReactNode } from "react";

/** A stale deployment or failed download must leave navigation and saved games usable. */
export class FriendBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="notice warning" role="alert">
        <div>
          <h2>Kompispartier kunde inte öppnas</h2>
          <p>Kontrollera nätverket och ladda om sidan för att försöka igen.</p>
        </div>
        <button className="button outline" onClick={() => location.reload()}>
          Ladda om sidan
        </button>
      </section>
    );
  }
}
