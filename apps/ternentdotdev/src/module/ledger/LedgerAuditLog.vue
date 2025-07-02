<script setup>
import { computed, ref } from "vue";
import { useLedger } from "./useLedger";

const { ledger } = useLedger();

const auditRecords = computed(() => {
  // Get all committed records from the blockchain
  if (!ledger.value?.chain) return [];

  // Extract all records from all blocks in the chain
  const allRecords = ledger.value.chain
    .flatMap((block) => block.records || [])
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return allRecords.map((record) => {
    let displayData = {};
    let actionType = "Unknown";
    let icon = "📝";

    try {
      // More robust data parsing - handle different formats
      let data = record.data;

      // If data is a string, try to parse it
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          // If JSON parse fails, treat as raw string
          displayData = { raw: data };
          actionType = "Data Record";
          icon = "💾";
          return {
            ...record,
            actionType,
            icon,
            displayData,
            timeAgo: getTimeAgo(record.timestamp),
          };
        }
      }

      // Handle encrypted data
      if (data && data.encrypted) {
        displayData = { raw: "[Encrypted Data]" };
        actionType = "Encrypted Record";
        icon = "🔒";
      }
      // Handle different data types
      else if (data && data.type) {
        switch (data.type) {
          case "note":
            actionType = data.id ? "Note Updated" : "Note Created";
            icon = "📝";
            displayData = {
              title: data.title || data.name || "Untitled Note",
              category: data.category || data.tags?.[0] || "General",
              content: data.content
                ? `${data.content.slice(0, 50)}...`
                : undefined,
            };
            break;

          case "task":
            actionType = data.completed
              ? "Task Completed"
              : data.id
              ? "Task Updated"
              : "Task Created";
            icon = data.completed ? "✅" : "📋";
            displayData = {
              title: data.title || data.name || "Untitled Task",
              priority: data.priority || "normal",
              status: data.completed ? "completed" : "pending",
            };
            break;

          case "user":
            actionType = data.id ? "User Updated" : "User Added";
            icon = "👤";
            displayData = {
              name: data.name || data.username || "Unknown User",
              role: data.role || "member",
              email: data.email,
            };
            break;

          case "permission":
            actionType = "Permission Changed";
            icon = "🔐";
            displayData = {
              resource: data.resource || "Unknown Resource",
              action: data.action || data.permission || "Unknown Action",
              user: data.user || data.userId,
            };
            break;

          default:
            actionType = `${data.type} Record`;
            icon = "📄";
            displayData = {
              title: data.title || data.name || `${data.type} entry`,
              raw: JSON.stringify(data, null, 2).slice(0, 100) + "...",
            };
        }
      }
      // Handle records by collection type
      else if (record.collection) {
        switch (record.collection) {
          case "notes":
            actionType = "Note Record";
            icon = "📝";
            displayData = {
              title: data?.title || data?.name || "Note Entry",
              collection: record.collection,
            };
            break;

          case "tasks":
            actionType = "Task Record";
            icon = "📋";
            displayData = {
              title: data?.title || data?.name || "Task Entry",
              collection: record.collection,
            };
            break;

          case "users":
            actionType = "User Record";
            icon = "👤";
            displayData = {
              name: data?.name || data?.username || "User Entry",
              collection: record.collection,
            };
            break;

          case "permissions":
            actionType = "Permission Record";
            icon = "🔐";
            displayData = {
              resource: data?.resource || "Permission Entry",
              collection: record.collection,
            };
            break;

          default:
            actionType = `${record.collection} Record`;
            icon = "📄";
            displayData = {
              title: `Entry in ${record.collection}`,
              collection: record.collection,
            };
        }
      }
      // Fallback for unknown structure
      else {
        actionType = "System Record";
        icon = "⚙️";
        displayData = {
          raw:
            typeof data === "object"
              ? JSON.stringify(data, null, 2).slice(0, 200) + "..."
              : String(data).slice(0, 200) + "...",
        };
      }
    } catch (e) {
      console.error("Error parsing record:", e, record);
      // If parsing fails completely, show raw data
      displayData = {
        raw:
          typeof record.data === "object"
            ? JSON.stringify(record.data, null, 2).slice(0, 200) + "..."
            : String(record.data).slice(0, 200) + "...",
        error: "Parsing failed",
      };
      actionType = "Parse Error";
      icon = "❌";
    }

    return {
      ...record,
      actionType,
      icon,
      displayData,
      timeAgo: getTimeAgo(record.timestamp),
    };
  });
});

const searchQuery = ref("");
const actionTypeFilter = ref("");

