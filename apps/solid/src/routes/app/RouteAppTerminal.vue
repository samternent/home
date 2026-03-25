<script setup lang="ts"></script>

<template>
  <div class="flex justify-center items-center flex-1 p-4">
    <!-- Finder window -->
    <div
      class="max-w-5xl w-full flex max-h-154 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] text-slate-200 shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
    >
      <div class="flex h-full flex-col font-mono">
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[13px]"
        >
          <div class="flex items-center gap-3">
            <RouterLink
              as="button"
              to="/app"
              class="h-3 w-3 rounded-full bg-[#ff5f57]"
            />
            <span class="text-slate-400">concordOS / finder</span>
          </div>

          <div class="flex items-center gap-4 text-slate-500">
            <span>mode:grid</span>
            <span>view:recents</span>
          </div>
        </div>

        <div class="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)]">
          <!-- Left help rail -->
          <aside
            class="border-r border-white/10 bg-black/10 px-4 py-4 text-[13px] text-slate-400"
          >
            <div class="mb-5">
              <div class="mb-2 uppercase tracking-wider text-slate-500">
                nav
              </div>
              <div class="space-y-1">
                <div class="text-violet-300">› recents</div>
                <div>applications</div>
                <div>documents</div>
                <div>downloads</div>
                <div>pictures</div>
              </div>
            </div>

            <div class="mb-5">
              <div class="mb-2 uppercase tracking-wider text-slate-500">
                icloud
              </div>
              <div class="space-y-1">
                <div>drive</div>
                <div>shared</div>
              </div>
            </div>

            <div class="mb-5">
              <div class="mb-2 uppercase tracking-wider text-slate-500">
                tags
              </div>
              <div class="space-y-1">
                <div>red</div>
                <div>orange</div>
                <div>blue</div>
              </div>
            </div>

            <div>
              <div class="mb-2 uppercase tracking-wider text-slate-500">
                commands
              </div>
              <div class="space-y-1">
                <div><span class="text-slate-500">$</span> ls</div>
                <div><span class="text-slate-500">$</span> cd &lt;dir&gt;</div>
                <div>
                  <span class="text-slate-500">$</span> open &lt;file&gt;
                </div>
                <div>
                  <span class="text-slate-500">$</span> search &lt;term&gt;
                </div>
                <div>
                  <span class="text-slate-500">$</span> share &lt;file&gt;
                </div>
              </div>
            </div>
          </aside>

          <!-- Main terminal -->
          <section class="flex min-h-0 flex-col">
            <!-- Context line -->
            <div
              class="border-b border-white/10 px-5 py-3 text-[13px] text-slate-400"
            >
              <span class="text-slate-500">location:</span>
              <span class="ml-2 text-slate-200">concord://recents</span>
            </div>

            <!-- Terminal output -->
            <div
              class="min-h-0 flex-1 overflow-auto px-5 py-4 text-[14px] leading-7"
            >
              <div class="mb-3">
                <span class="text-emerald-400">sam@concord</span>
                <span class="text-slate-500">:</span>
                <span class="text-sky-400">~/recents</span>
                <span class="text-slate-500">$</span>
                <span class="ml-2 text-slate-200">ls</span>
              </div>

              <div
                class="grid grid-cols-2 gap-x-10 gap-y-1 pb-4 text-slate-300"
              >
                <div><span class="text-violet-300">dir</span> projects</div>
                <div><span class="text-violet-300">dir</span> invoices</div>
                <div><span class="text-violet-300">dir</span> system</div>
                <div>
                  <span class="text-amber-300">file</span> wallpaper.jpg
                </div>
                <div><span class="text-amber-300">file</span> resume.pdf</div>
                <div><span class="text-violet-300">dir</span> videos</div>
                <div><span class="text-amber-300">file</span> backups.zip</div>
                <div><span class="text-violet-300">dir</span> assets</div>
              </div>

              <div class="mb-3">
                <span class="text-emerald-400">sam@concord</span>
                <span class="text-slate-500">:</span>
                <span class="text-sky-400">~/recents</span>
                <span class="text-slate-500">$</span>
                <span class="ml-2 text-slate-200">search resume</span>
              </div>

              <div class="pb-4 text-slate-300">
                <div>1 result found</div>
                <div class="pl-4 text-amber-300">resume.pdf</div>
              </div>

              <div class="mb-3">
                <span class="text-emerald-400">sam@concord</span>
                <span class="text-slate-500">:</span>
                <span class="text-sky-400">~/recents</span>
                <span class="text-slate-500">$</span>
                <span class="ml-2 text-slate-500">_</span>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="border-t border-white/10 px-5 py-3 text-[12px] text-slate-500"
            >
              8 items · 1.2 GB stored on ConcordOS for Solid
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
