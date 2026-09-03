# PQC SDK Launch Specification

## Problem Statement

JavaScript and TypeScript developers, security engineers, cryptography enthusiasts, and open-source communities need a fast way to understand why post-quantum cryptography matters and how to use it in browser applications. PQC SDK currently has the core package, public documentation, an interactive browser demo, and a landing page, but these assets need a coordinated launch narrative.

The launch must turn curiosity into a completed local encryption demo, then turn confidence into a GitHub visit, GitHub star, documentation visit, and npm installation. The interactive demo is the primary acquisition channel: every campaign should lead with the working experience rather than an abstract explanation or unsupported metric.

## Solution

Launch PQC SDK as a browser-first, TypeScript-friendly introduction to post-quantum encryption. The central promise is: developers can generate keys, encrypt a message, decrypt it, and verify the round trip locally in their browser before integrating the SDK.

The campaign will:

- Position the SDK around an immediate, verifiable developer experience.
- Use the demo as the primary destination for every external post.
- Connect the demo to source, license, documentation, API reference, and npm package evidence.
- Publish audience-specific explanations without overstating security guarantees.
- Improve the README so visitors can reproduce the first successful operation quickly.
- Measure the funnel from campaign click to demo completion, GitHub engagement, and npm installation.

## User Stories

1. As a JavaScript developer, I want to run the complete encryption round trip in my browser, so that I can understand the SDK before installing it.
2. As a TypeScript developer, I want to see a concise typed API example, so that I can estimate integration effort.
3. As a security engineer, I want to inspect the repository, license, documentation, and API reference, so that I can evaluate project transparency.
4. As a cryptography enthusiast, I want to select between the supported algorithms, so that I can compare the available demo paths.
5. As an open-source contributor, I want a clear GitHub entry point, so that I can inspect the implementation and identify ways to help.
6. As a first-time visitor, I want the demo to explain what each operation does, so that I can complete it without prior PQC knowledge.
7. As a mobile visitor, I want the playground to remain usable immediately after the introductory copy, so that I can try the product without navigating a dense page.
8. As a developer evaluating dependencies, I want to copy an install command for npm, pnpm, or yarn, so that I can add the package using my preferred tool.
9. As a developer using assistive technology, I want operation status, errors, tabs, and copy feedback announced correctly, so that I can complete the demo independently.
10. As a skeptical technical reader, I want claims linked to primary evidence, so that I can distinguish verifiable facts from marketing language.
11. As a Hacker News reader, I want a concise technical explanation and a direct demo link, so that I can judge the project quickly.
12. As a Reddit reader, I want context about the practical browser use case, so that I can decide whether the project is relevant to my work.
13. As a LinkedIn reader, I want a plain-language explanation of the harvest-now-decrypt-later problem, so that I can share the project with engineering and security peers.
14. As an X/Twitter reader, I want a short visual proof of the round trip, so that I can understand the value without reading a long thread.
15. As a Dev.to reader, I want a reproducible tutorial, so that I can move from the demo to a working TypeScript example.
16. As a maintainer, I want campaign links to be attributable by channel, so that I can compare acquisition quality without inventing usage metrics.
17. As a project owner, I want launch reporting to separate demo completions, GitHub actions, and npm actions, so that success is measured across the full acquisition funnel.
18. As a contributor, I want launch documentation to avoid unsupported claims about security, performance, or adoption, so that project trust is preserved.

## Implementation Decisions

### Positioning strategy

PQC SDK is positioned as a browser-first developer entry point for experimenting with post-quantum encryption. It is not positioned as a replacement for a formal security review, a compliance certification, or a universal cryptographic recommendation.

The narrative order is:

1. Try a complete local encryption round trip.
2. Inspect the small API that powers it.
3. Verify the project through source, license, documentation, and package links.
4. Install the SDK and continue with Quick Start.
5. Visit GitHub to star, discuss, or contribute.

### Key messaging

Primary message:

> Try post-quantum encryption in your browser. Generate keys, encrypt a message, decrypt it, and verify the result locally.

Supporting messages:

- Browser-native workflow with no server request required by the demo.
- Small TypeScript-oriented API.
- Supported algorithm choices are visible in the playground.
- The implementation, license, documentation, API reference, and npm package are linked directly.
- The demo provides an observable round trip rather than asking visitors to trust an abstract claim.

Guardrails:

- Do not claim absolute security, quantum resistance beyond the selected algorithms, production readiness for every threat model, or audited status unless primary evidence is added.
- Do not publish download, star, performance, or adoption numbers unless they are captured from a defined source and date.
- Describe browser-local execution as a property of the demo, not as a guarantee about every consuming application.

