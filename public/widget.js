"use strict";
var WhodunitWidget = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    WhodunitForm: () => WhodunitForm
  });

  // src/whodunit-form.ts
  var WhodunitForm = class extends HTMLElement {
    static get observedAttributes() {
      return ["endpoint", "max-length", "placeholder", "button-text"];
    }
    shadow;
    state = "idle";
    errorMessage = "";
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback() {
      if (this.shadow.childNodes.length > 0) {
        this.render();
      }
    }
    get endpoint() {
      return this.getAttribute("endpoint") || "/ping";
    }
    get maxLength() {
      return parseInt(this.getAttribute("max-length") || "500", 10);
    }
    get placeholder() {
      return this.getAttribute("placeholder") || "Say something anonymous...";
    }
    get buttonText() {
      return this.getAttribute("button-text") || "Send Ping";
    }
    setState(state, errorMsg = "") {
      this.state = state;
      this.errorMessage = errorMsg;
      this.render();
    }
    async handleSubmit(e) {
      e.preventDefault();
      const form = this.shadow.querySelector("form");
      if (!form) return;
      const textarea = form.querySelector("textarea");
      const hpInput = form.querySelector('input[name="hp"]');
      const message = textarea?.value.trim() || "";
      const hp = hpInput?.value || "";
      if (!message) {
        this.setState("error", "Please write a message before sending.");
        return;
      }
      this.setState("sending");
      try {
        const res = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, hp })
        });
        if (res.status === 204 || res.ok) {
          this.setState("sent");
        } else {
          const data = await res.json().catch(() => ({}));
          let msg = "Could not deliver your ping.";
          if (res.status === 429) {
            msg = "You are sending too quickly. Please try again later.";
          } else if (res.status === 503) {
            msg = "Inbox is currently closed.";
          } else if (data.error === "invalid_message") {
            msg = "Invalid message content.";
          }
          this.setState("error", msg);
        }
      } catch {
        this.setState("error", "Network connection failed. Please try again.");
      }
    }
    render() {
      const isSending = this.state === "sending";
      this.shadow.innerHTML = `
      <style>
        :host {
          --whodunit-bg: var(--bg-surface, #ffffff);
          --whodunit-text: var(--text-main, #0f172a);
          --whodunit-muted: var(--text-muted, #64748b);
          --whodunit-border: var(--border-color, #e2e8f0);
          --whodunit-focus: var(--focus-ring, #6366f1);
          --whodunit-btn-bg: var(--primary-bg, #0f172a);
          --whodunit-btn-text: var(--primary-text, #ffffff);
          --whodunit-btn-hover: var(--primary-hover, #1e293b);
          --whodunit-success: #10b981;
          --whodunit-error: #ef4444;
          --whodunit-radius: 12px;
          --whodunit-font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

          display: block;
          font-family: var(--whodunit-font);
          color: var(--whodunit-text);
        }

        .container {
          background: var(--whodunit-bg);
          border: 1px solid var(--whodunit-border);
          border-radius: var(--whodunit-radius);
          padding: 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
          position: relative;
        }

        .label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: var(--whodunit-text);
        }

        textarea {
          width: 100%;
          min-height: 110px;
          box-sizing: border-box;
          background: transparent;
          color: inherit;
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.5;
          padding: 0.75rem;
          border: 1px solid var(--whodunit-border);
          border-radius: 8px;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        textarea:focus {
          border-color: var(--whodunit-focus);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.75rem;
        }

        .char-counter {
          font-size: 0.775rem;
          color: var(--whodunit-muted);
        }

        .hp-field {
          position: absolute;
          left: -9999px;
          opacity: 0;
          pointer-events: none;
        }

        button {
          background: var(--whodunit-btn-bg);
          color: var(--whodunit-btn-text);
          border: none;
          border-radius: 8px;
          padding: 0.55rem 1.1rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.15s, transform 0.05s;
        }

        button:hover:not(:disabled) {
          background: var(--whodunit-btn-hover);
        }

        button:active:not(:disabled) {
          transform: scale(0.98);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .state-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.5rem 0.5rem;
        }

        .state-banner.sent {
          color: var(--whodunit-success);
        }

        .state-banner.error {
          color: var(--whodunit-error);
        }

        .banner-icon {
          font-size: 2.25rem;
          margin-bottom: 0.5rem;
        }

        .banner-title {
          font-weight: 600;
          font-size: 1.05rem;
          margin: 0 0 0.25rem 0;
        }

        .banner-sub {
          font-size: 0.85rem;
          color: var(--whodunit-muted);
          margin-bottom: 1rem;
        }

        .reset-btn {
          background: transparent;
          border: 1px solid var(--whodunit-border);
          color: var(--whodunit-text);
        }
        .reset-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .privacy-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.725rem;
          color: var(--whodunit-muted);
          margin-top: 0.75rem;
          opacity: 0.85;
        }
      </style>

      <div class="container" role="region" aria-label="Anonymous ping form">
        ${this.state === "sent" ? `
          <div class="state-banner sent" role="status" aria-live="polite">
            <div class="banner-icon">\u2713</div>
            <h4 class="banner-title">Ping Dispatched!</h4>
            <p class="banner-sub">Nobody knows who sent it. Your note is on its way.</p>
            <button type="button" class="reset-btn" id="send-another-btn">Send Another</button>
          </div>
        ` : this.state === "error" ? `
          <div class="state-banner error" role="alert" aria-live="assertive">
            <div class="banner-icon">\u26A0</div>
            <h4 class="banner-title">Delivery Failed</h4>
            <p class="banner-sub">${this.errorMessage}</p>
            <button type="button" class="reset-btn" id="retry-btn">Try Again</button>
          </div>
        ` : `
          <form id="whodunit-form">
            <label class="label" for="message-input">Leave an anonymous message</label>
            <textarea
              id="message-input"
              name="message"
              placeholder="${this.placeholder}"
              maxlength="${this.maxLength}"
              ${isSending ? "disabled" : ""}
              required
            ></textarea>

            <!-- Honeypot anti-bot trap -->
            <input type="text" name="hp" class="hp-field" tabindex="-1" autocomplete="off" />

            <div class="meta-row">
              <span class="char-counter" id="char-counter">${this.maxLength} characters left</span>
              <button type="submit" ${isSending ? "disabled" : ""}>
                ${isSending ? "Sending..." : this.buttonText}
              </button>
            </div>

            <div class="privacy-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>100% anonymous & private. Zero IP logging.</span>
            </div>
          </form>
        `}
      </div>
    `;
      const form = this.shadow.querySelector("form");
      if (form) {
        form.addEventListener("submit", (e) => this.handleSubmit(e));
        const textarea = form.querySelector("textarea");
        const counter = form.querySelector("#char-counter");
        if (textarea && counter) {
          textarea.addEventListener("input", () => {
            const remaining = this.maxLength - textarea.value.length;
            counter.textContent = `${remaining} characters left`;
          });
        }
      }
      const sendAnotherBtn = this.shadow.querySelector("#send-another-btn");
      if (sendAnotherBtn) {
        sendAnotherBtn.addEventListener("click", () => this.setState("idle"));
      }
      const retryBtn = this.shadow.querySelector("#retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => this.setState("idle"));
      }
    }
  };
  if (typeof window !== "undefined" && !customElements.get("whodunit-form")) {
    customElements.define("whodunit-form", WhodunitForm);
  }
  return __toCommonJS(index_exports);
})();
