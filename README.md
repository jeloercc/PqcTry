# PQC SDK

**Post-Quantum Encryption. Running in your browser right now.**

PQC SDK gives JavaScript and TypeScript applications post-quantum hybrid encryption, digital signatures, key handling, and file-encryption tooling.

[**Try the live demo →**](https://jeloercc.github.io/pqc-sdk/)  
[GitHub](https://github.com/jeloercc/pqc-sdk) · [Documentation](https://jeloercc.github.io/pqc-sdk/) · [API reference](https://jeloercc.github.io/pqc-sdk/api/)

[![CI](https://github.com/jeloercc/pqc-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/jeloercc/pqc-sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40pqc-sdk%2Fcore?style=flat-square)](https://www.npmjs.com/package/@pqc-sdk/core)
[![GitHub stars](https://img.shields.io/github/stars/jeloercc/pqc-sdk?style=flat-square)](https://github.com/jeloercc/pqc-sdk/stargazers)
[![License](https://img.shields.io/npm/l/%40pqc-sdk%2Fcore?style=flat-square)](https://github.com/jeloercc/pqc-sdk/blob/main/packages/core/LICENSE)

## Try the Live Demo

The fastest way to understand PQC SDK is to run it:

**[Open the browser demo →](https://jeloercc.github.io/pqc-sdk/)**
<img width="1112" height="936" alt="Screenshot 2026-09-05 at 12 29 39 PM" src="https://github.com/user-attachments/assets/e4524a4b-3384-4ae9-a452-b60929166d12" />

In one local browser flow, you can:

- Generate a post-quantum key pair.
- Choose X-Wing or ML-KEM-768.
- Encrypt a message.
- Decrypt the ciphertext.
- Verify that the recovered plaintext matches.
- Measure key generation, encryption, and decryption.

The demo is the primary entry point to the project. It keeps keys ephemeral and performs the cryptographic round trip in the browser.

<!-- Launch asset placeholder: replace with a committed screenshot, GIF, or browser recording of the verified demo state. -->
> **Demo preview coming soon**  
> Add a committed visual showing the browser playground after: message entry → key generation → encryption → decryption → “Messages match”.

## Features

- **Hybrid encryption** with X-Wing (X25519 + ML-KEM-768) and AES-256-GCM.
- **ML-KEM-768** (FIPS 203) for pure post-quantum KEM encryption.
- **ML-DSA-65** (FIPS 204) for digital signatures.
- **Streaming encryption** for data that should not be held in memory at once.
- **TypeScript APIs** with ESM and CJS package support.
- **Browser, Node.js, Deno, Bun, Cloudflare Workers, and React Native support** as documented in the compatibility guide.
- **No WASM or native add-ons** for the core package.
- **Key serialization and deserialization** with algorithm and key-use validation.
- **Fail-closed decryption** for malformed, tampered, or mismatched ciphertext.
- **CLI tooling** for project setup, key generation, file encryption, decryption, and heuristic crypto migration audits.
- **Open source** under the MIT License.

## Package Map

| Package | Responsibility |
| --- | --- |
| [`@pqc-sdk/core`](https://www.npmjs.com/package/@pqc-sdk/core) | TypeScript SDK for hybrid encryption, signatures, key handling, and streaming APIs. |
| [`@pqc-sdk/cli`](https://www.npmjs.com/package/@pqc-sdk/cli) | Project scaffolding, key generation, file encryption/decryption, and heuristic crypto migration audits. |

## Runtime Compatibility

The compatibility guide records real round-trip validation for these runtimes:

| Runtime | Verified support | Notes |
| --- | --- | --- |
| Node.js | Node 24.11 (target ≥20) | ESM and CJS. |
| Browsers | ES2022 target with WebCrypto | Use a package-aware bundler for `@pqc-sdk/core`. |
| Deno | Deno 2.8.2 | Published-package import or the documented import map; file examples need `--allow-read`. |
| Cloudflare Workers | Wrangler 4 / local workerd | No `nodejs_compat` required. |
| Bun | Supported by the published package | See the compatibility guide for current details. |
| React Native | Expo SDK 54 / RN 0.81 | Import `react-native-get-random-values` before the SDK. |

See the [full compatibility notes](https://jeloercc.github.io/pqc-sdk/compatibility) before deploying to a specific runtime.

## Installation

**Recommended: npm**

```bash
npm install @pqc-sdk/core@0.8.1
```

Alternative package managers:

```bash
pnpm add @pqc-sdk/core@0.8.1
```

```bash
yarn add @pqc-sdk/core@0.8.1
```

Install the CLI when you need project scaffolding or file workflows:

```bash
npm install @pqc-sdk/cli@0.8.1
```

You can also run the CLI directly with `npx` without adding it to your project:

```bash
npx @pqc-sdk/cli@0.8.1 init
```

## Quick Start

This example generates a key pair, encrypts a string, decrypts it, and verifies the round trip:

```ts
import { pqc } from "@pqc-sdk/core";

const message = "This message should remain private.";

const pair = await pqc.keys.generate({
  algorithm: "x-wing"
});
const ciphertext = await pqc.encrypt(message, pair.publicKey);
const plaintext = await pqc.decrypt(ciphertext, pair.secretKey);

const recovered = new TextDecoder().decode(plaintext);

if (recovered !== message) {
  throw new Error("Round-trip verification failed");
}

console.log("Decryption successful. Messages match.");
```

The explicit algorithm makes this example reproducible across releases. In the published `0.8.x` line, calling `pqc.keys.generate()` without options returns X-Wing. If you need pure ML-KEM-768, select it explicitly:

```ts
const mlKemPair = await pqc.keys.generate({
  algorithm: "ml-kem-768"
});

const xWingPair = await pqc.keys.generate({
  algorithm: "x-wing"
});
```

`pqc.encrypt` accepts a `string` or `Uint8Array` and returns a `Uint8Array`. `pqc.decrypt` returns the recovered bytes.

See [Migrating to 0.8.0](https://github.com/jeloercc/pqc-sdk/blob/main/docs/MIGRATION-0.8.md) for the default-algorithm change and mixed-version deployment guidance.

## Browser Usage

The core package publishes ESM and CJS entry points. For a browser application, install it through npm and run this code from your bundler's client-side module (for example, a Vite, Next.js, or similar package-aware build). The published package does not document a direct CDN or browser import-map path, so this example does not use one:

```ts
import { pqc } from "@pqc-sdk/core";

const message = "Hello from the browser";
const pair = await pqc.keys.generate({ algorithm: "x-wing" });

const ciphertext = await pqc.encrypt(message, pair.publicKey);
const recovered = new TextDecoder().decode(
  await pqc.decrypt(ciphertext, pair.secretKey)
);

document.querySelector("#result")!.textContent =
  recovered === message
    ? "Decryption successful. Messages match."
    : "The recovered message does not match.";
```

For the complete interactive experience, including algorithm selection, operation state, errors, and timings, use the [live demo](https://jeloercc.github.io/pqc-sdk/).

## CLI Usage

The CLI package is [`@pqc-sdk/cli`](https://www.npmjs.com/package/@pqc-sdk/cli). Run it with `npx`:

### Initialize a project

```bash
npx @pqc-sdk/cli init
```

This creates project configuration, development keys, and a working example.

### Generate keys

```bash
npx @pqc-sdk/cli@0.8.1 keygen --algorithm ml-dsa-65 --out keys/
```

Keys are serialized as base64url files in the selected output directory.

### Audit existing crypto usage

```bash
npx @pqc-sdk/cli@0.8.1 audit
```

`audit` is a heuristic, non-exhaustive scan for common RSA, ECDSA, and ECDH package names and call patterns. A finding requires manual review, and a clean result does not prove that a codebase contains no pre-quantum cryptography.

### Encrypt and decrypt a file

```bash
npx @pqc-sdk/cli@0.8.1 encrypt will.pdf --key keys/alice.public.pqc
npx @pqc-sdk/cli@0.8.1 decrypt will.pdf.enc --key keys/alice.secret.pqc --out will.pdf
```

`encrypt` writes `<input>.enc` by default. `decrypt` removes `.enc` or appends `.dec`. Existing files are not overwritten unless `--force` is passed.

The CLI uses the same envelope format as `pqc.encrypt` and `pqc.decrypt` for its file workflow. Expected failures print an error to stderr and exit with code `1`.

## Supported Algorithms

| Algorithm | API role | Use it when |
| --- | --- | --- |
| `x-wing` | Hybrid KEM: X25519 + ML-KEM-768 | You want the SDK's hybrid encryption path for long-term data experiments. |
| `ml-kem-768` | Pure post-quantum KEM (FIPS 203) | FIPS scope, compatibility, or size and speed considerations call for pure ML-KEM. |
| `ml-dsa-65` | Digital signatures (FIPS 204) | You need to sign and verify data rather than encrypt it. |

Encryption examples use `x-wing` or `ml-kem-768`. `ml-dsa-65` is for signatures and is not a KEM encryption algorithm.

The no-argument default is version-sensitive. The published SDK documentation notes that versions from `0.8.0` use X-Wing as the default; pass `algorithm` explicitly when upgrading across versions or when reproducibility matters.

## Architecture

PQC SDK does not implement the underlying cryptographic primitives. The core package composes:

1. **KEM key encapsulation** using ML-KEM-768 or the X-Wing hybrid.
2. **AES-256-GCM payload encryption** using the established shared secret.
3. **Versioned envelopes** that allow decryption to identify the supported format.
4. **Typed key handling** for generation, serialization, deserialization, and key-use validation.
5. **Streaming adapters** for large payloads in supported Web Streams runtimes.

The implementation uses `@noble/post-quantum` for ML-KEM and ML-DSA and `@noble/ciphers` for AES-GCM. See the repository's [verification notes](https://github.com/jeloercc/pqc-sdk#how-this-is-verified) for the test-vector, property, fuzzing, and mutation coverage described by the project.

## Verification and Trust

The project separates automated validation from security assurance:

- **Official test vectors:** NIST ACVP vectors for ML-KEM-768 and ML-DSA-65, plus X-Wing draft Appendix C vectors.
- **Property-based tests:** arbitrary-payload round trips and single-byte tamper failures.
- **Fuzz testing:** hostile and arbitrary inputs for key deserialization, with fail-closed assertions.
- **Mutation testing:** streaming-envelope truncation, reorder, duplication, splice, and final-flag mutations, checked against documented error codes.
- **Golden vectors:** versioned envelope and serialization fixtures protect wire-format stability.

This is verified testing, not independent certification. The repository's published reviews are internal and AI-assisted; they are not an independent third-party cryptographic audit. Read the [security guidance](https://github.com/jeloercc/pqc-sdk/blob/main/SECURITY.md) and [verification details](https://github.com/jeloercc/pqc-sdk#how-this-is-verified) before adopting the SDK.

## Security Notes

- The browser demo is an evaluation and education surface, not a production key-management system.
- Demo keys are ephemeral. Do not use them for persistent secrets.
- JavaScript does not provide reliable memory zeroization; secret-key bytes, shared secrets, and plaintext may remain in memory after use.
- The core package and its dependencies do not provide strict constant-time guarantees in JavaScript.
- `@pqc-sdk/cli audit` is heuristic and non-exhaustive. It can produce false positives and false negatives.
- Decryption rejects malformed, tampered, or mismatched ciphertext instead of returning corrupted plaintext.
- Choose algorithms, authentication, storage, rotation, access control, and recovery procedures for your actual threat model.
- The project documentation describes internal and AI-assisted reviews; do not interpret them as an independent third-party audit.
- Report suspected vulnerabilities through [`SECURITY.md`](https://github.com/jeloercc/pqc-sdk/blob/main/SECURITY.md), not a public issue.

## Documentation

- [Live browser demo](https://jeloercc.github.io/pqc-sdk/)
- [5-minute Quick Start](https://jeloercc.github.io/pqc-sdk/guide/quickstart)
- [Hybrid encryption guide](https://jeloercc.github.io/pqc-sdk/guide/hybrid-encryption)
- [Streaming encryption guide](https://jeloercc.github.io/pqc-sdk/guide/streaming-encryption)
- [Runtime compatibility](https://jeloercc.github.io/pqc-sdk/compatibility)
- [API reference](https://jeloercc.github.io/pqc-sdk/api/)
- [`@pqc-sdk/core` on npm](https://www.npmjs.com/package/@pqc-sdk/core)
- [`@pqc-sdk/cli` on npm](https://www.npmjs.com/package/@pqc-sdk/cli)
- [GitHub repository](https://github.com/jeloercc/pqc-sdk)

## Contributing

Start with the repository's [contribution guide](https://github.com/jeloercc/pqc-sdk/blob/main/CONTRIBUTING.md).

- Open an [issue](https://github.com/jeloercc/pqc-sdk/issues) for a reproducible bug or focused proposal.
- Use [Discussions](https://github.com/jeloercc/pqc-sdk/discussions) for questions and design conversations.
- Open a focused pull request with a clear description of user-visible behavior.
- Add or update tests for changes to cryptographic behavior, envelope formats, serialization, parsing, or streaming.
- Document runtime assumptions and security implications.
- Do not add security, performance, or adoption claims without primary evidence.

## License

PQC SDK is released under the [MIT License](https://github.com/jeloercc/pqc-sdk/blob/main/packages/core/LICENSE).