### Launch sequence

1. **Prepare:** validate the production build, verify all public links, confirm package and documentation versions, and prepare README examples.
2. **Soft launch:** share with a small group of JavaScript, TypeScript, and security reviewers; collect completion blockers and wording issues.
3. **Technical launch:** publish the Dev.to tutorial and Hacker News submission together, using the demo as the canonical destination.
4. **Community adaptation:** publish Reddit, LinkedIn, and X/Twitter posts with channel-specific framing and the same canonical demo URL.
5. **Conversation window:** respond to technical questions with source links, limitations, reproducible commands, and direct corrections where needed.
6. **Follow-up:** publish a short results note after seven days and a complete launch review after thirty days.

### Community-specific post drafts

#### Hacker News

**Title:** Show HN: PQC SDK – try a post-quantum encryption round trip in your browser

**Draft:**

> I built a browser-first PQC SDK demo for JavaScript and TypeScript developers. You can enter a message, choose an algorithm, generate keys, encrypt, decrypt, and verify that the recovered plaintext matches — locally in the browser.
>
> The project links the source, MIT license, documentation, API reference, and npm package. The goal is to make the first PQC interaction tangible before asking developers to read a specification or add a dependency.
>
> Feedback on the API, browser constraints, documentation, and security claims is welcome.

#### Reddit

**Title:** I made a browser demo for trying post-quantum encryption with JavaScript/TypeScript

**Draft:**

> This is a small developer-focused PQC SDK with an interactive browser demo. The demo walks through key generation, encryption, decryption, and exact round-trip verification. It also exposes the supported algorithm choices and links to the implementation and docs.
>
> I am looking for feedback from developers and security-minded users on whether the flow makes PQC easier to understand, and where the documentation needs more context. It is an educational developer experience, not a substitute for a security review.

#### LinkedIn

**Draft:**

> Post-quantum cryptography is easier to evaluate when developers can try the workflow directly.
>
> PQC SDK provides a browser-first demo where you can generate keys, encrypt a message, decrypt it, and verify the result locally. The project also connects the experience to its source, MIT license, documentation, API reference, and npm package.
>
> The launch focus is practical: reduce the distance between hearing about harvest-now-decrypt-later risk and understanding what a developer integration could look like.

#### X/Twitter

**Draft:**

> Try a post-quantum encryption round trip in your browser:
>
> 1. Enter a message
> 2. Generate keys
> 3. Encrypt
> 4. Decrypt
> 5. Verify the messages match
>
> Browser-first PQC SDK for JS/TS developers. Source, docs, license, and npm package are linked from the demo.

#### Dev.to

**Title:** From browser demo to TypeScript: trying a post-quantum encryption SDK

**Draft outline:**

1. Explain the practical motivation without predicting a specific attack timeline.
2. Define post-quantum encryption and the limits of a browser demo.
3. Walk through the interactive demo and its exact verification step.
4. Show the minimal package installation for npm, pnpm, and yarn.
5. Reproduce key generation, encryption, and decryption in TypeScript.
6. Link the source, license, API reference, and package.
7. Invite review of API ergonomics, documentation, and threat-model assumptions.

### README improvements

The README should be the canonical technical handoff after the demo. It should include:

- A one-sentence positioning statement and a prominent link to the interactive demo.
- A short animated or static demonstration only if it remains readable and current.
- Supported algorithms, clearly separated from claims about security guarantees.
- Installation commands for npm, pnpm, and yarn.
- A minimal TypeScript Quick Start that mirrors the public API exactly.
- Expected output and a note that ciphertext and plaintext types must be handled as documented.
- Links to the full documentation, API reference, license, npm package, and GitHub issues.
- Browser/runtime support and known limitations.
- A contribution section with local development, build, and validation commands.
- A security section that explains responsible disclosure and avoids implying an audit unless one exists.
- A changelog or release guidance so package consumers can identify tested versions.

### Demo promotion strategy

Every channel uses the same canonical demo destination with a channel identifier in analytics or URL parameters where available. Campaign creative should show the successful verification state, not only a static hero.

The promotion sequence prioritizes:

- Short screen recordings showing the complete five-step flow.
- Copy that leads with the action “Run the demo”.
- A single technical question per post to encourage useful discussion.
- Direct links to source and documentation in replies when platform formatting limits the main post.
- A follow-up explaining implementation tradeoffs rather than repeating launch copy.

### Success metrics

Metrics are recorded by channel and date, with a baseline captured before launch:

