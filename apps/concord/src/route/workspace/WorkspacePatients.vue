<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { generateId, stripIdentityKey } from "ternent-utils";
import { SBadge, SDialog, SListButton, SSegmentedControl } from "ternent-ui/components";
import { Button } from "ternent-ui/primitives";

import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import UserPicker from "../../module/user/UserPicker.vue";

const { bridge, addItem, createPermission, addUserPermission } = useLedger();
const { publicKeyPEM } = useIdentity();

type ExposureEntry = {
  identity: string;
  permissionId: string;
};

type Patient = {
  id: string;
  displayName: string;
  dob?: string;
  nhsNumber?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
  exposures?: ExposureEntry[];
  shared?: boolean;
  keyMissing?: boolean;
  permission?: string;
  permissionId?: string | null;
  [key: string]: unknown;
};

type PatientEntry = {
  entryId: string;
  data: Patient;
};

type Note = {
  id: string;
  patientId: string;
  patientDisplayName?: string;
  title?: string;
  body: string;
  encounterDate?: string;
  createdAt: number;
  updatedAt: number;
  keyMissing?: boolean;
  permission?: string;
  permissionId?: string | null;
  [key: string]: unknown;
};

type NoteEntry = {
  entryId: string;
  data: Note;
};

type Medication = {
  id: string;
  patientId: string;
  patientDisplayName?: string;
  name: string;
  dose?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  createdAt: number;
  updatedAt: number;
  keyMissing?: boolean;
  permission?: string;
  permissionId?: string | null;
  [key: string]: unknown;
};

type MedicationEntry = {
  entryId: string;
  data: Medication;
};

function stripUndefined<T extends Record<string, any>>(payload: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) cleaned[key] = value;
  }
  return cleaned as T;
}

function formatDate(
  iso: string | number,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(iso));
}

const myIdentity = computed(() =>
  publicKeyPEM?.value ? stripIdentityKey(publicKeyPEM.value) : ""
);

const patients = computed<PatientEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.patients || {})
      .sort((a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0))
      .map((entry) => ({
        entryId: entry.entryId,
        data: entry.data as Patient,
      })) as PatientEntry[]
);

const notesByPatientId = computed(() => {
  const entries = Object.values(
    bridge.collections.byKind.value?.["patient-notes"] || {}
  ) as NoteEntry[];
  const map = new Map<string, NoteEntry[]>();
  for (const entry of entries) {
    if (!entry?.data?.patientId) continue;
    const current = map.get(entry.data.patientId) ?? [];
    current.push(entry);
    map.set(entry.data.patientId, current);
  }
  for (const [patientId, list] of map.entries()) {
    list.sort((a, b) => {
      const aDate = a.data.encounterDate
        ? new Date(a.data.encounterDate).getTime()
        : a.data.createdAt || 0;
      const bDate = b.data.encounterDate
        ? new Date(b.data.encounterDate).getTime()
        : b.data.createdAt || 0;
      return bDate - aDate;
    });
    map.set(patientId, list);
  }
  return map;
});

const medsByPatientId = computed(() => {
  const entries = Object.values(
    bridge.collections.byKind.value?.["patient-meds"] || {}
  ) as MedicationEntry[];
  const map = new Map<string, MedicationEntry[]>();
  for (const entry of entries) {
    if (!entry?.data?.patientId) continue;
    const current = map.get(entry.data.patientId) ?? [];
    current.push(entry);
    map.set(entry.data.patientId, current);
  }
  for (const [patientId, list] of map.entries()) {
    list.sort((a, b) => {
      const aDate = a.data.startDate
        ? new Date(a.data.startDate).getTime()
        : a.data.createdAt || 0;
      const bDate = b.data.startDate
        ? new Date(b.data.startDate).getTime()
        : b.data.createdAt || 0;
      return bDate - aDate;
    });
    map.set(patientId, list);
  }
  return map;
});

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);

const activePatientEntryId = shallowRef<string | null>(null);
const selectedScope = shallowRef<"all" | "public" | "private" | "shared">("all");
const selectedStatus = shallowRef<"all" | "active" | "archived">("all");

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const scopeOptions = [
  { value: "all", label: "All records" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "shared", label: "Shared" },
];

