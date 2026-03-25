<script setup lang="ts"></script>

<template>
  <!-- Main stage -->
  <div class="flex justify-center items-center flex-1 p-4">
    <!-- Finder window -->
    <div
      class="max-w-6xl w-full flex overflow-hidden rounded-[24px] border border-black/5 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur"
    >
      <!-- Sidebar -->
      <aside
        class="flex w-[270px] shrink-0 flex-col border-r border-black/5 bg-[#f5f6fb]/90"
      >
        <div class="flex items-center gap-2 px-6 py-5">
          <RouterLink
            as="button"
            to="/app"
            class="h-3.5 w-3.5 rounded-full bg-[#ff5f57]"
          ></RouterLink>
        </div>

        <div class="space-y-7 px-5 pb-6">
          <div>
            <div
              class="mb-3 px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400"
            >
              Favorites
            </div>

            <nav class="space-y-1">
              <a
                class="flex items-center gap-3 rounded-2xl bg-[#e9e6ff] px-4 py-3 text-[15px] font-medium text-[#635bff]"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1Zm1 6v5l4 2-.8 1.8L11 13V7Z"
                  />
                </svg>
                Recents
              </a>

              <a
                class="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-slate-600 hover:bg-black/[0.03]"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" />
                </svg>
                Applications
              </a>

              <a
                class="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-slate-600 hover:bg-black/[0.03]"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 2h9l5 5v15H6zM14 3.5V8h4.5" />
                </svg>
                Documents
              </a>

              <a
                class="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-slate-600 hover:bg-black/[0.03]"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10m0 0 4-4m-4 4-4-4M5 19h14" />
                </svg>
                Downloads
              </a>

              <a
                class="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-slate-600 hover:bg-black/[0.03]"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 5h16v14H4zM7 15l3-3 2 2 4-4 2 3" />
                </svg>
                Pictures
              </a>
            </nav>
          </div>

          <div>
            <div
              class="mb-3 px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400"
            >
              iCloud
            </div>

            <nav class="space-y-1">
              <a
                class="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-slate-600 hover:bg-black/[0.03]"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 8a4 4 0 1 1 0 8Z"
                  />
                </svg>
                iCloud Drive
              </a>

              <a
                class="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-slate-600 hover:bg-black/[0.03]"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 4H4v16h16V8h-6zM10 4v4h4" />
                </svg>
                Shared
              </a>
            </nav>
          </div>

          <div>
            <div
              class="mb-3 px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400"
            >
              Tags
            </div>

            <div class="space-y-3 px-4 text-[15px] text-slate-600">
              <div class="flex items-center gap-3">
                <span class="h-3 w-3 rounded-full bg-red-400"></span>Red
              </div>
              <div class="flex items-center gap-3">
                <span class="h-3 w-3 rounded-full bg-orange-400"></span>Orange
              </div>
              <div class="flex items-center gap-3">
                <span class="h-3 w-3 rounded-full bg-indigo-500"></span>Blue
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Content -->
      <section class="flex min-w-0 flex-1 flex-col bg-white/70">
        <!-- Toolbar -->
        <div
          class="flex items-center justify-between border-b border-black/5 px-6 py-4"
        >
          <div class="flex items-center gap-4">
            <button class="text-slate-400 hover:text-slate-600">
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button class="text-slate-400 hover:text-slate-600">
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            <h2 class="ml-2 text-[18px] font-semibold text-slate-800">
              Recents
            </h2>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center rounded-2xl bg-slate-100 p-1">
              <button
                class="rounded-xl bg-white px-3 py-2 text-slate-500 shadow-sm"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" />
                </svg>
              </button>
              <button class="rounded-xl px-3 py-2 text-slate-400">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                </svg>
              </button>
              <button class="rounded-xl px-3 py-2 text-slate-400">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 5h4v14H5zm5 0h4v14h-4zm5 0h4v14h-4z" />
                </svg>
              </button>
            </div>

            <div
              class="flex h-10 items-center gap-2 rounded-full bg-slate-100 px-4 text-slate-400"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span class="text-[15px]">Search</span>
            </div>

            <button class="text-slate-400 hover:text-slate-600">
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="18" cy="5" r="2" />
                <circle cx="6" cy="12" r="2" />
                <circle cx="18" cy="19" r="2" />
                <path d="M8 12 16 6M8 12l8 6" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Files -->
        <div class="flex-1 px-7 py-8"></div>

        <!-- Status bar -->
        <div
          class="border-t border-black/5 px-6 py-3 text-center text-[13px] text-slate-400"
        >
          8 items, 1.2 GB stored on ConcordOS for Solid
        </div>
      </section>
    </div>
  </div>
</template>
