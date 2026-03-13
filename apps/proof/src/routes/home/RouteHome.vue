<script setup lang="ts"></script>

<template>
  <div class="min-h-screen bg-neutral-950 text-white">
    <!-- Background -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_35%)]"
      ></div>
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.10),transparent_30%)]"
      ></div>
      <div
        class="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_25%,transparent_75%,rgba(255,255,255,0.015))]"
      ></div>
    </div>

    <!-- Page -->
    <div class="relative">
      <!-- Header -->
      <header class="border-b border-[var(--ui-border)]">
        <div
          class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8"
        >
          <a href="#" class="flex items-center gap-3">
            <div>Portable Proof</div>
            <div></div>
          </a>

          <nav class="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#features" class="transition hover:text-white">Features</a>
            <a href="#how-it-works" class="transition hover:text-white"
              >How it works</a
            >
            <a href="#use-cases" class="transition hover:text-white"
              >Use cases</a
            >
            <a href="#developers" class="transition hover:text-white"
              >Developers</a
            >
            <!-- <a href="#" class="transition hover:text-white">Docs</a>
            <a href="#" class="transition hover:text-white">GitHub</a> -->
          </nav>

          <div class="flex items-center gap-3">
            <!-- <a
              href="#"
              class="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 sm:inline-flex"
            >
              Sign in
            </a> -->
            <RouterLink
              to="/app"
              class="inline-flex rounded-xl bg-[var(--ui-primary)] px-4 py-2 text-sm text-white transition"
            >
              Try it now
            </RouterLink>
          </div>
        </div>
      </header>

      <main>
        <!-- Hero -->
        <section
          class="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24"
        >
          <div class="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div class="max-w-2xl">
              <div
                class="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-background)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--ui-foreground)]"
              >
                Portable cryptographic proof
              </div>

              <h1
                class="max-w-4xl text-5xl leading-tight tracking-tight text-white sm:text-6xl"
              >
                Cryptographic proof
                <span class="text-[var(--ui-accent)]"
                  >you can take anywhere.</span
                >
              </h1>

              <p class="mt-6 max-w-xl text-lg font-light leading-8 sm:text-xl">
                Generate self-contained, portable proofs for text and files —
                directly in your browser. No accounts. No backend. No lock-in.
                Just math, keys, and integrity.
              </p>

              <div class="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#"
                  class="inline-flex items-center rounded-xl bg-[var(--ui-primary)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--ui-primary-hover)]"
                >
                  Try it now
                </a>
              </div>
            </div>

            <!-- Hero visual -->

            <div class="relative flex items-center justify-center py-20">
              <div class="relative w-full max-w-sm">
                <!-- softer, more natural shadow -->
                <div
                  class="pointer-events-none absolute inset-0 rounded-[30px] bg-black/40 blur-[36px] opacity-70 translate-x-8 translate-y-10 scale-[1.02]"
                ></div>

                <!-- plaque -->
                <div
                  class="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl"
                >
                  <!-- subtle face glow -->
                  <div
                    class="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent"
                  ></div>

                  <div class="relative rounded-xl bg-white/[0.03] p-4">
                    <div class="flex items-center justify-between pb-3">
                      <div class="text-xs uppercase">proof</div>
                      <div
                        class="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
                      >
                        Verified
                      </div>
                    </div>

                    <dl class="mt-5 space-y-4 text-sm">
                      <div
                        class="flex justify-between border-b border-white/5 pb-3"
                      >
                        <dt class="text-white/50">Signer</dt>
                        <dd class="font-medium text-white">0x9F...7A1C</dd>
                      </div>
                      <div
                        class="flex justify-between border-b border-white/5 pb-3"
                      >
                        <dt class="text-white/50">Algorithm</dt>
                        <dd class="font-medium text-white">Ed25519</dd>
                      </div>
                      <div
                        class="flex justify-between border-b border-white/5 pb-3"
                      >
                        <dt class="text-white/50">Content hash</dt>
                        <dd class="font-medium text-white">
                          sha256:a3f8...c9d2
                        </dd>
                      </div>
                      <div class="flex justify-between">
                        <dt class="text-white/50">Status</dt>
                        <dd class="font-medium text-emerald-300">
                          Valid proof
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <!-- Decorative grid -->
            <div class="pointer-events-none absolute inset-0 opacity-30">
              <div
                class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]"
              ></div>
            </div>
          </div>
        </section>

        <!-- Features -->
        <section id="features" class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div class="mx-auto max-w-3xl text-center">
            <div
              class="text-xs font-medium uppercase tracking-[0.22em] text-white/40"
            >
              Features
            </div>
            <h2
              class="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              A cryptographic primitive for the open web
            </h2>
            <p class="mt-4 text-lg leading-8 text-white/65">
              Portable Proof handles the cryptography so you can focus on
              proving what matters.
            </p>
          </div>

          <div class="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <div
                class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300"
              >
                ⌘
              </div>
              <h3 class="text-lg font-semibold text-white">
                Deterministic identity
              </h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Keys are derived locally and remain under your control.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <div
                class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300"
              >
                {}
              </div>
              <h3 class="text-lg font-semibold text-white">
                Portable proof artifact
              </h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Self-contained proof JSON that can be stored, shared, and
                verified anywhere.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <div
                class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300"
              >
                ✓
              </div>
              <h3 class="text-lg font-semibold text-white">
                Offline verification
              </h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Anyone can verify independently — no private key required.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <div
                class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300"
              >
                &lt;/&gt;
              </div>
              <h3 class="text-lg font-semibold text-white">Embed anywhere</h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Use it in apps, CI pipelines, static sites, or publishing
                workflows.
              </p>
            </div>
          </div>
        </section>

        <!-- How it works -->
        <section id="how-it-works" class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div
              class="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8"
            >
              <div
                class="text-xs font-medium uppercase tracking-[0.22em] text-white/40"
              >
                How it works
              </div>
              <h2
                class="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              >
                Three steps to prove anything
              </h2>
              <p class="mt-4 max-w-xl text-lg leading-8 text-white/65">
                Generate your identity, sign your content, and share a proof
                that anyone can verify.
              </p>

              <div class="mt-10 space-y-8">
                <div class="flex gap-4">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white"
                  >
                    1
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-white">
                      Generate or import identity
                    </h3>
                    <p class="mt-2 text-sm leading-6 text-white/60">
                      Create a deterministic identity or use one you already
                      control.
                    </p>
                  </div>
                </div>

                <div class="flex gap-4">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white"
                  >
                    2
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-white">
                      Sign your content
                    </h3>
                    <p class="mt-2 text-sm leading-6 text-white/60">
                      Apply your signature to text or files and produce a
                      portable proof artifact.
                    </p>
                  </div>
                </div>

                <div class="flex gap-4">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white"
                  >
                    3
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-white">
                      Verify independently
                    </h3>
                    <p class="mt-2 text-sm leading-6 text-white/60">
                      Anyone can verify the proof without your app or your
                      private key.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-semibold text-white">
                    Verification flow
                  </div>
                  <div class="mt-1 text-xs text-white/45">
                    Trust-minimal by design
                  </div>
                </div>
                <div
                  class="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-200"
                >
                  Client-side
                </div>
              </div>

              <div class="mt-8 space-y-4">
                <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div
                    class="text-xs uppercase tracking-[0.18em] text-white/40"
                  >
                    Input
                  </div>
                  <div class="mt-3 text-sm text-white/80">
                    Content + proof artifact
                  </div>
                </div>

                <div class="flex justify-center text-white/30">↓</div>

                <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div
                    class="text-xs uppercase tracking-[0.18em] text-white/40"
                  >
                    Verify
                  </div>
                  <div class="mt-3 text-sm text-white/80">
                    Recompute hash, validate signature, compare signer public
                    key
                  </div>
                </div>

                <div class="flex justify-center text-white/30">↓</div>

                <div
                  class="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"
                >
                  <div
                    class="text-xs uppercase tracking-[0.18em] text-emerald-200/80"
                  >
                    Output
                  </div>
                  <div class="mt-3 text-sm font-medium text-emerald-200">
                    Valid proof — content integrity confirmed
                  </div>
                </div>
              </div>

              <div
                class="mt-8 rounded-2xl border border-white/10 bg-neutral-900/70 p-4"
              >
                <div
                  class="mb-3 text-xs uppercase tracking-[0.18em] text-white/40"
                >
                  Example
                </div>
                <pre class="overflow-x-auto text-xs leading-6 text-white/80">
