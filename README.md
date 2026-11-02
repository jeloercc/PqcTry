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

| Package | Version | What it does |
| --- | --- | --- |
| [`@pqc-sdk/core`](https://www.npmjs.com/package/@pqc-sdk/core) | 0.11.3 | Encryption, signatures, key handling, streaming (`collectDecryptStream`), typed `PqcError` codes, `FIPS_ALGORITHMS`. Node 20+, Deno, Cloudflare Workers, React Native. |
| [`@pqc-sdk/cli`](https://www.npmjs.com/package/@pqc-sdk/cli) | 0.11.3 | `pqc init / keygen / encrypt / decrypt / audit` — dev scaffolding and file-level crypto. |
| [`@pqc-sdk/mcp-server`](https://www.npmjs.com/package/@pqc-sdk/mcp-server) | 0.4.3 | MCP stdio server — 7 PQC tools with an on-disk keystore for Claude Desktop, Cursor, Continue, and any MCP host. |
| [`@pqc-sdk/langchain`](https://www.npmjs.com/package/@pqc-sdk/langchain) | 0.3.3 | LangChain / LangGraph `StructuredTool` wrappers via the `createPqcTools()` factory. |

Tested against NIST ACVP known-answer vectors and cross-checked with Cloudflare CIRCL interop vectors. Not FIPS 140-3 / CMVP validated.

---

## Algorithms

```
Encryption / Key Exchange
────────────────────────────────────────────────────────────────────
  x-wing        X25519 + ML-KEM-768 + AES-256-GCM   ← default (CFRG draft, not FIPS)
  ml-kem-512    FIPS 203 §4 (security category 1)
  ml-kem-768    FIPS 203 §4 (security category 3)
  ml-kem-1024   FIPS 203 §4 (security category 5)

Signatures
────────────────────────────────────────────────────────────────────
  ml-dsa-44     FIPS 204 §5 (security category 2)
  ml-dsa-65     FIPS 204 §5 (security category 3)   ← recommended
  ml-dsa-87     FIPS 204 §5 (security category 5)
```

---

## AI Agent Integration

The SDK ships first-class support for AI agents. Since MCP server 0.3.0 / LangChain 0.3.0, **secret keys never pass through the model context**: tools refer to keys by `keyId`, and `pqc_sign` is opt-in.

### MCP Server (Claude, Cursor, Continue, any MCP host)

```bash
npm install -g @pqc-sdk/mcp-server
```

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pqc": {
      "command": "pqc-mcp",
      "env": { "PQC_KEYSTORE_DIR": "/Users/me/.local/share/my-agent/pqc-keys" }
    }
  }
}
```

Point `PQC_KEYSTORE_DIR` at a directory dedicated to the agent — the model can use every key in it.

| Tool | Input | Output |
| --- | --- | --- |
| `pqc_algorithms` | — | `{ supported, fips }` |
| `pqc_keygen` | `algorithm?` (default `x-wing`) | `{ keyId, algorithm, publicToken }` |
| `pqc_list_keys` | — | `{ keys: [{ keyId, algorithm, publicToken }] }` |
| `pqc_encrypt` | `publicToken` + `plaintext` or `plaintextBase64` | `{ ciphertextHex }` |
| `pqc_decrypt` | `keyId`, `ciphertextHex` | `{ encoding: "utf8", plaintext }` or `{ encoding: "base64", plaintextBase64 }` |
| `pqc_sign` | `keyId`, `message` — only with `PQC_MCP_ENABLE_SIGN=1` | `{ signatureHex }` |
| `pqc_verify` | `message`, `signatureHex`, `publicToken` | `{ verified }` |

| Env var | Purpose |
| --- | --- |
| `PQC_KEYSTORE_DIR` | Keystore directory (default `~/.local/share/pqc-sdk/agent-keys`) |
| `PQC_MCP_ENABLE_SIGN` | `1` exposes `pqc_sign` (off by default) |
| `PQC_MCP_MAX_KEYS` | Max keys in the keystore (default `100`, then `KEYSTORE_FULL`) |

### LangChain / LangGraph

```bash
npm install @pqc-sdk/langchain @pqc-sdk/core
```

```ts
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { SecretKey } from "@pqc-sdk/core";
import { createPqcTools } from "@pqc-sdk/langchain";

// Demo only — use durable storage (secrets manager, KMS-wrapped DB) in production.
const vault = new Map<string, SecretKey>();

const tools = createPqcTools({
  resolveSecretKey: async (keyId) => {
    const key = vault.get(keyId);
    if (!key) throw new Error(`unknown key ${keyId}`);
    return key;
  },
  onSecretKey: async (keyId, secretKey) => { vault.set(keyId, secretKey); },
  // enableSign: true, // pqc_sign is excluded unless you opt in
});

const agent = createReactAgent({ llm, tools });
```

Each tool is a standard `StructuredTool` with a Zod input schema. The package performs no I/O — keys move only through your callbacks.

> **Upgrading from 0.2.x:** `pqcTools`, `pqcKeygenTool`, `pqcDecryptTool` and `pqcSignTool` were removed, and `secretToken` inputs/outputs were replaced by `keyId`. Keys generated with 0.2.x were returned to the model; consider rotating them.

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
- [Security review (2026-09)](https://github.com/jeloercc/pqc-sdk/blob/main/docs/AUDIT-2026-09.md)
- [Threat model](https://github.com/jeloercc/pqc-sdk/blob/main/docs/security/THREAT-MODEL.md)
- [Core changelog](https://github.com/jeloercc/pqc-sdk/blob/main/packages/core/CHANGELOG.md)
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
