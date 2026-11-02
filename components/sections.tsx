// Explanatory sections for visitors who are new to post-quantum cryptography.
// Every claim here mirrors the pqc-sdk repository (README, docs/compatibility.md,
// docs/serialization-format.md, package READMEs). Update both together.

const REPO = "https://github.com/jeloercc/pqc-sdk";

function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="max-w-[760px]">
      <p className="mono text-[10px] uppercase tracking-[.18em] text-[var(--accent)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{intro}</p>}
    </div>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
export function HowItWorks() {
  const encryptSteps = [
    { n: "1", title: "Key pair", body: "pqc.keys.generate() creates a public key you can share and a secret key you keep. X-Wing is the default." },
    { n: "2", title: "Encapsulate", body: "With the recipient's public key, the KEM (key encapsulation mechanism) produces a fresh 32-byte shared secret plus a small capsule that only the secret key can open." },
    { n: "3", title: "Seal", body: "That shared secret is the AES-256-GCM key. The message is encrypted and authenticated; capsule + nonce + sealed payload travel together as one envelope." },
    { n: "4", title: "Open", body: "pqc.decrypt() recovers the shared secret from the capsule and opens the payload. Any tampered byte fails with DECRYPTION_FAILED instead of returning garbage." },
  ];
  const signSteps = [
    { n: "1", title: "Signing key", body: "pqc.keys.generate({ algorithm: 'ml-dsa-65' }) creates a signing key pair." },
    { n: "2", title: "Sign", body: "pqc.sign() produces a signature over the exact message bytes. Signing is hedged: fresh randomness every time." },
    { n: "3", title: "Verify", body: "Anyone with the public key runs pqc.verify(). It returns true only if the message is unchanged and was signed by that key." },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-28">
      <SectionHead
        eyebrow="How it works"
        title="What the playground just did."
        intro="Encryption keeps a message secret. A signature proves who wrote it and that nobody changed it. They solve different problems, so the SDK has one family of algorithms for each."
      />
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-[var(--surface)] p-6 line">
          <p className="mono text-[10px] text-[var(--faint)]">ENCRYPT / DECRYPT · ML-KEM or X-Wing + AES-256-GCM</p>
          <ol className="mt-5 space-y-5">
            {encryptSteps.map((s) => <Step key={s.n} {...s} />)}
          </ol>
        </div>
        <div className="rounded-xl border bg-[var(--surface)] p-6 line">
          <p className="mono text-[10px] text-[var(--faint)]">SIGN / VERIFY · ML-DSA</p>
          <ol className="mt-5 space-y-5">
            {signSteps.map((s) => <Step key={s.n} {...s} />)}
          </ol>
          <div className="mt-6 border-t pt-5 line">
            <p className="text-sm font-medium">Why is X-Wing the default?</p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              X-Wing combines the classical X25519 key exchange with post-quantum ML-KEM-768. An attacker has to break both, so a flaw found in either one still leaves the other standing. This is the same reasoning behind TLS X25519MLKEM768 and Signal&apos;s PQXDH. X-Wing is specified in an IETF CFRG draft, not a NIST standard. Pick ml-kem-768 when you need a pure FIPS 203 algorithm.
            </p>
          </div>
        </div>
      </div>
      <Architecture />
    </section>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] text-[var(--accent)] line">{n}</span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{body}</p>
      </div>
    </li>
  );
}