const proof = await portableProof.sign({
  content,
  identity
})

const result = await portableProof.verify({
  content,
  proof
})</pre
                >
              </div>
            </div>
          </div>
        </section>

        <!-- Use cases -->
        <section id="use-cases" class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div class="mx-auto max-w-3xl text-center">
            <div
              class="text-xs font-medium uppercase tracking-[0.22em] text-white/40"
            >
              Use cases
            </div>
            <h2
              class="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              Proof that travels with your work
            </h2>
            <p class="mt-4 text-lg leading-8 text-white/65">
              Sign once. Verify anywhere.
            </p>
          </div>

          <div class="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <h3 class="text-lg font-semibold text-white">
                Blog posts & articles
              </h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Prove authorship and integrity for published writing.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <h3 class="text-lg font-semibold text-white">
                Release artifacts
              </h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Attach proofs to builds, downloads, and distributable assets.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <h3 class="text-lg font-semibold text-white">
                Legal drafts & contracts
              </h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Record exactly what was signed and when.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <h3 class="text-lg font-semibold text-white">Research papers</h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Assert provenance for manuscripts, datasets, and revisions.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <h3 class="text-lg font-semibold text-white">Static websites</h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Publish independently verifiable proofs alongside your content.
              </p>
            </div>

            <div
              class="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <h3 class="text-lg font-semibold text-white">
                CI / GitHub Actions
              </h3>
              <p class="mt-3 text-sm leading-6 text-white/60">
                Automate signing and verification in your delivery pipeline.
              </p>
            </div>
          </div>
        </section>

        <!-- Developers -->
        <section id="developers" class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div
            class="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 sm:p-10"
          >
            <div
              class="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
            >
              <div>
                <div
                  class="text-xs font-medium uppercase tracking-[0.22em] text-white/40"
                >
                  Built on Concord
                </div>
                <h2
                  class="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                >
                  Identity + proof, separated from infrastructure
                </h2>
                <p class="mt-4 max-w-2xl text-lg leading-8 text-white/65">
                  Portable Proof is built on Concord identity primitives with
                  deterministic signing and trust-minimal verification. No
                  servers. No lock-in. Pure cryptography you control.
                </p>

                <div class="mt-8 grid gap-5 sm:grid-cols-3">
                  <div>
                    <div class="text-sm font-semibold text-white">
                      Prove integrity
                    </div>
                    <p class="mt-2 text-sm leading-6 text-white/60">
                      Cryptographically assert that content is exactly as you
                      created it.
                    </p>
                  </div>

                  <div>
                    <div class="text-sm font-semibold text-white">
                      Control identity
                    </div>
                    <p class="mt-2 text-sm leading-6 text-white/60">
                      Your keys remain yours. No third party holds your
                      identity.
                    </p>
                  </div>

                  <div>
                    <div class="text-sm font-semibold text-white">
                      Audit everything
                    </div>
                    <p class="mt-2 text-sm leading-6 text-white/60">
                      Create a verifiable record of who signed what and when.
                    </p>
                  </div>
                </div>
              </div>

              <div
                class="rounded-[1.5rem] border border-white/10 bg-neutral-950/80 p-5"
              >
                <div class="mb-4 flex items-center justify-between">
                  <div class="text-sm font-semibold text-white">
                    Developer example
                  </div>
                  <div class="text-xs text-white/40">PortableProof</div>
                </div>

                <pre
                  class="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-white/80"
                >