const isAddPatientDialogOpen = ref(false);
const isEditPatientDialogOpen = ref(false);
const editingPatient = shallowRef<PatientEntry | null>(null);

const newPatientName = shallowRef("");
const newPatientDob = shallowRef("");
const newPatientNhsNumber = shallowRef("");
const newPatientTags = shallowRef("");
const newPatientArchived = ref(false);
const patientVisibility = shallowRef<"private" | "public">("private");

const isAddNoteDialogOpen = ref(false);
const newNoteTitle = shallowRef("");
const newNoteBody = shallowRef("");
const newNoteEncounterDate = shallowRef("");
const noteVisibility = shallowRef<"private" | "public" | "share">("private");
const noteShareUser = shallowRef<any | null>(null);

const isAddMedDialogOpen = ref(false);
const newMedName = shallowRef("");
const newMedDose = shallowRef("");
const newMedInstructions = shallowRef("");
const newMedStartDate = shallowRef("");
const newMedEndDate = shallowRef("");
const medVisibility = shallowRef<"private" | "public" | "share">("private");
const medShareUser = shallowRef<any | null>(null);

const patientVisibilityOptions = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
];

const detailVisibilityOptions = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "share", label: "Share" },
];

const derivedPatients = computed(() => {
  const map = new Map<string, PatientEntry>();
  const noteEntries = Array.from(notesByPatientId.value.values()).flat();
  const medEntries = Array.from(medsByPatientId.value.values()).flat();
  for (const entry of [...noteEntries, ...medEntries]) {
    if (entry.data.keyMissing) continue;
    const name = entry.data.patientDisplayName || "Shared patient";
    if (!map.has(entry.data.patientId)) {
      map.set(entry.data.patientId, {
        entryId: `shared-${entry.data.patientId}`,
        data: {
          id: entry.data.patientId,
          displayName: name,
          createdAt: entry.data.createdAt,
          updatedAt: entry.data.updatedAt,
          shared: true,
        },
      });
    }
  }
  return map;
});

const patientList = computed(() => {
  const map = new Map<string, PatientEntry>();
  const derived = derivedPatients.value;
  for (const entry of patients.value) {
    if (!entry.data.keyMissing) {
      map.set(entry.data.id, entry);
      continue;
    }
    if (!derived.has(entry.data.id)) {
      map.set(entry.data.id, entry);
    }
  }
  for (const [patientId, entry] of derived.entries()) {
    if (!map.has(patientId)) map.set(patientId, entry);
  }
  return Array.from(map.values()).sort(
    (a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0)
  );
});

const scopedPatients = computed(() => {
  if (selectedScope.value === "public") {
    return patientList.value.filter(
      (item) => !item.data.permissionId && !item.data.permission
    );
  }
  if (selectedScope.value === "private") {
    return patientList.value.filter(
      (item) => !!item.data.permissionId || !!item.data.permission
    );
  }
  if (selectedScope.value === "shared") {
    return patientList.value.filter((item) => !!item.data.shared);
  }
  return patientList.value;
});

const filteredPatients = computed(() => {
  if (selectedStatus.value === "active") {
    return scopedPatients.value.filter((item) => !item.data.archived);
  }
  if (selectedStatus.value === "archived") {
    return scopedPatients.value.filter((item) => item.data.archived);
  }
  return scopedPatients.value;
});

const activePatient = computed(() =>
  filteredPatients.value.find(
    (item) => item.entryId === activePatientEntryId.value
  )
);

const activeNotes = computed(() => {
  if (!activePatient.value?.data?.id) return [];
  return notesByPatientId.value.get(activePatient.value.data.id) ?? [];
});

const activeMeds = computed(() => {
  if (!activePatient.value?.data?.id) return [];
  return medsByPatientId.value.get(activePatient.value.data.id) ?? [];
});