function Architecture() {
  const layers = [
    { tag: "AI agents", items: [["@pqc-sdk/mcp-server", "Claude Desktop, Cursor, Continue, any MCP host"], ["@pqc-sdk/langchain", "LangGraph, OpenAI tool-calling, Anthropic tool-use"]] },
    { tag: "Core library", items: [["@pqc-sdk/core", "keys · encrypt / decrypt · sign / verify · streaming · typed errors"]] },
    { tag: "Primitives", items: [["@noble/post-quantum 0.7.1", "vendored, with documented FIPS 203/204 corrections"], ["@noble/ciphers", "AES-256-GCM, used as published"]] },
    { tag: "Command line", items: [["@pqc-sdk/cli", "init · keygen · encrypt · decrypt · audit"]] },
  ];
  return (
    <div className="mt-10 rounded-xl border p-6 line">
      <p className="mono text-[10px] text-[var(--faint)]">ARCHITECTURE · each layer only calls the one below it</p>
      <div className="mt-5 space-y-3">
        {layers.map((layer) => (
          <div key={layer.tag} className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <span className="mono pt-3 text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">{layer.tag}</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {layer.items.map(([name, desc]) => (
                <div key={name} className="rounded-lg border bg-[var(--surface)] px-4 py-3 line">
                  <span className="mono block text-xs text-[var(--text)]">{name}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-[var(--muted)]">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-[var(--faint)]">
        The SDK does not implement cryptographic primitives from scratch. The risk it carries is in its corrections to the vendored code and in the layer around the primitives: envelope format, key serialization, nonce handling and fail-closed parsing.
      </p>
    </div>
  );
}

// ── CLI ───────────────────────────────────────────────────────────────────────
export function CliSection({ onCopy }: { onCopy: (text: string) => void }) {
  const commands = [
    { cmd: "npx @pqc-sdk/cli init", desc: "Sets up a project in seconds: config file, development keys, .gitignore entries and a working example.ts." },
    { cmd: "npx @pqc-sdk/cli keygen --algorithm ml-dsa-65 --out keys/", desc: "Generates a key pair and writes it as base64url files (secret key file is 0600)." },
    { cmd: "npx @pqc-sdk/cli encrypt report.pdf --key keys/alice.public.pqc", desc: "Seals a file with ML-KEM-768 + AES-256-GCM into report.pdf.enc, the same envelope pqc.encrypt produces. Files over 8 MiB stream automatically with bounded memory." },
    { cmd: "npx @pqc-sdk/cli decrypt report.pdf.enc --key keys/alice.secret.pqc", desc: "Opens it with the matching secret key. Corrupted or mismatched input is refused instead of written out, and the plaintext is saved readable only by you (0600)." },
    { cmd: "npx @pqc-sdk/cli audit", desc: "Heuristic scan of your dependencies and source for pre-quantum crypto (RSA, ECDSA, ECDH) and what to migrate it to. A starting point for a migration review, not a substitute for one. Exits 1 on findings, so it works as a CI gate." },
  ];
  return (
    <section id="cli" className="border-y bg-[#0f1215] py-24 line">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 lg:grid-cols-[.75fr_1.25fr] lg:px-8">
        <SectionHead
          eyebrow="@pqc-sdk/cli"
          title="Use it from the terminal."
          intro="No code needed to try it. The CLI bootstraps projects, encrypts files and points out where your code still relies on algorithms a quantum computer could break."
        />
        <div className="space-y-3">
          {commands.map(({ cmd, desc }) => (
            <div key={cmd} className="overflow-hidden rounded-lg border bg-[#0b0d0f] line">
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3 line">
                <code className="mono overflow-x-auto whitespace-nowrap text-xs text-[#c5d0da]">{cmd}</code>
                <button onClick={() => onCopy(cmd)} className="mono shrink-0 text-[11px] text-[var(--accent)]">Copy</button>
              </div>
              <p className="px-4 py-3 text-xs leading-5 text-[var(--muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Runtimes ──────────────────────────────────────────────────────────────────
export function RuntimeSection() {
  const runtimes = [
    { name: "Node.js", detail: "20 and later. Tested on 24.", example: "examples/node" },
    { name: "Deno", detail: "2.x", example: "examples/deno" },
    { name: "Cloudflare Workers", detail: "No nodejs_compat flag needed", example: "examples/cloudflare-workers" },
    { name: "React Native (Expo)", detail: "Verified on a physical Android device. Needs react-native-get-random-values.", example: "examples/react-native-expo" },
    { name: "Hermes", detail: "Engine validated. Needs a crypto.getRandomValues polyfill.", example: "examples/hermes-standalone" },
    { name: "Browser", detail: "Pure TypeScript, no WebAssembly. This page runs it.", example: null },
  ];
  return (
    <section id="runtimes" className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-28">
      <SectionHead
        eyebrow="Where it runs"
        title="One package, many runtimes."
        intro="A runtime is only marked supported after a real generate → encrypt → decrypt round trip has run on it. Each one has a runnable example in the repository."
      />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {runtimes.map(({ name, detail, example }) => {
          const body = (
            <>
              <span className="block text-sm">{name}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{detail}</span>
              {example && <span className="mono mt-3 block text-[10px] text-[var(--accent)]">{example} →</span>}
            </>
          );
          return example ? (
            <a key={name} href={`${REPO}/tree/main/${example}`} target="_blank" rel="noreferrer" className="rounded-lg border bg-[var(--surface)] p-5 line transition-colors hover:border-[var(--accent)]">{body}</a>
          ) : (
            <div key={name} className="rounded-lg border bg-[var(--surface)] p-5 line">{body}</div>
          );
        })}
      </div>
      <p className="mt-5 text-xs text-[var(--faint)]">
        Details and dates for each run: <a className="text-[var(--accent)]" href={`${REPO}/blob/main/docs/compatibility.md`} target="_blank" rel="noreferrer">docs/compatibility.md</a>
      </p>
    </section>
  );
}

// ── Verification + limits ─────────────────────────────────────────────────────
export function VerificationSection() {
  const checks = [
    { what: "NIST ACVP vectors", why: "Official known-answer tests from NIST. Every ML-KEM and ML-DSA parameter set, plus the X-Wing reference vectors, must produce exactly the expected bytes." },
    { what: "Cross-implementation interop", why: "ML-DSA signatures and X-Wing shared secrets are cross-checked against Cloudflare's CIRCL (Go), an independent codebase." },
    { what: "Golden vectors", why: "Every envelope format version is pinned byte for byte, so an upgrade can never silently break data you already encrypted." },
    { what: "Fuzzing", why: "Key parsing is fed arbitrary and hostile input and must always fail closed." },
    { what: "Property-based tests", why: "decrypt(encrypt(x)) === x for random inputs, and changing any single byte must make decryption fail." },
    { what: "Stream mutation matrix", why: "Streaming envelopes are truncated, reordered, duplicated and spliced region by region. Every case must be rejected." },
    { what: "Signed releases", why: "Packages are published only from GitHub Actions with npm provenance. Check them yourself with npm audit signatures." },
  ];
  const limits = [
    "Not FIPS 140-3 / CMVP validated. FIPS conformance is a published self-assessment.",
    "The security reviews are internal and AI-assisted, not an independent third-party audit (one is being prepared).",
    "JavaScript gives no constant-time guarantees, and memory zeroization of secrets is only partial.",
    "SLH-DSA (FIPS 205) is not implemented, by design: its signatures are 7.8 to 49.8 KB versus 3.3 KB for ML-DSA-65.",
  ];
  return (
    <section id="verification" className="border-y bg-[#0f1215] py-24 line">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <SectionHead
          eyebrow="Trust, but verify"
          title="How the SDK is tested, and what it does not claim."
          intro="Cryptography should not be taken on faith. Each layer has its own kind of evidence, and every limit is stated up front."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {checks.map(({ what, why }) => (
              <div key={what} className="rounded-lg border bg-[rgba(255,255,255,.025)] p-4 line">
                <p className="text-sm">{what}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{why}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[rgba(242,148,148,.28)] bg-[rgba(242,148,148,.04)] p-5">
            <p className="mono text-[10px] uppercase tracking-[.14em] text-[var(--danger)]">Known limits</p>
            <ul className="mt-4 space-y-4">
              {limits.map((l) => <li key={l} className="text-xs leading-5 text-[var(--muted)]">{l}</li>)}
            </ul>
            <a href={`${REPO}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer" className="mono mt-5 inline-block text-[11px] text-[var(--accent)]">SECURITY.md · report a vulnerability →</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Glossary ──────────────────────────────────────────────────────────────────
export function Glossary() {
  const terms = [
    ["Post-quantum cryptography (PQC)", "Algorithms designed to stay secure even against a large quantum computer, which could break RSA and elliptic-curve cryptography."],
    ["Harvest now, decrypt later", "An attacker records encrypted traffic today and decrypts it once a capable quantum computer exists. Data that must stay secret for years is already at risk."],
    ["KEM", "Key encapsulation mechanism. Uses a public key to agree a fresh shared secret with the key's owner. The secret then encrypts the actual message."],
    ["ML-KEM (FIPS 203)", "NIST's standard post-quantum KEM, based on lattices. Three sizes: 512, 768 and 1024."],
    ["ML-DSA (FIPS 204)", "NIST's standard post-quantum signature scheme, also lattice-based. Three sizes: 44, 65 and 87."],
    ["X-Wing", "A hybrid KEM that combines classical X25519 with ML-KEM-768. Secure as long as either part holds. Defined in an IETF CFRG draft."],
    ["Security category", "NIST's strength scale from 1 to 5. Category 1 is comparable to AES-128, 3 to AES-192 and 5 to AES-256. Higher is stronger but larger and slower."],
    ["AES-256-GCM", "The symmetric cipher that encrypts and authenticates the message itself, keyed with the KEM's shared secret."],
    ["ACVP", "NIST's Automated Cryptographic Validation Protocol. Its test vectors check that an implementation computes exactly the right outputs."],
    ["CMVP / FIPS 140-3", "The formal government certification of a cryptographic module. This SDK is not certified."],
    ["Conformance finding (e.g. F203-19)", "A requirement from FIPS 203 (F203) or FIPS 204 (F204) that the self-assessment checked. NONCONFORMING means the code broke the rule; those were fixed."],
    ["keyId", "How AI-agent tools refer to a secret key without ever showing it to the model. The key itself stays in a keystore or your own vault."],
    ["MCP", "Model Context Protocol. A standard way for AI apps like Claude Desktop or Cursor to call external tools."],
    ["RBG_FAILURE", "Error code returned when the device's secure random generator fails. Cryptography must never continue without good randomness."],
  ];
  return (
    <section id="glossary" className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-28">
      <SectionHead eyebrow="Glossary" title="The terms on this page, in plain words." />
      <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {terms.map(([term, def]) => (
          <div key={term} className="border-l pl-4 line">
            <dt className="text-sm font-medium">{term}</dt>
            <dd className="mt-1 text-xs leading-5 text-[var(--muted)]">{def}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