- Landing-page sessions from each channel.
- Playground starts.
- Successful complete demo executions.
- Demo completion rate: successful executions divided by playground starts.
- GitHub repository clicks.
- GitHub stars and star conversion from attributable sessions where measurable.
- npm package page visits.
- npm install or download signals from the package registry, reported with source and date.
- Documentation and Quick Start visits.
- README-to-demo click-through rate.
- GitHub issue, discussion, pull request, or qualitative feedback volume.
- Error rate and abandonment step in the demo.

Primary success indicators are completed demo executions, GitHub actions, and npm installation signals. No target number is assumed until a pre-launch baseline exists.

### 30-day launch roadmap

| Period | Work | Exit criteria |
| --- | --- | --- |
| Days 1–3 | Verify build, public links, package metadata, documentation paths, and demo error states. Capture baseline funnel metrics. | No broken primary path; baseline recorded. |
| Days 4–7 | Update README, Quick Start, API links, limitations, and contribution guidance. Prepare channel assets. | README reproduces the demo flow with current APIs. |
| Days 8–10 | Run a soft launch with selected JavaScript, TypeScript, and security reviewers. | Blocking usability and trust issues triaged. |
| Days 11–14 | Publish Dev.to tutorial and submit to Hacker News. Monitor completion and technical feedback. | First launch cohort measured; questions answered with evidence. |
| Days 15–18 | Publish Reddit and LinkedIn versions. Adapt framing based on observed questions without changing factual claims. | Community-specific traffic and feedback recorded. |
| Days 19–21 | Publish X/Twitter demo clip and a technical follow-up thread. | Demo clip links to the canonical experience. |
| Days 22–24 | Improve documentation or demo copy only for validated blockers. Publish clarifications for recurring questions. | Top abandonment or confusion points addressed. |
| Days 25–27 | Review GitHub stars, package signals, demo completions, and qualitative feedback by channel. | Channel comparison and evidence log complete. |
| Days 28–30 | Publish a transparent launch recap with dates, sources, limitations, and next steps. | 30-day report shared; follow-up backlog created. |

## Testing Decisions

- Test the primary user journey as external behavior: enter a message, choose each supported algorithm, run the complete demo, and observe exact success or visible failure.
- Test duplicate activation behavior by triggering each operation repeatedly before its promise resolves; only one crypto operation should run.
- Test snapshot behavior by changing the textarea after encryption and before manual decryption; verification must use the captured encrypted message, not the mutable textarea.
- Test error behavior by forcing or simulating unavailable crypto initialization, encryption failure, decryption failure, and unsupported clipboard access; stale success output must disappear and the failure must be visible and announced.
- Test installation tabs with mouse, Tab, ArrowLeft, ArrowRight, Home, and End; the active tab must expose its associated panel through `aria-controls`, `aria-labelledby`, and `aria-selected`.
- Test copy feedback for successful and unsupported clipboard writes; `"Copied"` must only be announced after success, and failure feedback must be announced separately.
- Test the page at desktop and narrow mobile widths to confirm the existing layout remains usable without changing visual identity.
- Validate all public links and README commands as part of release preparation.
- Prefer the highest existing seam: the interactive demo component and its user-visible state transitions. Add lower-level tests only when a behavior cannot be observed reliably through that seam.
- No test prior art is currently available in the repository; new tests should follow the project's existing runner once one is established rather than introducing a new testing dependency for the launch.

## Out of Scope

- Replacing or redesigning the visual identity or landing-page layout.
- Changing cryptographic algorithms, primitives, key formats, or SDK APIs.
- Claiming that the SDK is audited, certified, universally production-ready, or secure for a threat model that has not been documented.
- Inventing GitHub star counts, npm download counts, performance benchmarks, customer logos, or adoption metrics.
- Building a backend, account system, analytics platform, or server-side cryptographic service.
- Paid advertising, influencer programs, conference sponsorships, or a formal public-relations campaign.
- Guaranteeing ranking or placement on Hacker News, Reddit, LinkedIn, X/Twitter, or Dev.to.
- Adding dependencies solely for launch measurement or testing.

## Further Notes

- The repository currently does not expose a README in the visible project state; README work is therefore a launch prerequisite, not an optional polish task.
- Existing public links should be checked against the intended canonical repository and package ownership before publishing. A launch must not send users to an unrelated or placeholder repository.
- The project uses a browser demo and a package named `@pqc-sdk/core`; launch copy should keep those identities consistent.
- The issue tracker required by the specification workflow is unavailable in the current environment, so this specification has been written to the repository but not published or labeled there. Run `/setup-matt-pocock-skills` before publishing it to the project tracker.