import { PortableProof } from '@ternent/portable-proof'

const proof = await PortableProof.sign({
  content: fileBuffer,
  identity
})

const verified = await PortableProof.verify({
  content: fileBuffer,
  proof
})

// verified.valid === true</pre
                >

                <div
                  class="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200"
                >
                  Valid proof
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div
            class="rounded-[2rem] border border-white/10 bg-white/[0.035] px-8 py-14 text-center sm:px-12"
          >
            <h2
              class="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              Ready to start?
            </h2>
            <p class="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/65">
              Sign your first proof in seconds and ship verifiable integrity
              into your workflow.
            </p>

            <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#"
                class="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Try it now
              </a>
              <a
                href="#"
                class="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                Read the docs
              </a>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="border-t border-white/10">
        <div class="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div
            class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div class="text-sm font-semibold text-white">Portable Proof</div>
              <div class="mt-1 text-sm text-white/45">
                Built on Concord. Open source.
              </div>
            </div>

            <nav
              class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60"
            >
              <a href="#" class="transition hover:text-white">Docs</a>
              <a href="#" class="transition hover:text-white">GitHub</a>
              <a href="#" class="transition hover:text-white">Concord</a>
              <a href="#" class="transition hover:text-white">Privacy</a>
              <a href="#" class="transition hover:text-white">License</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
