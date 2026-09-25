# PQC SDK — Interactive Landing Page

> The marketing and demo site for [**@pqc-sdk/core**](https://www.npmjs.com/package/@pqc-sdk/core) — a post-quantum cryptography SDK for JavaScript and TypeScript.

**[Try the live demo →](https://jeloercc.github.io/pqc-sdk/)**  
[SDK repository](https://github.com/jeloercc/pqc-sdk) · [Documentation](https://jeloercc.github.io/pqc-sdk/) · [API reference](https://jeloercc.github.io/pqc-sdk/api/) · [npm](https://www.npmjs.com/package/@pqc-sdk/core)

[![CI](https://github.com/jeloercc/pqc-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/jeloercc/pqc-sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40pqc-sdk%2Fcore?style=flat-square)](https://www.npmjs.com/package/@pqc-sdk/core)
[![License](https://img.shields.io/npm/l/%40pqc-sdk%2Fcore?style=flat-square)](https://github.com/jeloercc/pqc-sdk/blob/main/LICENSE)

---

## What this repo is

This is the **interactive landing page** for PQC SDK — built with Next.js and deployed to Vercel. It is not the SDK itself. The SDK lives at [jeloercc/pqc-sdk](https://github.com/jeloercc/pqc-sdk).

The landing page gives developers a complete, browser-local introduction to post-quantum cryptography:

- Run the full **encrypt → decrypt** round trip with key generation and verification.
- Switch to **sign → verify** mode to try ML-DSA digital signatures.
- Choose from **7 algorithms** across KEM and signature families.
- Read timing data produced by your own browser in real time.
- Learn about the **MCP server** and **LangChain tools** for AI agent integration.
- Browse the FIPS 203/204 conformance findings and package map.

---

## What the SDK does

PQC SDK provides post-quantum hybrid encryption, digital signatures, streaming encryption, and AI-agent tool integrations for JavaScript and TypeScript applications.

```ts
import { pqc } from "@pqc-sdk/core";

// ── Hybrid encryption (X-Wing default) ─────────────────────────
const pair = await pqc.keys.generate();                          // X-Wing by default
const ciphertext = await pqc.encrypt("secret", pair.publicKey);
const plaintext  = await pqc.decrypt(ciphertext, pair.secretKey);

// ── Digital signatures (ML-DSA-65) ─────────────────────────────
const signer    = await pqc.keys.generate({ algorithm: "ml-dsa-65" });
const signature = await pqc.sign("document", signer.secretKey);
const valid     = await pqc.verify("document", signature, signer.publicKey);

// ── Pure FIPS 203 KEM variants ──────────────────────────────────
await pqc.keys.generate({ algorithm: "ml-kem-512"  });
await pqc.keys.generate({ algorithm: "ml-kem-768"  });   // FIPS-only
await pqc.keys.generate({ algorithm: "ml-kem-1024" });

// ── Streaming encryption ────────────────────────────────────────
import { encryptStream, collectDecryptStream } from "@pqc-sdk/core/stream";
const encrypted = encryptStream(readableStream, pair.publicKey);
const decrypted = await collectDecryptStream(encrypted, pair.secretKey);
```

**Install:**

```bash
npm install @pqc-sdk/core
```

---

## Packages

| Package | What it does | Tests |
| --- | --- | --- |
| [`@pqc-sdk/core`](https://www.npmjs.com/package/@pqc-sdk/core) | Encryption, signatures, key handling, streaming. Node 20+, Deno, Cloudflare Workers, React Native. | 416 |
| [`@pqc-sdk/cli`](https://www.npmjs.com/package/@pqc-sdk/cli) | `pqc init / keygen / encrypt / decrypt / audit` — dev scaffolding and file-level crypto. | 54 |
| [`@pqc-sdk/mcp-server`](https://github.com/jeloercc/pqc-sdk/tree/main/packages/mcp-server) | MCP stdio server — 6 PQC tool calls for Claude Desktop, Cursor, Continue, and any MCP host. | 13 |
| [`@pqc-sdk/langchain`](https://github.com/jeloercc/pqc-sdk/tree/main/packages/langchain) | LangChain / LangGraph `StructuredTool` wrappers + `pqcTools` bundle. | 14 |

**497 tests · all passing · 90%+ coverage on core**

---

## Algorithms

```
Encryption / Key Exchange
────────────────────────────────────────────────────────────────────
  x-wing        X25519 + ML-KEM-768 + AES-256-GCM   ← default
  ml-kem-512    FIPS 203 §4 (security category 1)
  ml-kem-768    FIPS 203 §4 (security category 3)   ← FIPS-only
  ml-kem-1024   FIPS 203 §4 (security category 5)

Signatures
────────────────────────────────────────────────────────────────────
  ml-dsa-44     FIPS 204 §5 (security category 2)
  ml-dsa-65     FIPS 204 §5 (security category 3)   ← recommended
  ml-dsa-87     FIPS 204 §5 (security category 5)
```

---

## AI Agent Integration

The SDK ships first-class support for AI agents. Both integrations expose the same six operations.

### MCP Server (Claude, Cursor, Continue, any MCP host)

```bash
npm install -g @pqc-sdk/mcp-server
```

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pqc": { "command": "pqc-mcp" }
  }
}
```

The model can then call `pqc_algorithms`, `pqc_keygen`, `pqc_encrypt`, `pqc_decrypt`, `pqc_sign`, `pqc_verify` as native tool calls.

### LangChain / LangGraph

```bash
npm install @pqc-sdk/langchain @pqc-sdk/core
```

```ts
import { pqcTools } from "@pqc-sdk/langchain";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const agent = createReactAgent({ llm: model, tools: pqcTools });
```

Each tool is a standard `StructuredTool` with a Zod input schema — the same six operations work identically in both paths.

---

## FIPS 203 / 204 Conformance

Clause-by-clause self-assessment matrices cover 43 requirements across FIPS 203 and FIPS 204. Six NONCONFORMING findings were identified and closed:

| ID | Finding | Fix |
| --- | --- | --- |
| F203-19 | Floating-point in `Compress_d` | Integer-only bit-shift arithmetic, verified over all 36,619 `(q,d)` pairs |
| F204-13 | Floating-point in `Decompose` / `Power2Round` / `HINT_M` | Integer-only, verified over all 8,380,417 values of Z_q |
| F203-18 | Branch-based implicit-reject — secret flag visible in control flow | Byte-wise arithmetic mask; both candidates computed unconditionally |
| F204-10 | Missing zeroization on ML-DSA verify path | `try`/`finally` with `cleanBytes` on every exit path |
| F203-11 | RBG failure misattributed as `INVALID_KEY` | Dedicated `RBG_FAILURE` error code |
| F204-08 | Wrong-length public key throws instead of returning `false` | Length check moved inside the `try` block |

> This is self-assessment, not CMVP validation. ACVP vectors passing is assurance evidence, not proof of every clause.

---

## Landing Page — Local Development

This repo runs the landing page. The SDK itself is at [jeloercc/pqc-sdk](https://github.com/jeloercc/pqc-sdk).

**Requirements:** Node.js 20+, npm

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000

# Production build
npm run build

# Start production server
npm start
```

### Project structure

```
app/
  layout.tsx       Root layout, metadata, fonts
  page.tsx         Renders <Demo />
  globals.css      Design tokens, animations, component styles

components/
  demo.tsx         Full landing page: playground, sections, AI agent docs
```

The entire page lives in [`components/demo.tsx`](./components/demo.tsx). Each logical section is a separate function component at the bottom of the file. The playground state machine is a `useReducer` at the top.

### Tech stack

| Dependency | Role |
| --- | --- |
| Next.js 16 | Framework (App Router, static export) |
| `@pqc-sdk/core` | Cryptographic SDK (dynamically imported client-side) |
| Tailwind CSS | Utility classes |
| Space Grotesk + DM Mono | Typography |
| `@vercel/analytics` | Analytics |

---

## Runtime Compatibility

| Runtime | Verified | Notes |
| --- | --- | --- |
| Node.js | Node 24.11 (target ≥20) | ESM and CJS |
| Browsers | ES2022 + WebCrypto | Use a bundler for `@pqc-sdk/core` |
| Deno | Deno 2.8.2 | Published-package import |
| Cloudflare Workers | Wrangler 4 | No `nodejs_compat` required |
| Bun | Supported | See compatibility guide |
| React Native | Expo SDK 54 / RN 0.81 | Import `react-native-get-random-values` before the SDK |

---

## Security Notes

- The browser demo is an evaluation and education surface, not a production key-management system.
- Demo keys are ephemeral and leave with the session. Do not use them for persistent secrets.
- JavaScript does not provide reliable memory zeroization; secret-key bytes, shared secrets, and plaintext may remain in memory after use.
- The SDK and its dependencies do not provide strict constant-time guarantees in JavaScript.
- `@pqc-sdk/cli audit` is heuristic and non-exhaustive. It can produce false positives and false negatives.
- Decryption rejects malformed, tampered, or mismatched ciphertext instead of returning corrupted plaintext.
- Reviews described in the repository are internal and AI-assisted — not an independent third-party cryptographic audit.
- Report suspected vulnerabilities through [`SECURITY.md`](https://github.com/jeloercc/pqc-sdk/blob/main/SECURITY.md), not a public issue.

---

## Documentation

- [Live browser demo](https://jeloercc.github.io/pqc-sdk/)
- [Quick Start guide](https://jeloercc.github.io/pqc-sdk/guide/quickstart)
- [Hybrid encryption guide](https://jeloercc.github.io/pqc-sdk/guide/hybrid-encryption)
- [Streaming encryption guide](https://jeloercc.github.io/pqc-sdk/guide/streaming-encryption)
- [Runtime compatibility](https://jeloercc.github.io/pqc-sdk/compatibility)
- [API reference](https://jeloercc.github.io/pqc-sdk/api/)
- [Migration guide (0.8.0)](https://github.com/jeloercc/pqc-sdk/blob/main/docs/MIGRATION-0.8.md)
- [FIPS 203 compliance matrix](https://github.com/jeloercc/pqc-sdk/blob/main/docs/compliance/FIPS-203-MATRIX.md)
- [FIPS 204 compliance matrix](https://github.com/jeloercc/pqc-sdk/blob/main/docs/compliance/FIPS-204-MATRIX.md)
- [Security audit (2026-06)](https://github.com/jeloercc/pqc-sdk/blob/main/docs/AUDIT-2026-06.md)
- [A2A agent protocol spec](https://github.com/jeloercc/pqc-sdk/tree/main/MPC)

---

## Contributing

Start with the [contribution guide](https://github.com/jeloercc/pqc-sdk/blob/main/CONTRIBUTING.md).

- Open an [issue](https://github.com/jeloercc/pqc-sdk/issues) for a reproducible bug or focused proposal.
- Use [Discussions](https://github.com/jeloercc/pqc-sdk/discussions) for questions and design conversations.
- Open a focused pull request with a clear description of user-visible behavior.
- Do not add security, performance, or adoption claims without primary evidence.

---

## License

[MIT](https://github.com/jeloercc/pqc-sdk/blob/main/LICENSE)
