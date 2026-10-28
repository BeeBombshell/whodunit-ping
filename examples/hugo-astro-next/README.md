# Embedding Whodunit Snippets

Easily drop the `<whodunit-form>` web component into any website or static site generator.

## 1. Vanilla HTML / Static Site

```html
<!-- Load the widget script -->
<script type="module" src="https://unpkg.com/@whodunit/widget/dist/index.js"></script>

<!-- Place the form anywhere -->
<whodunit-form
  endpoint="https://your-whodunit-api.workers.dev/ping"
  placeholder="Leave an anonymous message..."
  button-text="Send Ping"
></whodunit-form>
```

## 2. Astro

In your Astro page or component (e.g., `src/pages/ping.astro`):

```astro
---
---
<script>
  import "@whodunit/widget";
</script>

<div class="ping-container">
  <h2>Ping Me</h2>
  <whodunit-form
    endpoint="https://api.yourdomain.com/ping"
    placeholder="Got feedback, a question, or a secret tip?"
  ></whodunit-form>
</div>
```

## 3. Next.js (App Router / React)

```tsx
"use client";

import { useEffect } from "react";

export default function PingPage() {
  useEffect(() => {
    import("@whodunit/widget");
  }, []);

  return (
    <main style={{ maxWidth: 500, margin: "2rem auto" }}>
      <h1>Anonymous Ping</h1>
      {/* @ts-ignore custom element */}
      <whodunit-form endpoint="/api/ping" />
    </main>
  );
}
```

## 4. Hugo

In your single page layout (e.g. `layouts/ping/single.html`):

```html
{{ define "main" }}
<article class="post">
  <h1>{{ .Title }}</h1>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@whodunit/widget/dist/index.js"></script>
  <whodunit-form endpoint="{{ .Site.Params.whodunitEndpoint }}"></whodunit-form>
</article>
{{ end }}
```