watch(
  filteredPatients,
  (nextPatients) => {
    if (!nextPatients.length) {
      activePatientEntryId.value = null;
      return;
    }
    const isActiveStillVisible = nextPatients.some(
      (item) => item.entryId === activePatientEntryId.value
    );
    if (!isActiveStillVisible) {
      activePatientEntryId.value =
        nextPatients.find((item) => !item.data.archived)?.entryId ??
        nextPatients[0].entryId;
    }
  },
  { immediate: true }
);

watch(isEditPatientDialogOpen, (nextValue) => {
  if (nextValue) return;
  editingPatient.value = null;
  newPatientName.value = "";
  newPatientDob.value = "";
  newPatientNhsNumber.value = "";
  newPatientTags.value = "";
  newPatientArchived.value = false;
  patientVisibility.value = "private";
});

watch(isAddPatientDialogOpen, (nextValue) => {
  if (nextValue) return;
  newPatientName.value = "";
  newPatientDob.value = "";
  newPatientNhsNumber.value = "";
  newPatientTags.value = "";
  newPatientArchived.value = false;
  patientVisibility.value = "private";
});

watch(isAddNoteDialogOpen, (nextValue) => {
  if (nextValue) return;
  newNoteTitle.value = "";
  newNoteBody.value = "";
  newNoteEncounterDate.value = "";
  noteVisibility.value = "private";
  noteShareUser.value = null;
});

watch(isAddMedDialogOpen, (nextValue) => {
  if (nextValue) return;
  newMedName.value = "";
  newMedDose.value = "";
  newMedInstructions.value = "";
  newMedStartDate.value = "";
  newMedEndDate.value = "";
  medVisibility.value = "private";
  medShareUser.value = null;
});

function openAddPatientDialog() {
  if (!canAddItem.value) return;
  patientVisibility.value = "private";
  isAddPatientDialogOpen.value = true;
}

function openEditPatientDialog(entry: PatientEntry) {
  if (!canAddItem.value || entry.data.keyMissing) return;
  editingPatient.value = entry;
  newPatientName.value = entry.data.displayName ?? "";
  newPatientDob.value = entry.data.dob ?? "";
  newPatientNhsNumber.value = entry.data.nhsNumber ?? "";
  newPatientTags.value = (entry.data.tags ?? []).join(", ");
  newPatientArchived.value = Boolean(entry.data.archived);
  patientVisibility.value = entry.data.permissionId || entry.data.permission
    ? "private"
    : "public";
  isEditPatientDialogOpen.value = true;
}

function parseTags(raw: string) {
  const tokens = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return tokens.length ? tokens : undefined;
}

async function ensureExposurePermission(
  patient: Patient,
  user: any
): Promise<string | null> {
  if (!user?.publicIdentityKey || !user?.publicEncryptionKey) return null;
  const identity = stripIdentityKey(user.publicIdentityKey);
  const existing = patient.exposures?.find(
    (entry) => entry.identity === identity
  );
  if (existing?.permissionId) return existing.permissionId;

  const permission = await createPermission(generateId());
  if (!permission?.id) return null;

  await addUserPermission(
    permission.id,
    user.publicIdentityKey,
    user.publicEncryptionKey
  );

  if (patient.permissionId || patient.permission) {
    const nextExposures = [...(patient.exposures ?? []), { identity, permissionId: permission.id }];
    await addItem(
      stripUndefined({
        ...patient,
        exposures: nextExposures,
        updatedAt: Date.now(),
      }),
      "patients",
      patient.permissionId ?? patient.permission ?? null
    );
  }

  return permission.id;
}

async function resolveVisibilityPermission(
  visibility: "private" | "public" | "share",
  patient: Patient | null,
  user: any
) {
  if (visibility === "public") return null;
  if (visibility === "private") return myIdentity.value || null;
  if (!patient) return null;
  return ensureExposurePermission(patient, user);
}

