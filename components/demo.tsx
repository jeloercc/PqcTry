"use client";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { KeyPair, KemAlgorithm, PqcErrorCode, SignatureAlgorithm } from "@pqc-sdk/core";
import { CliSection, Glossary, HowItWorks, RuntimeSection, VerificationSection } from "./sections";

// ── Algorithm types ─────────────────────────────────────────────────────────
type DemoAlgorithm = KemAlgorithm | SignatureAlgorithm;
type Mode = "encrypt" | "sign";
type Phase = "idle" | "generating" | "encrypting" | "decrypting" | "signing" | "verifying";
type KemPair = KeyPair<KemAlgorithm>;
type DsaPair = KeyPair<SignatureAlgorithm>;
type TraceEvent = { label: string; detail: string; time: number; tone: "accent" | "success" };

type State = {
  mode: Mode;
  message: string;
  algorithm: DemoAlgorithm;
  pair: KemPair | DsaPair | null;
  publicKeyText: string | null;
  secretKeyText: string | null;
  // encrypt mode
  ciphertext: Uint8Array | null;
  plaintext: string | null;
  plaintextSize: number | null;
  verified: boolean;
  // sign mode
  signature: Uint8Array | null;
  signatureValid: boolean | null;
  times: { key: number | null; encrypt: number | null; decrypt: number | null; sign: number | null; verify: number | null };
  phase: Phase;
  error: string | null;
  trace: TraceEvent[];
};

type Action =
  | { type: "message"; value: string }
  | { type: "mode"; value: Mode }
  | { type: "algorithm"; value: DemoAlgorithm }
  | { type: "phase"; value: Phase }
  | { type: "keys"; pair: State["pair"]; publicKeyText: string; secretKeyText: string; duration: number; elapsed: number }
  | { type: "encrypted"; value: Uint8Array; duration: number; elapsed: number }
  | { type: "decrypted"; value: string; plaintextSize: number; duration: number; elapsed: number; verified: boolean }
  | { type: "signed"; signature: Uint8Array; duration: number; elapsed: number }
  | { type: "verified"; valid: boolean; duration: number; elapsed: number }
  | { type: "error"; value: string }
  | { type: "invalid"; value: string };

const initialEncryptAlgorithm: KemAlgorithm = "x-wing";
const initialSignAlgorithm: SignatureAlgorithm = "ml-dsa-65";

const initial: State = {
  mode: "encrypt",
  message: "This message should remain private.",
  algorithm: initialEncryptAlgorithm,
  pair: null, publicKeyText: null, secretKeyText: null,
  ciphertext: null, plaintext: null, plaintextSize: null, verified: false,
  signature: null, signatureValid: null,
  times: { key: null, encrypt: null, decrypt: null, sign: null, verify: null },
  phase: "idle", error: null, trace: [],
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "message": return { ...s, message: a.value, plaintext: null, plaintextSize: null, verified: false, signatureValid: null, times: { ...s.times, decrypt: null, verify: null }, error: null, trace: s.pair ? s.trace : [] };
    case "mode": {
      const alg: DemoAlgorithm = a.value === "encrypt" ? initialEncryptAlgorithm : initialSignAlgorithm;
      return { ...initial, mode: a.value, message: s.message, algorithm: alg };
    }
    case "algorithm": return { ...initial, mode: s.mode, message: s.message, algorithm: a.value as DemoAlgorithm };
    case "phase": return { ...s, phase: a.value, error: null };
    case "keys": return { ...s, pair: a.pair, publicKeyText: a.publicKeyText, secretKeyText: a.secretKeyText, phase: "idle", ciphertext: null, plaintext: null, plaintextSize: null, verified: false, signature: null, signatureValid: null, times: { key: a.duration, encrypt: null, decrypt: null, sign: null, verify: null }, error: null, trace: [{ label: "Key pair generated", detail: "Post-quantum key pair ready", time: a.elapsed, tone: "accent" }] };
    case "encrypted": return { ...s, ciphertext: a.value, phase: "idle", plaintext: null, plaintextSize: null, verified: false, times: { ...s.times, encrypt: a.duration, decrypt: null }, error: null, trace: [...s.trace, { label: "Message encrypted", detail: "Ciphertext sealed with the public key", time: a.elapsed, tone: "accent" }] };
    case "decrypted": return { ...s, plaintext: a.value, plaintextSize: a.plaintextSize, verified: a.verified, phase: "idle", times: { ...s.times, decrypt: a.duration }, error: null, trace: [...s.trace, { label: "Message decrypted", detail: "Plaintext returned", time: a.elapsed, tone: "accent" }, ...(a.verified ? [{ label: "Verification successful", detail: "Plaintext matches the original message", time: a.elapsed, tone: "success" as const }] : [{ label: "Verification failed", detail: "Decrypted plaintext does not match the captured message", time: a.elapsed, tone: "accent" as const }])] };
    case "signed": return { ...s, signature: a.signature, signatureValid: null, phase: "idle", times: { ...s.times, sign: a.duration, verify: null }, error: null, trace: [...s.trace, { label: "Message signed", detail: "ML-DSA signature produced", time: a.elapsed, tone: "accent" }] };
    case "verified": return { ...s, signatureValid: a.valid, phase: "idle", times: { ...s.times, verify: a.duration }, error: null, trace: [...s.trace, { label: a.valid ? "Signature verified" : "Signature invalid", detail: a.valid ? "Signature is authentic and untampered" : "Signature verification failed", time: a.elapsed, tone: a.valid ? "success" : "accent" }] };
    case "error": return { ...s, phase: "idle", pair: null, publicKeyText: null, secretKeyText: null, ciphertext: null, plaintext: null, plaintextSize: null, verified: false, signature: null, signatureValid: null, times: { key: null, encrypt: null, decrypt: null, sign: null, verify: null }, error: a.value, trace: [] };
    // Input validation only reports the problem; keys and prior results stay intact.
    case "invalid": return { ...s, phase: "idle", error: a.value };
  }
}

const algorithmInfo: Record<DemoAlgorithm, string> = {
  "x-wing": "Hybrid: classical X25519 combined with post-quantum ML-KEM-768. An attacker must break both. The SDK default. Defined in an IETF CFRG draft, so it is not a NIST FIPS algorithm.",
  "ml-kem-512": "NIST FIPS 203, security category 1 (comparable to AES-128). Smallest and fastest ML-KEM.",
  "ml-kem-768": "NIST FIPS 203, security category 3 (comparable to AES-192). Choose it when you need a pure FIPS algorithm.",
  "ml-kem-1024": "NIST FIPS 203, security category 5 (comparable to AES-256). Largest keys, highest security margin.",
  "ml-dsa-44": "NIST FIPS 204, security category 2. Smallest signatures, but below the recommended level; the SDK logs a warning.",
  "ml-dsa-65": "NIST FIPS 204, security category 3. The recommended default for signatures.",
  "ml-dsa-87": "NIST FIPS 204, security category 5. Largest signatures, highest security margin.",
};

const ms = (n: number | null) => (n === null ? "Waiting" : `${n.toFixed(1)} ms`);

const codeEncrypt = `import { pqc } from '@pqc-sdk/core';

// ── Hybrid encryption (X-Wing default) ──────────
const pair = await pqc.keys.generate(); // X-Wing
const ciphertext = await pqc.encrypt('secret', pair.publicKey);
const plaintext = await pqc.decrypt(ciphertext, pair.secretKey);

// ── Digital signatures (ML-DSA-65) ──────────────
const signer = await pqc.keys.generate({ algorithm: 'ml-dsa-65' });
const signature = await pqc.sign('document', signer.secretKey);
const valid = await pqc.verify('document', signature, signer.publicKey);

// ── Typed errors + FIPS-only subset (0.11) ──────
import { PqcError, FIPS_ALGORITHMS } from '@pqc-sdk/core';
try { await pqc.decrypt(tampered, pair.secretKey); }
catch (e) { if (e instanceof PqcError) console.log(e.code); } // DECRYPTION_FAILED
FIPS_ALGORITHMS.includes('x-wing'); // false — CFRG draft`;