const filteredRecords = computed(() => {
  let records = auditRecords.value;
  if (actionTypeFilter.value) {
    records = records.filter((r) => r.actionType === actionTypeFilter.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    records = records.filter(
      (r) =>
        (r.actionType && r.actionType.toLowerCase().includes(q)) ||
        (r.displayData.title &&
          r.displayData.title.toLowerCase().includes(q)) ||
        (r.displayData.name && r.displayData.name.toLowerCase().includes(q)) ||
        (r.displayData.content &&
          r.displayData.content.toLowerCase().includes(q)) ||
        (r.displayData.raw && r.displayData.raw.toLowerCase().includes(q))
    );
  }
  return records;
});

const actionTypeOptions = computed(() => {
  const set = new Set(auditRecords.value.map((r) => r.actionType));
  return Array.from(set).filter(Boolean).sort();
});

function getTimeAgo(timestamp) {
  const now = new Date();
  const recordTime = new Date(timestamp);
  const diffMs = now - recordTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  return "Just now";
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}
</script>

<template>
  <div class="flex flex-col flex-1 w-full h-full bg-base-100">
    <!-- Header -->
    <div
      class="px-6 py-4 border-b border-base-200 sticky top-0 z-10 bg-base-100"
    >
      <div class="flex">
        <div class="flex-1">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <span class="text-2xl">🔍</span>
            Audit Trail
          </h3>
          <p class="text-sm text-base-content/60 mt-1">
            {{ filteredRecords.length }} of {{ auditRecords.length }} committed
            transactions
          </p>
        </div>
        <div
          class="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 md:w-auto"
        >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search audit log..."
            class="input input-bordered input-sm w-full md:w-56"
            aria-label="Search audit log"
          />
          <select
            v-model="actionTypeFilter"
            class="select select-bordered select-sm w-full md:w-44"
            aria-label="Filter by action type"
          >
            <option value="">All Actions</option>
            <option v-for="type in actionTypeOptions" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredRecords.length === 0"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center text-base-content/50">
        <div class="text-6xl mb-6">📋</div>
        <div class="text-xl font-medium mb-2">No audit records found</div>
        <div class="text-sm max-w-md">
          Try adjusting your search or filters.
        </div>
      </div>
    </div>

    <!-- Records List -->
    <div v-else class="flex-1 min-h-0 overflow-y-auto w-full">
      <div class="divide-y divide-base-200 min-w-0">
        <div
          v-for="record in filteredRecords"
          :key="record.hash"
          class="px-6 py-4 hover:bg-base-50 transition-colors group shadow-sm rounded-lg mb-2 bg-white/80 dark:bg-base-200/80"
        >
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-lg shadow"
            >
              {{ record.icon }}
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <span class="font-medium text-base-content">{{
                  record.actionType
                }}</span>
                <span
                  class="text-xs text-base-content/50 bg-base-200 px-2 py-1 rounded-full"
                >
                  {{ record.timeAgo }}
                </span>
              </div>

              <!-- Data Summary -->
              <div
                v-if="record.displayData.title || record.displayData.name"
                class="mb-3"
              >
                <div
                  v-if="record.displayData.title"
                  class="text-sm font-medium text-base-content/90"
                >
                  {{ record.displayData.title }}
                </div>
                <div
                  v-if="record.displayData.name"
                  class="text-sm font-medium text-base-content/90"
                >
                  {{ record.displayData.name }}
                </div>
                <div
                  v-if="record.displayData.content"
                  class="text-xs text-base-content/60 mt-1"
                >
                  {{ record.displayData.content }}
                </div>

                <!-- Secondary info -->
                <div
                  class="flex flex-wrap gap-3 mt-2 text-xs text-base-content/60"
                >
                  <span v-if="record.displayData.category">
                    📁 {{ record.displayData.category }}
                  </span>
                  <span v-if="record.displayData.priority">
                    ⚡ {{ record.displayData.priority }}
                  </span>
                  <span v-if="record.displayData.status">
                    🔄 {{ record.displayData.status }}
                  </span>
                  <span v-if="record.displayData.role">
                    👥 {{ record.displayData.role }}
                  </span>
                  <span v-if="record.displayData.email">
                    📧 {{ record.displayData.email }}
                  </span>
                  <span v-if="record.displayData.resource">
                    🔒 {{ record.displayData.resource }}
                  </span>
                  <span v-if="record.displayData.user">
                    👤 {{ record.displayData.user }}
                  </span>
                  <span v-if="record.displayData.collection">
                    📦 {{ record.displayData.collection }}
                  </span>
                </div>
              </div>

              <!-- Raw data fallback -->
              <div v-else-if="record.displayData.raw" class="mb-3">
                <details class="text-xs">
                  <summary
                    class="cursor-pointer text-base-content/60 hover:text-base-content/80"
                  >
                    {{ record.displayData.error ? "❌ " : "🔍 " }}View raw data
                  </summary>
                  <pre
                    class="mt-2 bg-base-200 p-3 rounded text-base-content/70 overflow-x-auto text-xs"
                    >{{ record.displayData.raw }}</pre
                  >
                </details>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between">
                <div class="text-xs text-base-content/40">
                  {{ formatDate(record.timestamp) }}
                </div>
                <div
                  class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    @click="navigator.clipboard?.writeText(record.hash)"
                    class="text-xs text-base-content/50 hover:text-base-content/80 px-2 py-1 rounded hover:bg-base-200"
                  >
                    📋 Copy Hash
                  </button>
                  <div class="text-xs text-base-content/30 font-mono">
                    {{ record.hash?.slice(0, 8) }}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