async function addPatient() {
  const displayName = newPatientName.value.trim();
  if (!displayName) return;
  let permissionId: string | null = null;
  if (patientVisibility.value === "private") {
    if (!myIdentity.value) return;
    permissionId = myIdentity.value || null;
  }

  await addItem(
    stripUndefined({
      id: generateId(),
      displayName,
      ...(newPatientDob.value ? { dob: newPatientDob.value } : {}),
      ...(newPatientNhsNumber.value
        ? { nhsNumber: newPatientNhsNumber.value }
        : {}),
      ...(parseTags(newPatientTags.value)
        ? { tags: parseTags(newPatientTags.value) }
        : {}),
      ...(newPatientArchived.value ? { archived: true } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
    "patients",
    permissionId
  );
  isAddPatientDialogOpen.value = false;
}

async function updatePatient() {
  if (!editingPatient.value) return;
  const displayName = newPatientName.value.trim();
  if (!displayName) return;
  const current = editingPatient.value.data;
  await addItem(
    stripUndefined({
      ...current,
      displayName,
      ...(newPatientDob.value ? { dob: newPatientDob.value } : {}),
      ...(newPatientNhsNumber.value
        ? { nhsNumber: newPatientNhsNumber.value }
        : {}),
      ...(parseTags(newPatientTags.value)
        ? { tags: parseTags(newPatientTags.value) }
        : {}),
      archived: newPatientArchived.value || false,
      updatedAt: Date.now(),
    }),
    "patients",
    current.permissionId ?? current.permission ?? null
  );
  isEditPatientDialogOpen.value = false;
}

async function toggleArchive(patient: Patient) {
  await addItem(
    stripUndefined({
      ...patient,
      archived: !patient.archived,
      updatedAt: Date.now(),
    }),
    "patients",
    patient.permissionId ?? patient.permission ?? null
  );
}

function openAddNoteDialog() {
  if (!activePatient.value || activePatient.value.data.keyMissing) return;
  noteVisibility.value = "private";
  isAddNoteDialogOpen.value = true;
}

async function addNote() {
  if (!activePatient.value) return;
  const body = newNoteBody.value.trim();
  if (!body) return;
  if (noteVisibility.value === "share" && !noteShareUser.value) return;
  const permissionId = await resolveVisibilityPermission(
    noteVisibility.value,
    activePatient.value.data,
    noteShareUser.value
  );
  await addItem(
    stripUndefined({
      id: generateId(),
      patientId: activePatient.value.data.id,
      patientDisplayName: activePatient.value.data.displayName,
      ...(newNoteTitle.value.trim()
        ? { title: newNoteTitle.value.trim() }
        : {}),
      body,
      ...(newNoteEncounterDate.value
        ? { encounterDate: newNoteEncounterDate.value }
        : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
    "patient-notes",
    permissionId
  );
  isAddNoteDialogOpen.value = false;
}

function openAddMedDialog() {
  if (!activePatient.value || activePatient.value.data.keyMissing) return;
  medVisibility.value = "private";
  isAddMedDialogOpen.value = true;
}

async function addMedication() {
  if (!activePatient.value) return;
  const name = newMedName.value.trim();
  if (!name) return;
  if (medVisibility.value === "share" && !medShareUser.value) return;
  const permissionId = await resolveVisibilityPermission(
    medVisibility.value,
    activePatient.value.data,
    medShareUser.value
  );
  await addItem(
    stripUndefined({
      id: generateId(),
      patientId: activePatient.value.data.id,
      patientDisplayName: activePatient.value.data.displayName,
      name,
      ...(newMedDose.value.trim() ? { dose: newMedDose.value.trim() } : {}),
      ...(newMedInstructions.value.trim()
        ? { instructions: newMedInstructions.value.trim() }
        : {}),
      ...(newMedStartDate.value ? { startDate: newMedStartDate.value } : {}),
      ...(newMedEndDate.value ? { endDate: newMedEndDate.value } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
    "patient-meds",
    permissionId
  );
  isAddMedDialogOpen.value = false;
}
</script>

<template>
  <div class="w-full flex flex-1 min-h-0 font-mono">
    <aside
      class="hidden lg:flex flex-col w-64 border-r border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 gap-4"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-end">
          <Button
            type="button"
            size="xs"
            variant="plain-secondary"
            class="text-xs tracking-[0.16em]"
            @click="openAddPatientDialog"
          >
            Add patient
          </Button>
        </div>
        <SListButton
          v-for="scope in scopeOptions"
          :key="scope.value"
          :active="selectedScope === scope.value"
          variant="primary"
          @click="selectedScope = scope.value"
          size="sm"
        >
          <span class="truncate">{{ scope.label }}</span>
        </SListButton>
      </div>
    </aside>

    <section class="flex-1 flex flex-col gap-4 min-h-0">
      <header
        class="sticky top-0 z-10 flex flex-wrap gap-3 items-center justify-between px-4 py-3 backdrop-blur border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 90%, transparent)]"
      >
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-thin">Patient records</h2>
          <span class="text-xs text-[var(--ui-fg-muted)]">
            {{ filteredPatients.length }} patients
          </span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <SSegmentedControl
            v-model="selectedStatus"
            :items="statusOptions"
            size="xs"
            aria-label="Patient status"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            :disabled="!canAddItem"
            @click="openAddPatientDialog"
          >
            <span
              class="flex items-center justify-center size-6 rounded-full border border-[var(--ui-border)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </span>
            Add patient
          </Button>
        </div>
      </header>

      <div class="lg:hidden flex gap-2 overflow-x-auto pb-2">
        <SListButton
          v-for="scope in scopeOptions"
          :key="scope.value"
          size="sm"
          :full-width="false"
          :active="selectedScope === scope.value"
          variant="primary"
          class="shrink-0"
          @click="selectedScope = scope.value"
        >
          {{ scope.label }}
        </SListButton>
      </div>

      <div class="overflow-hidden flex-1">
        <div class="flex-1 min-h-0 flex flex-col xl:flex-row gap-3">
          <div class="flex-1 overflow-auto min-h-0 flex flex-col gap-3">
            <ul
              class="w-full flex flex-col border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))]"
            >
              <li
                v-for="item in filteredPatients"
                :key="item.entryId"
                class="border-b border-[var(--ui-border)] last:border-b-0"
              >
                <div
                  class="flex items-center gap-3 px-3 py-2 text-sm transition"
                  :class="
                    item.entryId === activePatientEntryId
                      ? 'bg-[var(--ui-surface-hover)]'
                      : 'hover:bg-[var(--ui-surface-hover)]/70'
                  "
                  @click="activePatientEntryId = item.entryId"
                >
                  <Button
                    v-if="!item.data.keyMissing"
                    type="button"
                    size="xs"
                    variant="plain-secondary"
                    class="!h-7 !w-7 !px-0 !rounded-full border border-[var(--ui-border)] text-[var(--ui-fg-muted)]"
                    :class="
                      item.data.archived
                        ? 'text-[var(--ui-fg-muted)] border-[var(--ui-border)]'
                        : 'hover:border-[var(--ui-secondary)]/70'
                    "
                    @click.stop="toggleArchive(item.data)"
                    aria-label="Toggle archived"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      class="size-4"
                      :class="item.data.archived ? '' : 'opacity-30'"
                    >
                      <path
                        d="M3 7.5A2.25 2.25 0 0 1 5.25 5.25h13.5A2.25 2.25 0 0 1 21 7.5v.75a.75.75 0 0 1-.75.75H3.75A.75.75 0 0 1 3 8.25V7.5Z"
                      />
                      <path
                        fill-rule="evenodd"
                        d="M5.25 9.75h13.5v7.5A2.25 2.25 0 0 1 16.5 19.5h-9A2.25 2.25 0 0 1 5.25 17.25v-7.5Zm4.5 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </Button>
                  <span
                    v-else
                    class="flex items-center justify-center size-7 rounded-full border border-[var(--ui-border)] text-[var(--ui-critical)] opacity-70"
                    aria-label="Insufficient permission"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="size-4"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                  </span>

                  <div class="flex-1 min-w-0">
                    <p
                      class="truncate"
                      :class="
                        item.data.archived
                          ? 'line-through text-[var(--ui-fg-muted)]'
                          : 'text-[var(--ui-fg)]'
                      "
                    >
                      {{
                        item.data.keyMissing
                          ? "Insufficient permission"
                          : item.data.displayName
                      }}
                    </p>
                  </div>

                  <div
                    class="ml-auto flex items-center gap-2 text-xs text-[var(--ui-fg-muted)]"
                  >
                    <Button
                      v-if="!item.data.keyMissing"
                      type="button"
                      size="xs"
                      variant="plain-secondary"
                      class="!h-7 !w-7 !px-0 !rounded-full border border-[var(--ui-border)] text-[var(--ui-fg-muted)] transition hover:border-[var(--ui-secondary)]/70 hover:text-[var(--ui-fg)]"
                      aria-label="Edit patient"
                      @click.stop="openEditPatientDialog(item)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19.5 7.125 16.862 4.487"
                        />
                      </svg>
                    </Button>
                    <SBadge
                      v-if="item.data.shared"
                      size="xs"
                      tone="secondary"
                      variant="outline"
                    >
                      Shared
                    </SBadge>
                    <SBadge
                      v-else-if="item.data.permissionId || item.data.permission"
                      size="xs"
                      tone="secondary"
                      variant="outline"
                      class="flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-3"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                      Private
                    </SBadge>
                    <SBadge
                      v-else
                      size="xs"
                      tone="neutral"
                      variant="outline"
                    >
                      Public
                    </SBadge>
                    <SBadge
                      v-if="item.data.archived"
                      size="xs"
                      tone="neutral"
                      variant="outline"
                    >
                      Archived
                    </SBadge>
                    <SBadge
                      v-if="item.data?.createdAt"
                      size="xs"
                      tone="neutral"
                      variant="outline"
                    >
                      {{ formatDate(item.data.createdAt, { dateStyle: "medium" }) }}
                    </SBadge>
                  </div>
                </div>
              </li>
              <li v-if="!filteredPatients.length" class="py-8 px-3 text-sm">
                <div
                  class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
                >
                  No patients yet. Use the add patient button to get started.
                </div>
              </li>
            </ul>
          </div>

          <aside
            class="w-full xl:w-96 border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 flex flex-col gap-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs uppercase tracking-[0.16em] opacity-60">
                  Patient detail
                </p>
                <h3 class="text-base font-semibold truncate">
                  {{
                    activePatient?.data?.displayName ||
                    "Select a patient to view"
                  }}
                </h3>
                <p class="text-xs text-[var(--ui-fg-muted)]">
                  {{ activePatient?.data?.shared ? "Shared record" : "Owned record" }}
                </p>
              </div>
              <Button
                type="button"
                size="xs"
                variant="secondary"
                class="!rounded-full"
                :disabled="!activePatient || activePatient.data?.keyMissing"
                @click="openAddNoteDialog"
              >
                Add note
              </Button>
            </div>

            <div v-if="activePatient?.data?.keyMissing" class="text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                Insufficient permission to view this chart.
              </div>
            </div>

            <template v-else>
              <div v-if="activePatient" class="flex flex-col gap-2 text-sm">
                <div class="flex flex-wrap gap-2 text-xs">
                  <SBadge
                    v-if="activePatient.data.shared"
                    size="xs"
                    tone="secondary"
                    variant="outline"
                  >
                    Shared
                  </SBadge>
                  <SBadge
                    v-else-if="!activePatient.data.permissionId && !activePatient.data.permission"
                    size="xs"
                    tone="neutral"
                    variant="outline"
                  >
                    Demo public record
                  </SBadge>
                  <SBadge
                    v-if="activePatient.data.archived"
                    size="xs"
                    tone="neutral"
                    variant="outline"
                  >
                    Archived
                  </SBadge>
                  <SBadge
                    v-if="activePatient.data?.createdAt"
                    size="xs"
                    tone="neutral"
                    variant="outline"
                  >
                    {{
                      formatDate(activePatient.data.createdAt, {
                        dateStyle: "medium",
                      })
                    }}
                  </SBadge>
                </div>
                <div class="flex flex-col gap-1 text-xs">
                  <span class="uppercase tracking-[0.14em] opacity-60">
                    DOB
                  </span>
                  <span>
                    {{
                      activePatient.data.dob
                        ? formatDate(activePatient.data.dob, {
                            dateStyle: "medium",
                          })
                        : "Not recorded"
                    }}
                  </span>
                </div>
                <div class="flex flex-col gap-1 text-xs">
                  <span class="uppercase tracking-[0.14em] opacity-60">
                    NHS number
                  </span>
                  <span>{{ activePatient.data.nhsNumber || "Not recorded" }}</span>
                </div>
                <div class="flex flex-col gap-1 text-xs">
                  <span class="uppercase tracking-[0.14em] opacity-60">Tags</span>
                  <span>
                    {{
                      activePatient.data.tags?.length
                        ? activePatient.data.tags.join(", ")
                        : "None"
                    }}
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs uppercase tracking-[0.16em] opacity-60">
                    Notes
                  </p>
                  <p class="text-xs text-[var(--ui-fg-muted)]">
                    {{ activeNotes.length }} entries
                  </p>
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  class="!rounded-full"
                  :disabled="!activePatient"
                  @click="openAddNoteDialog"
                >
                  Add
                </Button>
              </div>

              <div v-if="activeNotes.length" class="flex flex-col gap-2">
                <div
                  v-for="note in activeNotes"
                  :key="note.entryId"
                  class="border border-[var(--ui-border)] p-3 text-xs"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="font-semibold truncate">
                      {{ note.data.title || "Clinical note" }}
                    </p>
                    <span class="text-[var(--ui-fg-muted)]">
                      {{
                        note.data.encounterDate
                          ? formatDate(note.data.encounterDate, {
                              dateStyle: "medium",
                            })
                          : formatDate(note.data.createdAt, {
                              dateStyle: "medium",
                            })
                      }}
                    </span>
                  </div>
                  <p class="mt-2 text-[var(--ui-fg-muted)]">
                    {{ note.data.body }}
                  </p>
                </div>
              </div>
              <div
                v-else
                class="border border-dashed border-[var(--ui-border)] px-3 py-4 text-xs text-[var(--ui-fg-muted)]"
              >
                No notes yet.
              </div>

              <div class="flex items-center justify-between mt-2">
                <div>
                  <p class="text-xs uppercase tracking-[0.16em] opacity-60">
                    Medications
                  </p>
                  <p class="text-xs text-[var(--ui-fg-muted)]">
                    {{ activeMeds.length }} entries
                  </p>
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  class="!rounded-full"
                  :disabled="!activePatient"
                  @click="openAddMedDialog"
                >
                  Add
                </Button>
              </div>

              <div v-if="activeMeds.length" class="flex flex-col gap-2">
                <div
                  v-for="med in activeMeds"
                  :key="med.entryId"
                  class="border border-[var(--ui-border)] p-3 text-xs"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="font-semibold truncate">{{ med.data.name }}</p>
                    <span class="text-[var(--ui-fg-muted)]">
                      {{
                        med.data.startDate
                          ? formatDate(med.data.startDate, {
                              dateStyle: "medium",
                            })
                          : formatDate(med.data.createdAt, {
                              dateStyle: "medium",
                            })
                      }}
                    </span>
                  </div>
                  <div class="mt-2 flex flex-col gap-1 text-[var(--ui-fg-muted)]">
                    <span v-if="med.data.dose">Dose: {{ med.data.dose }}</span>
                    <span v-if="med.data.instructions">
                      {{ med.data.instructions }}
                    </span>
                    <span v-if="med.data.endDate">
                      Ends: {{ formatDate(med.data.endDate, { dateStyle: "medium" }) }}
                    </span>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="border border-dashed border-[var(--ui-border)] px-3 py-4 text-xs text-[var(--ui-fg-muted)]"
              >
                No medications yet.
              </div>
            </template>
          </aside>
        </div>
      </div>
    </section>

    <SDialog
      v-model:open="isAddPatientDialogOpen"
      size="lg"
      title="Add patient"
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-3">
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Display name
        </label>
        <input
          v-model="newPatientName"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. Taylor Jones"
        />
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Visibility
        </div>
        <SSegmentedControl
          v-model="patientVisibility"
          :items="patientVisibilityOptions"
          size="xs"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          DOB
        </label>
        <input
          v-model="newPatientDob"
          type="date"
          class="border border-[var(--ui-border)] px-3 py-2"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          NHS number (demo)
        </label>
        <input
          v-model="newPatientNhsNumber"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. 987 654 3210"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Tags
        </label>
        <input
          v-model="newPatientTags"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. respiratory, cardiology"
        />
        <label class="flex items-center gap-2 text-xs">
          <input v-model="newPatientArchived" type="checkbox" />
          Mark as archived
        </label>
        <Button type="button" size="sm" variant="primary" @click="addPatient">
          Save patient
        </Button>
      </div>
    </SDialog>

    <SDialog
      v-if="editingPatient"
      v-model:open="isEditPatientDialogOpen"
      size="lg"
      title="Edit patient"
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 7.125 16.862 4.487"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-3">
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Display name
        </label>
        <input
          v-model="newPatientName"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          DOB
        </label>
        <input
          v-model="newPatientDob"
          type="date"
          class="border border-[var(--ui-border)] px-3 py-2"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          NHS number (demo)
        </label>
        <input
          v-model="newPatientNhsNumber"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Tags
        </label>
        <input
          v-model="newPatientTags"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
        />
        <label class="flex items-center gap-2 text-xs">
          <input v-model="newPatientArchived" type="checkbox" />
          Mark as archived
        </label>
        <Button
          type="button"
          size="sm"
          variant="primary"
          @click="updatePatient"
        >
          Save changes
        </Button>
      </div>
    </SDialog>

    <SDialog
      v-model:open="isAddNoteDialogOpen"
      size="lg"
      title="Add clinical note"
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-3">
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Title
        </label>
        <input
          v-model="newNoteTitle"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. Follow-up"
        />
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Visibility
        </div>
        <SSegmentedControl
          v-model="noteVisibility"
          :items="detailVisibilityOptions"
          size="xs"
        />
        <div v-if="noteVisibility === 'share'" class="flex flex-col gap-2">
          <UserPicker v-model="noteShareUser" />
          <span class="text-xs text-[var(--ui-fg-muted)]">
            Share this note with one person.
          </span>
        </div>
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Encounter date
        </label>
        <input
          v-model="newNoteEncounterDate"
          type="date"
          class="border border-[var(--ui-border)] px-3 py-2"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Note
        </label>
        <textarea
          v-model="newNoteBody"
          rows="4"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="Clinical context and summary"
        />
        <Button type="button" size="sm" variant="primary" @click="addNote">
          Save note
        </Button>
      </div>
    </SDialog>

    <SDialog
      v-model:open="isAddMedDialogOpen"
      size="lg"
      title="Add medication"
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-3">
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Medication name
        </label>
        <input
          v-model="newMedName"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. Atorvastatin"
        />
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Visibility
        </div>
        <SSegmentedControl
          v-model="medVisibility"
          :items="detailVisibilityOptions"
          size="xs"
        />
        <div v-if="medVisibility === 'share'" class="flex flex-col gap-2">
          <UserPicker v-model="medShareUser" />
          <span class="text-xs text-[var(--ui-fg-muted)]">
            Share this medication with one person.
          </span>
        </div>
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Dose
        </label>
        <input
          v-model="newMedDose"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. 10mg"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Instructions
        </label>
        <textarea
          v-model="newMedInstructions"
          rows="3"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. Take once daily with food"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Start date
        </label>
        <input
          v-model="newMedStartDate"
          type="date"
          class="border border-[var(--ui-border)] px-3 py-2"
        />
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          End date
        </label>
        <input
          v-model="newMedEndDate"
          type="date"
          class="border border-[var(--ui-border)] px-3 py-2"
        />
        <Button
          type="button"
          size="sm"
          variant="primary"
          @click="addMedication"
        >
          Save medication
        </Button>
      </div>
    </SDialog>
  </div>
</template>