async function generateKemPair(pqc: typeof import("@pqc-sdk/core").pqc, algorithm: KemAlgorithm): Promise<KemPair> {
  return pqc.keys.generate({ algorithm });
}
async function generateDsaPair(pqc: typeof import("@pqc-sdk/core").pqc, algorithm: SignatureAlgorithm): Promise<DsaPair> {
  return pqc.keys.generate({ algorithm });
}

// ── Demo component ────────────────────────────────────────────────────────────
export function Demo() {
  const [s, d] = useReducer(reducer, initial);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [installTab, setInstallTab] = useState<"npm" | "pnpm" | "yarn" | "mcp">("npm");
  const operationLock = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const executionSnapshot = useRef<string | null>(null);
  const installTabsRef = useRef<HTMLDivElement>(null);

  const busy = s.phase !== "idle";
  const isEncryptMode = s.mode === "encrypt";
  const isSignMode = s.mode === "sign";
  const succeedState = isEncryptMode ? s.verified : s.signatureValid === true;
  const total = useMemo(() => Object.values(s.times).reduce<number>((a, b) => a + (b ?? 0), 0), [s.times]);
  const max = Math.max(...Object.values(s.times).map((x) => x ?? 0), 1);

  useEffect(() => {
    const warm = () => { void import("@pqc-sdk/core").catch(() => {}); };
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(warm); return () => w.cancelIdleCallback?.(id); }
    const id = window.setTimeout(warm, 1500); return () => window.clearTimeout(id);
  }, []);

  function beginOperation() { if (operationLock.current) return false; operationLock.current = true; return true; }

  // ── KEM helpers ─────────────────────────────────────────────────────────────
  async function generateKemKeys(pqc: typeof import("@pqc-sdk/core").pqc, algorithm: KemAlgorithm, traceStart: number) {
    d({ type: "phase", value: "generating" });
    const t = performance.now();
    const pair = await generateKemPair(pqc, algorithm);
    const now = performance.now();
    d({ type: "keys", pair, publicKeyText: pqc.keys.serialize(pair.publicKey), secretKeyText: pqc.keys.serialize(pair.secretKey), duration: now - t, elapsed: now - traceStart });
    return pair;
  }
  async function generateDsaKeys(pqc: typeof import("@pqc-sdk/core").pqc, algorithm: SignatureAlgorithm, traceStart: number) {
    d({ type: "phase", value: "generating" });
    const t = performance.now();
    const pair = await generateDsaPair(pqc, algorithm);
    const now = performance.now();
    d({ type: "keys", pair, publicKeyText: pqc.keys.serialize(pair.publicKey), secretKeyText: pqc.keys.serialize(pair.secretKey), duration: now - t, elapsed: now - traceStart });
    return pair;
  }
  async function encryptMessage(pqc: typeof import("@pqc-sdk/core").pqc, message: string, pair: KemPair, traceStart: number) {
    d({ type: "phase", value: "encrypting" });
    const t = performance.now();
    const value = await pqc.encrypt(message, pair.publicKey);
    const now = performance.now();
    d({ type: "encrypted", value, duration: now - t, elapsed: now - traceStart });
    return value;
  }
  async function decryptMessage(pqc: typeof import("@pqc-sdk/core").pqc, ciphertext: Uint8Array, pair: KemPair, messageSnapshot: string | null, traceStart: number) {
    d({ type: "phase", value: "decrypting" });
    const t = performance.now();
    const value = await pqc.decrypt(ciphertext, pair.secretKey);
    const now = performance.now();
    const plaintext = new TextDecoder().decode(value);
    d({ type: "decrypted", value: plaintext, plaintextSize: value.byteLength, duration: now - t, elapsed: now - traceStart, verified: messageSnapshot !== null && plaintext === messageSnapshot });
    return plaintext;
  }
  async function signMessage(pqc: typeof import("@pqc-sdk/core").pqc, message: string, pair: DsaPair, traceStart: number) {
    d({ type: "phase", value: "signing" });
    const t = performance.now();
    const sig = await pqc.sign(message, pair.secretKey);
    const now = performance.now();
    d({ type: "signed", signature: sig, duration: now - t, elapsed: now - traceStart });
    return sig;
  }
  async function verifyMessage(pqc: typeof import("@pqc-sdk/core").pqc, message: string, sig: Uint8Array, pair: DsaPair, traceStart: number) {
    d({ type: "phase", value: "verifying" });
    const t = performance.now();
    const valid = await pqc.verify(message, sig, pair.publicKey);
    const now = performance.now();
    d({ type: "verified", valid, duration: now - t, elapsed: now - traceStart });
    return valid;
  }

  // ── Orchestrated operations ──────────────────────────────────────────────────
  async function generate() {
    if (!beginOperation()) return;
    executionSnapshot.current = null;
    try {
      const { pqc } = await import("@pqc-sdk/core");
      if (isEncryptMode) await generateKemKeys(pqc, s.algorithm as KemAlgorithm, performance.now());
      else await generateDsaKeys(pqc, s.algorithm as SignatureAlgorithm, performance.now());
    } catch (err) { d({ type: "error", value: describeError(err, "The cryptographic module could not initialize. Try a current browser and run again.") }); }
    finally { operationLock.current = false; }
  }
  async function encrypt() {
    if (!s.pair) return d({ type: "invalid", value: "Generate keys before encrypting." });
    if (!s.message.trim()) return d({ type: "invalid", value: "Enter a message before encrypting." });
    if (!beginOperation()) return;
    const message = s.message;
    executionSnapshot.current = message;
    try {
      const { pqc } = await import("@pqc-sdk/core");
      await encryptMessage(pqc, message, s.pair as KemPair, performance.now());
    } catch (err) { d({ type: "error", value: describeError(err, "Encryption failed. Reset the demo and try again.") }); }
    finally { operationLock.current = false; }
  }
  async function decrypt() {
    if (!s.pair || !s.ciphertext || !beginOperation()) return;
    try {
      const { pqc } = await import("@pqc-sdk/core");
      await decryptMessage(pqc, s.ciphertext, s.pair as KemPair, executionSnapshot.current, performance.now());
    } catch (err) { d({ type: "error", value: describeError(err, "Decryption failed. Reset the demo and try again.") }); }
    finally { operationLock.current = false; }
  }
  async function sign() {
    if (!s.pair) return d({ type: "invalid", value: "Generate keys before signing." });
    if (!s.message.trim()) return d({ type: "invalid", value: "Enter a message before signing." });
    if (!beginOperation()) return;
    executionSnapshot.current = s.message;
    try {
      const { pqc } = await import("@pqc-sdk/core");
      await signMessage(pqc, s.message, s.pair as DsaPair, performance.now());
    } catch (err) { d({ type: "error", value: describeError(err, "Signing failed. Reset the demo and try again.") }); }
    finally { operationLock.current = false; }
  }
  async function verifySignature() {
    if (!s.pair || !s.signature || !beginOperation()) return;
    try {
      const { pqc } = await import("@pqc-sdk/core");
      await verifyMessage(pqc, s.message, s.signature, s.pair as DsaPair, performance.now());
    } catch (err) { d({ type: "error", value: describeError(err, "Verification failed. Reset the demo and try again.") }); }
    finally { operationLock.current = false; }
  }
  async function runComplete() {
    const message = s.message;
    if (!message.trim()) return d({ type: "invalid", value: "Enter a message before running the demo." });
    if (!beginOperation()) return;
    executionSnapshot.current = message;
    const traceStart = performance.now();
    try {
      const { pqc } = await import("@pqc-sdk/core");
      if (isEncryptMode) {
        const pair = await generateKemKeys(pqc, s.algorithm as KemAlgorithm, traceStart);
        const ciphertext = await encryptMessage(pqc, message, pair, traceStart);
        await decryptMessage(pqc, ciphertext, pair, message, traceStart);
      } else {
        const pair = await generateDsaKeys(pqc, s.algorithm as SignatureAlgorithm, traceStart);
        const sig = await signMessage(pqc, message, pair, traceStart);
        await verifyMessage(pqc, message, sig, pair, traceStart);
      }
    } catch (err) { d({ type: "error", value: describeError(err, "The demo could not complete. Reset it and try again.") }); }
    finally { operationLock.current = false; }
  }

  async function copy(text: string) {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
      setCopyError(false); setCopiedText(text);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedText(null), 1500);
    } catch { setCopiedText(null); setCopyError(true); }
  }
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const installTabs = ["npm", "pnpm", "yarn", "mcp"] as const;
  function handleInstallKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % installTabs.length;
    if (event.key === "ArrowLeft") next = (index + installTabs.length - 1) % installTabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = installTabs.length - 1;
    if (next === index) return;
    event.preventDefault();
    setInstallTab(installTabs[next]);
    installTabsRef.current?.querySelector<HTMLButtonElement>(`[data-install-tab="${installTabs[next]}"]`)?.focus();
  }

  return (
    <main>
      <span className="sr-only" aria-live="polite">{copiedText ? "Copied" : copyError ? "Unable to copy. Please try again." : ""}</span>
      <Header />

      {/* ── Hero / Playground ─────────────────────────────────────────────── */}
      <section id="demo" className="grid-bg border-b line">
        <div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-8 lg:py-10">
          <div className="workspace-shell">
            <div className="workspace-header">
              <div>
                <p className="mono text-[10px] uppercase tracking-[.18em] text-[var(--accent)]">Browser-native post-quantum cryptography</p>
                <h1 className="mt-3 max-w-[680px] text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-5xl lg:text-6xl">
                  Encrypt. Sign. <span className="text-[var(--muted)]">Connect AI agents.</span>
                </h1>
                <p className="mt-4 max-w-[560px] text-sm leading-6 text-[var(--muted)]">
                  An open-source TypeScript SDK for encryption and digital signatures that stay secure against future quantum computers, built on the NIST FIPS 203 and 204 standards. It also gives AI agents the same operations as tools. Everything below runs in your browser; nothing is sent to a server.
                </p>
              </div>
              <div className="workspace-status mono">
                <span className="status-mark" aria-hidden="true" />
                <span>{busy ? s.phase.toUpperCase() : succeedState ? (isEncryptMode ? "VERIFIED" : "VALID") : "READY"}</span>
                <span className="text-[var(--faint)]">LOCAL SESSION</span>
              </div>
            </div>
            <div className="workspace-grid">
              <div className="workspace-control">
                <div className="workspace-region-label">1 · Try it</div>
                <Playground
                  s={s} busy={busy}
                  generate={generate} encrypt={encrypt} decrypt={decrypt}
                  sign={sign} verifySignature={verifySignature}
                  runComplete={runComplete}
                  onMessage={(value) => d({ type: "message", value })}
                  onMode={(value) => { executionSnapshot.current = null; d({ type: "mode", value }); }}
                  onAlgorithm={(value) => { executionSnapshot.current = null; d({ type: "algorithm", value }); }}
                />
              </div>
              <div className="workspace-observe">
                <div className="workspace-region-label">2 · What is happening</div>
                <CryptoViz
                  phase={s.phase} mode={s.mode}
                  verified={isEncryptMode ? s.verified : s.signatureValid === true}
                  sHasPair={!!s.pair}
                  sHasCipher={isEncryptMode ? !!s.ciphertext : !!s.signature}
                  times={s.times}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustPanel />

      {/* ── Code snippet ─────────────────────────────────────────────────────── */}
      <section className="border-y bg-[#0f1215] py-24 line">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 lg:grid-cols-[.75fr_1.25fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-.04em] sm:text-4xl">The API stays small.</h2>
            <p className="mt-4 max-w-[370px] text-sm leading-6 text-[var(--muted)]">
              Encrypt, decrypt, sign, and verify — a handful of readable calls cover the complete cryptographic workflow.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border bg-[#0b0d0f] line">
            <div className="flex justify-between border-b px-4 py-3 line">
              <span className="mono text-[10px] text-[var(--faint)]">quickstart.ts</span>
              <button onClick={() => copy(codeEncrypt)} className="mono text-[11px] text-[var(--accent)]">{copiedText === codeEncrypt ? "Copied" : "Copy code"}</button>
            </div>
            <pre className="overflow-x-auto p-5 text-[12px] leading-7 text-[#c5d0da]"><code>{codeEncrypt}</code></pre>
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* ── Timing metrics ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32">
        <h2 className="text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Real work, measured locally.</h2>
        <p className="mt-3 max-w-[640px] text-sm leading-6 text-[var(--muted)]">These numbers come from the run you just did in this browser, not from a benchmark. Run the playground to fill them in; switch modes to time signatures.</p>
        <div className="mt-10 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-xl border bg-[var(--surface)] p-6 line">
            <p className="mono text-[10px] text-[var(--faint)]">TOTAL EXECUTION</p>
            <p className="metric-value mt-5 text-5xl font-semibold tracking-[-.06em]">{total ? <AnimatedNumber value={total} suffix=" ms" /> : "Waiting"}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Results vary by browser, device, and workload.</p>
          </div>
          <div className="rounded-xl border bg-[var(--surface)] p-6 line">
            {(isEncryptMode
              ? [["Key generation", s.times.key, "Creates the post-quantum key pair"], ["Encryption", s.times.encrypt, "Seals the message with the public key"], ["Decryption", s.times.decrypt, "Recovers the message with the secret key"]]
              : [["Key generation", s.times.key, "Creates the ML-DSA signing key pair"], ["Signing", s.times.sign, "Produces the post-quantum signature"], ["Verification", s.times.verify, "Checks signature authenticity"]]
            ).map(([label, value, desc]) => (
              <div key={label as string} className="border-b py-4 first:pt-0 last:border-0 line">
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="mono text-xs text-[var(--accent)]">{ms(value as number | null)}</span>
                </div>
                <div className="mt-3 h-1 bg-[#283038]">
                  <div className="h-full bg-[var(--accent)]" style={{ width: value ? `${Math.max(5, ((value as number) / max) * 100)}%` : "0%" }} />
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Agent integration ─────────────────────────────────────────────── */}
      <section id="ai-agents" className="border-y bg-[#0f1215] py-24 line">
        <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="mono text-[10px] uppercase tracking-[.18em] text-[var(--accent)]">First-class AI integration</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">PQC operations as native AI tool calls.</h2>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                The SDK ships an MCP stdio server and LangChain/LangGraph tool wrappers. Secret keys never enter the model context: tools reference keys by keyId, the secret material stays in a keystore or your own vault, and signing is opt-in.
              </p>
              <div className="mt-8 space-y-4">
                <AgentCard
                  title="@pqc-sdk/mcp-server"
                  badge="MCP"
                  desc="Works with Claude Desktop, Cursor, Continue, and any MCP host. Secret keys live in an on-disk keystore (0600 files, 0700 dir); point PQC_KEYSTORE_DIR at a directory dedicated to the agent."
                  code={`npm install -g @pqc-sdk/mcp-server\n\n"pqc": {\n  "command": "pqc-mcp",\n  "env": { "PQC_KEYSTORE_DIR": "~/.local/share/my-agent/pqc-keys" }\n}\n# PQC_MCP_ENABLE_SIGN=1 exposes pqc_sign`}
                />
                <AgentCard
                  title="@pqc-sdk/langchain"
                  badge="LangChain"
                  desc="Structured tools for LangGraph agents, OpenAI tool-calling, and Anthropic tool-use. createPqcTools() wires keys through your own callbacks — the package performs no I/O."
                  code={`import { createPqcTools } from '@pqc-sdk/langchain';\n\nconst tools = createPqcTools({\n  resolveSecretKey: async (keyId) => vault.get(keyId),\n  onSecretKey: async (keyId, key) => vault.set(keyId, key),\n  // enableSign: true,\n});\nconst agent = createReactAgent({ llm, tools });`}
                />
              </div>
            </div>
            <div className="self-center">
              <MpcToolTable />
            </div>
          </div>
        </div>
      </section>

      {/* ── Install ──────────────────────────────────────────────────────────── */}
      <section id="install" className="border-b py-24 line">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 lg:grid-cols-[.75fr_1.25fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Install the SDK.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Building an app? Install <span className="mono text-xs">@pqc-sdk/core</span>. Want to work with files from the terminal? Add the CLI. Connecting an AI agent? Pick the AI agent tab.</p>
            <div className="mt-7 flex flex-wrap gap-5 text-sm text-[var(--accent)]">
              <a href="https://jeloercc.github.io/pqc-sdk/" target="_blank" rel="noreferrer">View Documentation</a>
              <a href="https://jeloercc.github.io/pqc-sdk/guide/quickstart" target="_blank" rel="noreferrer">Quick Start</a>
            </div>
          </div>
          <div>
            <div ref={installTabsRef} role="tablist" aria-label="Package manager" className="mb-3 flex gap-5 border-b line">
              {(["npm", "pnpm", "yarn", "mcp"] as const).map((tab, i) => (
                <button
                  key={tab}
                  id={`install-tab-${tab}`}
                  role="tab"
                  aria-selected={installTab === tab}
                  aria-controls={`install-panel-${tab}`}
                  tabIndex={installTab === tab ? 0 : -1}
                  data-install-tab={tab}
                  onClick={() => setInstallTab(tab)}
                  onKeyDown={(e) => handleInstallKeyDown(e, i)}
                  className={`pb-3 text-xs ${installTab === tab ? "border-b-2 border-[var(--accent)] text-[var(--text)]" : "text-[var(--muted)]"}`}
                >{tab === "mcp" ? "AI agent" : tab}</button>
              ))}
            </div>
            {installTab === "npm" && (
              <div id="install-panel-npm" role="tabpanel" aria-labelledby="install-tab-npm" className="space-y-2">
                <InstallBlock cmd="npm install @pqc-sdk/core" onCopy={copy} copiedText={copiedText} />
                <InstallBlock cmd="npm install @pqc-sdk/cli" onCopy={copy} copiedText={copiedText} label="CLI (optional)" />
              </div>
            )}
            {installTab === "pnpm" && (
              <div id="install-panel-pnpm" role="tabpanel" aria-labelledby="install-tab-pnpm" className="space-y-2">
                <InstallBlock cmd="pnpm add @pqc-sdk/core" onCopy={copy} copiedText={copiedText} />
                <InstallBlock cmd="pnpm add @pqc-sdk/cli" onCopy={copy} copiedText={copiedText} label="CLI (optional)" />
              </div>
            )}
            {installTab === "yarn" && (
              <div id="install-panel-yarn" role="tabpanel" aria-labelledby="install-tab-yarn" className="space-y-2">
                <InstallBlock cmd="yarn add @pqc-sdk/core" onCopy={copy} copiedText={copiedText} />
                <InstallBlock cmd="yarn add @pqc-sdk/cli" onCopy={copy} copiedText={copiedText} label="CLI (optional)" />
              </div>
            )}
            {installTab === "mcp" && (
              <div id="install-panel-mcp" role="tabpanel" aria-labelledby="install-tab-mcp" className="space-y-2">
                <InstallBlock cmd="npm install -g @pqc-sdk/mcp-server" onCopy={copy} copiedText={copiedText} label="MCP server (Claude, Cursor…)" />
                <InstallBlock cmd="npm install @pqc-sdk/langchain @pqc-sdk/core" onCopy={copy} copiedText={copiedText} label="LangChain / LangGraph" />
              </div>
            )}
          </div>
        </div>
      </section>

      <CliSection onCopy={copy} copiedText={copiedText} />

      {/* ── Packages table ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-28">
        <h2 className="text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Four packages. One purpose.</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">Each package has a single responsibility. Use only what you need.</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <PackageCard name="@pqc-sdk/core" badge="v0.11.3" desc="Encryption, signatures, key handling, streaming (incl. collectDecryptStream), typed PqcError codes. Node 20+, Deno, Cloudflare Workers, React Native." href="https://www.npmjs.com/package/@pqc-sdk/core" />
          <PackageCard name="@pqc-sdk/cli" badge="v0.11.3" desc="pqc init / keygen / encrypt / decrypt / audit — project scaffolding and file-level crypto via npx." href="https://www.npmjs.com/package/@pqc-sdk/cli" />
          <PackageCard name="@pqc-sdk/mcp-server" badge="v0.4.3" desc="stdio server with 7 PQC tools and an on-disk keystore. Keys are referenced by keyId; signing is off unless PQC_MCP_ENABLE_SIGN=1." href="https://www.npmjs.com/package/@pqc-sdk/mcp-server" />
          <PackageCard name="@pqc-sdk/langchain" badge="v0.3.3" desc="createPqcTools() factory: StructuredTool wrappers for LangGraph, OpenAI tool-calling, and Anthropic tool-use. Ships TypeScript declarations." href="https://www.npmjs.com/package/@pqc-sdk/langchain" />
        </div>
      </section>

      <RuntimeSection />

      {/* ── Why PQC ──────────────────────────────────────────────────────────── */}
      <section id="why-pqc" className="border-y bg-[#0f1215] py-24 line">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 lg:grid-cols-[1.2fr_.8fr] lg:px-8">
          <h2 className="max-w-[720px] text-4xl font-semibold leading-[1.05] tracking-[-.05em] sm:text-6xl">Encrypted traffic can be stored today and targeted later.</h2>
          <div className="self-end space-y-4">
            <p className="border-l-2 border-[var(--accent)] pl-5 text-sm leading-7 text-[var(--muted)]">A large enough quantum computer running Shor&apos;s algorithm would break RSA, ECDH and ECDSA, the public-key cryptography behind most of today&apos;s internet. That machine does not exist yet, but traffic recorded now can be decrypted once it does (&quot;harvest now, decrypt later&quot;). For data that must stay secret for years, the time to migrate is now. NIST published its first post-quantum standards in 2024:</p>
            <FipsTable />
            <p className="text-xs leading-5 text-[var(--faint)]">This SDK implements FIPS 203 and 204. SLH-DSA is left out on purpose: its signatures are 7.8 to 49.8 KB versus 3.3 KB for ML-DSA-65, and it is aimed at firmware and long-lived roots of trust rather than everyday request/response traffic.</p>
          </div>
        </div>
      </section>

      {/* ── FIPS conformance ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mono text-[10px] uppercase tracking-[.16em] text-[var(--accent)]">Self-assessment</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">FIPS 203 / 204 conformance.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Every requirement (&ldquo;shall&rdquo; clause) in FIPS 203 and FIPS 204 was checked against the code: 43 in total, each quoting the standard&apos;s exact text and citing a named test as evidence. Six were found NONCONFORMING, meaning the code broke a rule. The floating-point ones passed NIST test vectors the whole time, which is why vectors alone are not enough. All six were fixed. IDs read as standard + number: F203-19 is requirement 19 of FIPS 203.
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">An RNG failure during key generation, encapsulation or ML-DSA signing (since 0.11.0), or while drawing the AES-GCM nonce in encrypt (since 0.11.3), reports the dedicated <span className="mono text-xs">RBG_FAILURE</span> code instead of a raw host error.</p>
            <p className="mt-3 text-xs text-[var(--faint)]">This is self-assessment, not CMVP validation. ACVP vectors passing is assurance evidence, not proof of every clause.</p>
          </div>
          <div className="space-y-3">
            {[
              { id: "F203-19", desc: "Floating-point in Compress_d — replaced with integer-only bit-shift arithmetic." },
              { id: "F204-13", desc: "Floating-point in Decompose / Power2Round / HINT_M — verified over all 8M values of Z_q." },
              { id: "F203-18", desc: "Branch-based implicit-reject — replaced with byte-wise arithmetic mask." },
              { id: "F204-10", desc: "Missing zeroization on ML-DSA verify path — fixed with try/finally on all exit paths." },
              { id: "F203-11", desc: "RBG failure misattributed as INVALID_KEY — dedicated RBG_FAILURE error code." },
              { id: "F204-08", desc: "Wrong-length public key throws instead of returning false." },
            ].map(({ id, desc }) => (
              <div key={id} className="flex gap-3 rounded-lg border bg-[var(--surface)] p-4 line">
                <span className="mono shrink-0 text-[10px] text-[var(--success)]">CLOSED</span>
                <div>
                  <span className="mono text-xs text-[var(--accent)]">{id}</span>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <VerificationSection />
      <Glossary />

      {/* ── Built in the open ─────────────────────────────────────────────────── */}
      <section className="border-t bg-[var(--surface)] py-24 line">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Built in the open.</h2>
            <p className="mt-5 max-w-[500px] text-sm leading-6 text-[var(--muted)]">Explore the implementation and install the package from its primary sources.</p>
            <a href="https://github.com/jeloercc/pqc-sdk" target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#0b0d0f]">View on GitHub</a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="https://github.com/jeloercc/pqc-sdk/blob/main/LICENSE" target="_blank" rel="noreferrer" className="rounded-lg border p-4 line"><span className="block text-sm">MIT License</span><span className="mono mt-2 block text-[10px] text-[var(--muted)]">License</span></a>
            <a href="https://jeloercc.github.io/pqc-sdk/guide/quickstart" target="_blank" rel="noreferrer" className="rounded-lg border p-4 line"><span className="block text-sm">Documentation</span><span className="mono mt-2 block text-[10px] text-[var(--muted)]">Quick start</span></a>
            <a href="https://jeloercc.github.io/pqc-sdk/api/" target="_blank" rel="noreferrer" className="rounded-lg border p-4 line"><span className="block text-sm">API Reference</span><span className="mono mt-2 block text-[10px] text-[var(--muted)]">API</span></a>
            <a href="https://www.npmjs.com/package/@pqc-sdk/core" target="_blank" rel="noreferrer" className="rounded-lg border p-4 line"><span className="block text-sm">npm package</span><span className="mono mt-2 block text-[10px] text-[var(--muted)]">@pqc-sdk/core</span></a>
            <a href="https://github.com/jeloercc/pqc-sdk/blob/main/docs/AUDIT-2026-09.md" target="_blank" rel="noreferrer" className="rounded-lg border p-4 line"><span className="block text-sm">Security Review</span><span className="mono mt-2 block text-[10px] text-[var(--muted)]">AUDIT-2026-09</span></a>
            <a href="https://github.com/jeloercc/pqc-sdk/blob/main/docs/security/THREAT-MODEL.md" target="_blank" rel="noreferrer" className="rounded-lg border p-4 line"><span className="block text-sm">Threat Model</span><span className="mono mt-2 block text-[10px] text-[var(--muted)]">Audit scope</span></a>
            <a href="https://github.com/jeloercc/pqc-sdk/blob/main/packages/core/CHANGELOG.md" target="_blank" rel="noreferrer" className="rounded-lg border p-4 line"><span className="block text-sm">Changelog</span><span className="mono mt-2 block text-[10px] text-[var(--muted)]">@pqc-sdk/core</span></a>
            <a href="https://github.com/jeloercc/pqc-sdk/tree/main/MPC" target="_blank" rel="noreferrer" className="rounded-lg border p-4 line"><span className="block text-sm">A2A Protocol</span><span className="mono mt-2 block text-[10px] text-[var(--muted)]">Spec: PQC-secured channel between two AI agents</span></a>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-8 text-xs text-[var(--faint)] sm:flex-row sm:justify-between lg:px-8">
        <span className="mono">PQC SDK / Open source post-quantum cryptography</span>
        <span>MIT License. Keys stay in memory and leave with the session.</span>
      </footer>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CryptoViz({ phase, mode, verified, sHasPair, sHasCipher, times }: { phase: Phase; mode: Mode; verified: boolean; sHasPair: boolean; sHasCipher: boolean; times: State["times"] }) {
  const state = verified ? "trust" : phase === "generating" ? "commitment" : (phase === "encrypting" || phase === "signing") ? "challenge" : (phase === "decrypting" || phase === "verifying") ? "response" : sHasCipher ? "challenge" : sHasPair ? "commitment" : "entropy";
  const cells = Array.from({ length: 96 }, (_, index) => { const row = Math.floor(index / 16); const col = index % 16; const edge = row === 1 || row === 6 || col === 1 || col === 14; const core = (row >= 2 && row <= 5 && col >= 4 && col <= 11); const diagonal = (row === col - 2 || row === 7 - col); return <span key={index} className={`crypto-pixel crypto-${state} ${edge ? "crypto-edge" : ""} ${core ? "crypto-core" : ""} ${diagonal ? "crypto-diagonal" : ""}`} style={{ "--i": index, "--row": row, "--col": col, "--phase-delay": `${(index % 12) * 55}ms` } as React.CSSProperties} />; });
  // Real operation steps; `state` only drives the CSS animation.
  const steps = mode === "sign" ? ["KEY PAIR", "SIGN", "VERIFY", "VALID"] : ["KEY PAIR", "ENCAPSULATE + SEAL", "DECAPSULATE + OPEN", "MATCH"];
  const stepCount = { entropy: 0, commitment: 1, challenge: 2, response: 3, trust: 4 }[state];
  const labels = stepCount === 0 ? ["READY"] : steps.slice(0, stepCount);
  const stateLabel = { entropy: "IDLE", commitment: "KEYS READY", challenge: mode === "sign" ? "SIGNED" : "SEALED", response: mode === "sign" ? "VERIFYING" : "OPENING", trust: mode === "sign" ? "VALID" : "VERIFIED" }[state];
  const operation =
    phase === "generating" ? { label: "Generate keys", description: "Creating a post-quantum key pair", time: times.key } :
    phase === "encrypting" ? { label: "Encrypt message", description: "Sealing the message with the public key", time: times.encrypt } :
    phase === "decrypting" ? { label: "Decrypt message", description: "Recovering plaintext with the secret key", time: times.decrypt } :
    phase === "signing" ? { label: "Sign message", description: "Producing the ML-DSA signature", time: times.sign } :
    phase === "verifying" ? { label: "Verify signature", description: "Checking signature authenticity", time: times.verify } :
    verified ? { label: mode === "sign" ? "Signature verified" : "Verification complete", description: mode === "sign" ? "Signature is authentic and untampered" : "Plaintext matches the original message", time: mode === "sign" ? times.verify : times.decrypt } :
    sHasCipher ? { label: mode === "sign" ? "Signature ready" : "Ciphertext ready", description: mode === "sign" ? "Signature bytes are ready to verify" : "Encrypted bytes are ready to decrypt", time: mode === "sign" ? times.sign : times.encrypt } :
    sHasPair ? { label: "Key pair ready", description: "Public and secret keys are available", time: times.key } :
    { label: "Waiting for input", description: "Press \u201cRun complete\u201d on the left, or go step by step", time: null };
  const execution = phase !== "idle" ? "Running" : verified ? "Complete" : sHasCipher ? "Ready" : sHasPair ? "Ready" : "Idle";
  return (
    <div className={`crypto-visual crypto-state-${state}`} aria-describedby="crypto-execution-live">
      <div className="crypto-visual-head"><span className="mono">OPERATION FLOW</span><span className="mono">{stateLabel}</span></div>
      <div className="crypto-stage" aria-hidden="true">
        <div className="crypto-path crypto-path-a" /><div className="crypto-path crypto-path-b" /><div className="crypto-path crypto-path-c" />
        <div className="crypto-node crypto-node-a" /><div className="crypto-node crypto-node-b" /><div className="crypto-node crypto-node-c" />
        <div className="crypto-lattice">{cells}</div>
      </div>
      <div className="crypto-transcript" aria-label="Operation steps">{labels.map((label, index) => <span key={label} className={index < labels.length - 1 ? "transcript-done" : "transcript-current"}>{label}</span>)}</div>
      <div className="crypto-observation">
        <div>
          <span className="mono text-[10px] text-[var(--faint)]">ACTIVE OPERATION</span>
          <strong>{operation.label}</strong>
          <span>{operation.description}</span>
        </div>
        <div className="crypto-observation-meta">
          <span className="mono text-[10px] text-[var(--faint)]">ELAPSED</span>
          <strong>{ms(operation.time)}</strong>
          <span className={`mono text-[10px] ${verified ? "text-[var(--success)]" : "text-[var(--accent)]"}`}>{execution.toUpperCase()}</span>
        </div>
      </div>
      <div id="crypto-execution-live" className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Operation steps: {labels.join(", ")}. Active operation: {operation.label}. {operation.description}. Execution state: {execution}. Elapsed time: {ms(operation.time)}.
      </div>
    </div>
  );
}

const navLinks = [
  ["#demo", "Demo"],
  ["#how-it-works", "How it works"],
  ["#ai-agents", "AI Agents"],
  ["#cli", "CLI"],
  ["#install", "Install"],
  ["#verification", "Security"],
  ["#glossary", "Glossary"],
] as const;

function Header() {
  return (
    <div className="site-header-bar sticky top-0 z-50 border-b line">
      <header className="site-header mx-auto flex min-h-[64px] max-w-[1240px] flex-wrap items-center justify-between gap-x-3 px-5 lg:px-8">
        <a href="#" className="flex min-h-[44px] items-center gap-3 text-sm font-semibold">
          <span className="mono text-[var(--accent)]">[pqc]</span>PQC SDK
        </a>
        <nav className="hidden gap-7 text-sm text-[var(--muted)] lg:flex" aria-label="Sections">
          {navLinks.map(([href, label]) => <a key={href} href={href} className="hover:text-[var(--text)]">{label}</a>)}
          <a href="https://github.com/jeloercc/pqc-sdk" target="_blank" rel="noreferrer" className="hover:text-[var(--text)]">GitHub</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="https://github.com/jeloercc/pqc-sdk" target="_blank" rel="noreferrer" className="flex min-h-[40px] items-center rounded-lg border px-3 text-xs text-[var(--muted)] line lg:hidden">GitHub</a>
          <a href="#demo" className="flex min-h-[40px] items-center rounded-lg border px-3 text-xs text-[var(--accent)] line">Run the Demo</a>
        </div>
        <nav className="mobile-navigation lg:hidden" aria-label="Sections">
          {navLinks.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </nav>
      </header>
    </div>
  );
}

function TrustPanel() {
  return (
    <section className="border-b py-6 line">
      <div className="mx-auto grid max-w-[1240px] gap-4 px-5 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <a href="https://github.com/jeloercc/pqc-sdk" target="_blank" rel="noreferrer" className="border-l pl-4 text-sm line">
          <span className="block font-medium">Open Source</span><span className="mt-1 block text-xs text-[var(--muted)]">MIT License</span>
        </a>
        <a href="https://jeloercc.github.io/pqc-sdk/" target="_blank" rel="noreferrer" className="border-l pl-4 text-sm line">
          <span className="block font-medium">Browser Native</span><span className="mt-1 block text-xs text-[var(--muted)]">No server required</span>
        </a>
        <a href="https://github.com/jeloercc/pqc-sdk/tree/main/packages/mcp-server" target="_blank" rel="noreferrer" className="border-l pl-4 text-sm line">
          <span className="block font-medium">MCP + LangChain</span><span className="mt-1 block text-xs text-[var(--muted)]">AI agent tools</span>
        </a>
        <a href="https://github.com/jeloercc/pqc-sdk/tree/main/docs/compliance" target="_blank" rel="noreferrer" className="border-l pl-4 text-sm line">
          <span className="block font-medium">FIPS 203 / 204</span><span className="mt-1 block text-xs text-[var(--muted)]">Self-assessed</span>
        </a>
        <a href="https://github.com/jeloercc/pqc-sdk/tree/main/docs/security" target="_blank" rel="noreferrer" className="border-l pl-4 text-sm line">
          <span className="block font-medium">NIST ACVP vectors</span><span className="mt-1 block text-xs text-[var(--muted)]">+ CIRCL interop, threat model</span>
        </a>
      </div>
    </section>
  );
}

function Playground({ s, busy, generate, encrypt, decrypt, sign, verifySignature, runComplete, onMessage, onMode, onAlgorithm }: {
  s: State; busy: boolean;
  generate: () => void; encrypt: () => void; decrypt: () => void;
  sign: () => void; verifySignature: () => void;
  runComplete: () => void;
  onMessage: (v: string) => void;
  onMode: (v: Mode) => void;
  onAlgorithm: (v: DemoAlgorithm) => void;
}) {
  const isEncrypt = s.mode === "encrypt";
  const isSign = s.mode === "sign";
  const succeedState = isEncrypt ? s.verified : s.signatureValid === true;
  const kemAlgorithms: { value: KemAlgorithm; label: string; detail: string }[] = [
    { value: "x-wing", label: "X-Wing", detail: "Hybrid default · CFRG draft" },
    { value: "ml-kem-512", label: "ML-KEM-512", detail: "FIPS 203 cat.1" },
    { value: "ml-kem-768", label: "ML-KEM-768", detail: "FIPS 203 cat.3" },
    { value: "ml-kem-1024", label: "ML-KEM-1024", detail: "FIPS 203 cat.5" },
  ];
  const dsaAlgorithms: { value: SignatureAlgorithm; label: string; detail: string }[] = [
    { value: "ml-dsa-44", label: "ML-DSA-44", detail: "FIPS 204 cat.2 · not default" },
    { value: "ml-dsa-65", label: "ML-DSA-65", detail: "FIPS 204 cat.3 · recommended" },
    { value: "ml-dsa-87", label: "ML-DSA-87", detail: "FIPS 204 cat.5" },
  ];

  return (
    <div aria-busy={busy} className="workspace-playground">
      <div className="flex justify-between border-b pb-4 line">
        <span className="mono text-[10px] text-[var(--faint)]">pqc playground</span>
        <span role="status" aria-live="polite" className={`mono text-[10px] ${succeedState ? "text-[var(--success)]" : "text-[var(--accent)]"}`}>
          {busy ? s.phase.toUpperCase() : succeedState ? (isEncrypt ? "VERIFIED" : "VALID") : "READY"}
        </span>
      </div>

      {/* Mode toggle */}
      <div className="mt-5 flex gap-1 rounded-lg border p-1 line">
        <button
          type="button"
          aria-pressed={isEncrypt}
          disabled={busy}
          onClick={() => onMode("encrypt")}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${isEncrypt ? "bg-[var(--accent)] text-[#0b0d0f]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
        >Encrypt / Decrypt</button>
        <button
          type="button"
          aria-pressed={isSign}
          disabled={busy}
          onClick={() => onMode("sign")}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${isSign ? "bg-[var(--accent)] text-[#0b0d0f]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
        >Sign / Verify</button>
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        {isEncrypt
          ? "Encryption keeps a message secret: anyone with the public key can lock it, only the secret key can open it."
          : "A signature proves who wrote a message and that nobody changed it: only the secret key can sign, anyone with the public key can check."}
      </p>

      <label className="mt-5 block text-[12px] text-[var(--muted)]" htmlFor="hero-message">Message</label>
      <textarea
        id="hero-message"
        maxLength={2000}
        value={s.message}
        disabled={busy}
        onChange={(e) => onMessage(e.target.value)}
        className="mt-3 min-h-[92px] w-full resize-y rounded-lg border bg-[#0d1012] p-3 text-sm leading-6 outline-none line focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      />

      {/* Algorithm selection */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(isEncrypt ? kemAlgorithms : dsaAlgorithms).map(({ value, label, detail }) => (
          <Algo key={value} active={s.algorithm === value} onClick={() => onAlgorithm(value)} title={label} detail={detail} disabled={busy} />
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[var(--muted)]" aria-live="polite">{algorithmInfo[s.algorithm]}</p>

      <button
        onClick={runComplete}
        disabled={busy}
        className="mt-4 w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[#0b0d0f] transition-colors hover:bg-white active:scale-[.98] disabled:cursor-wait disabled:opacity-60"
      >{busy ? "Processing..." : `Run complete ${isEncrypt ? "encryption" : "signing"} demo`}</button>

      {/* Step-by-step controls */}
      <div className="mt-4 space-y-3">
        <Mini title="Generate Keys" operation="generating" active={s.phase === "generating"} time={s.times.key} done={!!s.pair} run={generate} disabled={busy} />
        {isEncrypt ? (
          <>
            <Mini title="Encrypt Message" operation="encrypting" active={s.phase === "encrypting"} time={s.times.encrypt} done={!!s.ciphertext} run={encrypt} disabled={busy || !s.pair} />
            <Mini title="Decrypt Message" operation="decrypting" active={s.phase === "decrypting"} time={s.times.decrypt} done={s.verified} run={decrypt} disabled={busy || !s.ciphertext} />
          </>
        ) : (
          <>
            <Mini title="Sign Message" operation="signing" active={s.phase === "signing"} time={s.times.sign} done={!!s.signature} run={sign} disabled={busy || !s.pair} />
            <Mini title="Verify Signature" operation="verifying" active={s.phase === "verifying"} time={s.times.verify} done={s.signatureValid === true} run={verifySignature} disabled={busy || !s.signature} />
          </>
        )}
      </div>

      {s.error && (
        <p role="alert" className="mt-4 rounded-lg border border-[var(--danger)] bg-[rgba(242,148,148,.06)] px-4 py-3 text-xs text-[var(--danger)]">{s.error}</p>
      )}

      {succeedState && (
        <div className="success-pop mt-5 rounded-lg border border-[rgba(139,214,174,.32)] bg-[rgba(139,214,174,.08)] px-4 py-4">
          <p className="text-sm font-semibold text-[var(--success)]">{isEncrypt ? "✓ Messages match — round trip verified." : "✓ Signature valid — authentication confirmed."}</p>
          <div className="result-metrics mt-3 grid gap-3 pt-3 sm:grid-cols-3">
            <Metric label="Key generation" value={s.times.key} />
            {isEncrypt ? <><Metric label="Encryption" value={s.times.encrypt} /><Metric label="Decryption" value={s.times.decrypt} /></> : <><Metric label="Signing" value={s.times.sign} /><Metric label="Verification" value={s.times.verify} /></>}
          </div>
        </div>
      )}

      <ExecutionDetails s={s} />
    </div>
  );
}

function Mini({ title, operation, time, active, done, run, disabled }: { title: string; operation: Phase; time: number | null; active: boolean; done: boolean; run: () => void; disabled: boolean }) {
  const verbMap: Record<string, [string, string, string]> = {
    generating: ["Generate", "Generating", "Generated"],
    encrypting: ["Encrypt", "Encrypting", "Encrypted"],
    decrypting: ["Decrypt", "Decrypting", "Decrypted"],
    signing: ["Sign", "Signing", "Signed"],
    verifying: ["Verify", "Verifying", "Verified"],
  };
  const [verb, present, past] = verbMap[operation] ?? ["Run", "Running", "Done"];
  return (
    <div className={`operation-row flex items-center gap-3 rounded-lg border p-4 line ${done ? "operation-done" : ""}`}>
      <span className={`mono text-[10px] ${done ? "text-[var(--success)]" : active ? "text-[var(--accent)]" : "text-[var(--faint)]"}`}>{done ? "OK" : active ? "..." : "--"}</span>
      <span className="flex-1 text-sm">
        <span className="block">{active ? `${present}...` : title}</span>
        {done && <span className="mono mt-1 block text-[10px] text-[var(--success)]">{past} in {ms(time)}</span>}
      </span>
      <button onClick={run} disabled={disabled} className="rounded-md border px-3 py-2 text-xs transition-colors hover:border-[var(--accent)] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40">{done ? "Run again" : verb}</button>
    </div>
  );
}

function Algo({ active, onClick, title, detail, disabled }: { active: boolean; onClick: () => void; title: string; detail: string; disabled: boolean }) {
  return (
    <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick} className={`rounded-lg border p-3 text-left line disabled:cursor-not-allowed disabled:opacity-60 ${active ? "border-[var(--accent)] bg-[#78b8ff12]" : ""}`}>
      <span className="block text-xs">{title}</span>
      <span className="mono mt-1 block text-[10px] text-[var(--muted)]">{detail}</span>
    </button>
  );
}

function InstallBlock({ cmd, onCopy, copiedText, label }: { cmd: string; onCopy: (text: string) => void; copiedText: string | null; label?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-[#0b0d0f] line">
      {label && <div className="border-b px-4 py-2 text-[10px] text-[var(--faint)] line">{label}</div>}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <code className="mono text-sm text-[#c5d0da]">{cmd}</code>
        <button onClick={() => onCopy(cmd)} className="mono shrink-0 text-[11px] text-[var(--accent)]">{copiedText === cmd ? "Copied" : "Copy"}</button>
      </div>
    </div>
  );
}

function PackageCard({ name, badge, desc, href }: { name: string; badge: string; desc: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group rounded-lg border bg-[var(--surface)] p-5 line block transition-colors hover:border-[var(--accent)]">
      <div className="flex items-start justify-between gap-2">
        <span className="mono text-sm text-[var(--text)]">{name}</span>
        <span className="mono rounded border px-2 py-0.5 text-[9px] text-[var(--accent)] line">{badge}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{desc}</p>
    </a>
  );
}

function AgentCard({ title, badge, desc, code }: { title: string; badge: string; desc: string; code: string }) {
  return (
    <div className="rounded-lg border bg-[rgba(255,255,255,.03)] p-4 line">
      <div className="flex items-center gap-3">
        <span className="mono text-sm text-[var(--text)]">{title}</span>
        <span className="mono rounded border px-2 py-0.5 text-[9px] text-[var(--accent)] line">{badge}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{desc}</p>
      <pre className="mt-3 overflow-x-auto rounded border bg-[#0b0d0f] p-3 text-[10px] leading-5 text-[#a8b8c0] line"><code>{code}</code></pre>
    </div>
  );
}

function MpcToolTable() {
  const tools = [
    { tool: "pqc_algorithms", input: "(none)", output: "supported, fips" },
    { tool: "pqc_keygen", input: "algorithm? (x-wing)", output: "keyId, algorithm, publicToken" },
    { tool: "pqc_list_keys", input: "(none) · MCP only", output: "keys[]" },
    { tool: "pqc_encrypt", input: "publicToken, plaintext | plaintextBase64", output: "ciphertextHex" },
    { tool: "pqc_decrypt", input: "keyId, ciphertextHex", output: "plaintext | plaintextBase64" },
    { tool: "pqc_sign", input: "keyId, message · opt-in", output: "signatureHex" },
    { tool: "pqc_verify", input: "message, signatureHex, publicToken", output: "verified" },
  ];
  return (
    <div className="overflow-hidden rounded-lg border bg-[rgba(255,255,255,.025)] line">
      <div className="border-b px-4 py-3 line">
        <span className="mono text-[10px] text-[var(--faint)]">MCP / LangChain tool inventory · no secret key ever returned to the model</span>
      </div>
      <div className="divide-y divide-[rgba(237,241,244,.08)]">
        {tools.map(({ tool, input, output }) => (
          <div key={tool} className="grid gap-1 px-4 py-3 text-[11px] sm:grid-cols-[1fr_1fr_1fr] sm:gap-2">
            <span className="mono text-[var(--accent)]">{tool}</span>
            <span className="text-[var(--muted)]"><span className="mono text-[var(--faint)] sm:hidden">in · </span>{input}</span>
            <span className="mono text-[var(--faint)]"><span className="sm:hidden">out · </span>{output}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FipsTable() {
  return (
    <div className="overflow-hidden rounded-lg border line">
      {[
        { std: "FIPS 203", alg: "ML-KEM", replaces: "RSA / ECDH" },
        { std: "FIPS 204", alg: "ML-DSA", replaces: "ECDSA / RSA-sig" },
        { std: "FIPS 205", alg: "SLH-DSA", replaces: "Not in this SDK (by design)" },
      ].map(({ std, alg, replaces }) => (
        <div key={std} className="grid grid-cols-3 gap-2 border-b px-4 py-3 text-xs last:border-0 line">
          <span className="mono text-[var(--accent)]">{std}</span>
          <span>{alg}</span>
          <span className="text-[var(--muted)]">{replaces}</span>
        </div>
      ))}
    </div>
  );
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplay(value); return; }
    const start = performance.now(); const duration = 500; let frame = 0;
    const tick = (now: number) => { const progress = Math.min((now - start) / duration, 1); setDisplay(value * progress); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display.toFixed(1)}{suffix}</>;
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="mono text-[10px] text-[var(--faint)]">{label}</p>
      <p className="metric-value mt-2 text-xs">{value === null ? "Waiting" : <AnimatedNumber value={value} suffix=" ms" />}</p>
    </div>
  );
}

function ExecutionDetails({ s }: { s: State }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [artifactsOpen, setArtifactsOpen] = useState(false);
  const isEncrypt = s.mode === "encrypt";
  const succeedState = isEncrypt ? s.verified : s.signatureValid === true;
  useEffect(() => { if (succeedState) { setDetailsOpen(true); setArtifactsOpen(true); } }, [succeedState]);
  if (!s.pair) return null;
  return (
    <>
      <details open={detailsOpen} onToggle={(e) => setDetailsOpen(e.currentTarget.open)} className="details-panel mt-4 rounded-lg border line">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">Execution details <span className="mono float-right text-[10px] text-[var(--faint)]">metadata only</span></summary>
        <div className="grid gap-x-5 gap-y-4 border-t px-4 py-4 sm:grid-cols-2 line">
          <Detail label="Mode" value={isEncrypt ? "Encryption" : "Signatures"} />
          <Detail label="Algorithm" value={s.algorithm} />
          <Detail label="Standard" value={s.algorithm === "x-wing" ? "CFRG draft (hybrid, not FIPS)" : s.algorithm.startsWith("ml-kem") ? "NIST FIPS 203" : "NIST FIPS 204"} />
          <Detail label="Public key size" value={`${s.pair.publicKey.bytes.byteLength} bytes`} />
          <Detail label="Secret key size" value={`${s.pair.secretKey.bytes.byteLength} bytes`} />
          {isEncrypt && s.ciphertext && <Detail label="Ciphertext size" value={`${s.ciphertext.byteLength} bytes`} />}
          {isEncrypt && <Detail label="Plaintext size" value={s.plaintextSize === null ? "Waiting" : `${s.plaintextSize} bytes`} />}
          {isEncrypt && <Detail label="Verification status" value={s.verified ? "Messages match" : "Not verified"} success={s.verified} />}
          {!isEncrypt && s.signature && <Detail label="Signature size" value={`${s.signature.byteLength} bytes`} />}
          <p className="text-[10px] leading-5 text-[var(--faint)] sm:col-span-2">Post-quantum keys and {isEncrypt ? "ciphertexts" : "signatures"} are larger than classical ones: for comparison, an X25519 public key is 32 bytes and an Ed25519 signature 64 bytes. That size is the price of quantum resistance.</p>
          {!isEncrypt && <Detail label="Signature status" value={s.signatureValid === null ? "Waiting" : s.signatureValid ? "Valid" : "Invalid"} success={s.signatureValid === true} />}
        </div>
      </details>
      {(s.ciphertext || s.signature) && (
        <details open={artifactsOpen} onToggle={(e) => setArtifactsOpen(e.currentTarget.open)} className="details-panel mt-3 rounded-lg border line">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">Cryptographic artifacts <span className="mono float-right text-[10px] text-[var(--faint)]">previews only</span></summary>
          <div className="space-y-4 border-t px-4 py-4 line">
            {isEncrypt && s.ciphertext && <Detail label="Ciphertext preview" value={hexPreview(s.ciphertext)} />}
            {isEncrypt && <Detail label="Plaintext preview" value={s.plaintext ? preview(s.plaintext) : "Waiting"} />}
            {isEncrypt && <Detail label="Verification result" value={s.verified ? "✓ Messages Match" : "Not verified"} success={s.verified} />}
            {!isEncrypt && s.signature && <Detail label="Signature preview" value={hexPreview(s.signature)} />}
            {!isEncrypt && <Detail label="Verification result" value={s.signatureValid === true ? "✓ Signature Valid" : s.signatureValid === false ? "✗ Invalid" : "Not verified"} success={s.signatureValid === true} />}
          </div>
        </details>
      )}
      <Trace events={s.trace} />
    </>
  );
}

function Detail({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="mono text-[10px] text-[var(--faint)]">{label}</p>
      <p className={`mt-1 truncate text-xs ${success ? "text-[var(--success)]" : ""}`}>{value}</p>
    </div>
  );
}

function Trace({ events }: { events: TraceEvent[] }) {
  return (
    <div className="trace-panel mt-4 border-t pt-4 line">
      <div className="mb-3 flex items-center justify-between">
        <span className="mono text-[10px] uppercase tracking-[.15em] text-[var(--muted)]">Execution trace</span>
        <span className="mono text-[10px] text-[var(--faint)]">{events.length} events</span>
      </div>
      <div className="space-y-3">
        {events.map((event, index) => (
          <div key={`${event.label}-${index}`} className="trace-event flex gap-3">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${event.tone === "success" ? "bg-[var(--success)]" : "bg-[var(--accent)]"}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap justify-between gap-x-3 text-xs">
                <span>{event.label}</span>
                <span className="mono text-[10px] text-[var(--accent)]">[{event.time.toFixed(1)} ms]</span>
              </div>
              <p className="mt-1 text-[10px] text-[var(--muted)]">{event.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Maps the stable PqcError codes (@pqc-sdk/core 0.11+) to user-facing messages.
// Duck-typed on `name`/`code` so the SDK stays a lazy dynamic import.
const errorMessages: Partial<Record<PqcErrorCode, string>> = {
  RBG_FAILURE: "This browser's secure random generator failed. Try a current browser and run again.",
  DECRYPTION_FAILED: "Decryption failed: the ciphertext was tampered with or the key does not match.",
  INVALID_CIPHERTEXT: "The ciphertext is malformed or truncated.",
  INVALID_KEY: "The key is malformed. Generate a new key pair and try again.",
  WRONG_ALGORITHM: "The key was generated for a different algorithm.",
  WRONG_KEY_USE: "That key cannot be used for this operation.",
  UNSUPPORTED_ALGORITHM: "This algorithm is not supported by the installed SDK version.",
};
function describeError(err: unknown, fallback: string) {
  if (err && typeof err === "object" && (err as { name?: unknown }).name === "PqcError") {
    const code = (err as { code?: PqcErrorCode }).code;
    if (code && errorMessages[code]) return `${errorMessages[code]} [${code}]`;
  }
  return fallback;
}

function preview(value: string) { const compact = value.replace(/\s+/g, " ").trim(); return compact.length > 48 ? `${compact.slice(0, 48)}…` : compact; }
function hex(value: Uint8Array) { return Array.from(value).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function hexPreview(value: Uint8Array) { return `${hex(value).slice(0, 36)}...`; }
