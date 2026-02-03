<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from "vue";
import { generateId, stripIdentityKey } from "ternent-utils";
import {
  SBadge,
  SDialog,
  SListButton,
  SSegmentedControl,
} from "ternent-ui/components";
import { Button } from "ternent-ui/primitives";

import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import UserPicker from "../../module/user/UserPicker.vue";

const { bridge, addItem, createPermission, addUserPermission } = useLedger();
const { publicKeyPEM } = useIdentity();

type PatientChart = {
  id: string;
  title: string;
  patientId: string;
  authorId?: string;
  createdAt: number;
  updatedAt: number;
  keyMissing?: boolean;
  permission?: string;
  permissionId?: string | null;
  [key: string]: unknown;
};

type PatientChartEntry = {
  entryId: string;
  data: PatientChart;
};

type PermissionGrant = {
  permissionId: string;
  identity: string;
};

type PermissionGrantEntry = {
  entryId: string;
  data: PermissionGrant;
};

type Patient = {
  id: string;
  displayName: string;
  authorId?: string;
  dob?: string;
  nhsNumber?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
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
  chartId: string;
  patientDisplayName?: string;
  title?: string;
  body: string;
  encounterDate?: string;
  createdAt: number;
  updatedAt: number;
  authorId?: string;
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
  chartId: string;
  patientDisplayName?: string;
  name: string;
  dose?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  createdAt: number;
  updatedAt: number;
  authorId?: string;
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

const charts = computed<PatientChartEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.["patient-charts"] || {})
      .sort((a, b) => {
        const aDate = a.data.updatedAt ?? a.data.createdAt ?? 0;
        const bDate = b.data.updatedAt ?? b.data.createdAt ?? 0;
        return bDate - aDate;
      })
      .map((entry) => ({
        entryId: entry.entryId,
        data: entry.data as PatientChart,
      })) as PatientChartEntry[]
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

const notesByChartId = computed(() => {
  const entries = Object.values(
    bridge.collections.byKind.value?.["patient-notes"] || {}
  ) as NoteEntry[];
  const map = new Map<string, NoteEntry[]>();
  for (const entry of entries) {
    if (!entry?.data?.patientId || !entry?.data?.chartId) continue;
    const current = map.get(entry.data.chartId) ?? [];
    current.push(entry);
    map.set(entry.data.chartId, current);
  }
  for (const [chartId, list] of map.entries()) {
    list.sort((a, b) => {
      const aDate = a.data.encounterDate
        ? new Date(a.data.encounterDate).getTime()
        : a.data.createdAt || 0;
      const bDate = b.data.encounterDate
        ? new Date(b.data.encounterDate).getTime()
        : b.data.createdAt || 0;
      return bDate - aDate;
    });
    map.set(chartId, list);
  }
  return map;
});

const medsByChartId = computed(() => {
  const entries = Object.values(
    bridge.collections.byKind.value?.["patient-meds"] || {}
  ) as MedicationEntry[];
  const map = new Map<string, MedicationEntry[]>();
  for (const entry of entries) {
    if (!entry?.data?.patientId || !entry?.data?.chartId) continue;
    const current = map.get(entry.data.chartId) ?? [];
    current.push(entry);
    map.set(entry.data.chartId, current);
  }
  for (const [chartId, list] of map.entries()) {
    list.sort((a, b) => {
      const aDate = a.data.startDate
        ? new Date(a.data.startDate).getTime()
        : a.data.createdAt || 0;
      const bDate = b.data.startDate
        ? new Date(b.data.startDate).getTime()
        : b.data.createdAt || 0;
      return bDate - aDate;
    });
    map.set(chartId, list);
  }
  return map;
});

const permissionGrants = computed<PermissionGrantEntry[]>(
  () =>
    Object.values(
      bridge.collections.byKind.value?.["permission-grants"] || {}
    ) as PermissionGrantEntry[]
);

const usersByIdentity = computed(() => {
  const entries = Object.values(
    bridge.collections.byKind.value?.users || {}
  ) as {
    data: {
      publicIdentityKey?: string;
      publicEncryptionKey?: string;
      name?: string;
    };
  }[];
  const map = new Map<
    string,
    {
      publicIdentityKey?: string;
      publicEncryptionKey?: string;
      name?: string;
    }
  >();
  for (const entry of entries) {
    if (!entry?.data?.publicIdentityKey) continue;
    map.set(stripIdentityKey(entry.data.publicIdentityKey), entry.data);
  }
  return map;
});

const myIdentity = computed(() =>
  publicKeyPEM?.value ? stripIdentityKey(publicKeyPEM.value) : ""
);

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);

const activePatientId = shallowRef<string | null>(null);
const activeChartId = shallowRef<string | null>(null);
const selectedStatus = shallowRef<"all" | "active" | "archived">("all");

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const isAddPatientDialogOpen = ref(false);
const isEditPatientDialogOpen = ref(false);
const editingPatient = shallowRef<PatientEntry | null>(null);
const isAddChartDialogOpen = ref(false);
const isMembersDialogOpen = ref(false);

const newPatientName = shallowRef("");
const newPatientDob = shallowRef("");
const newPatientNhsNumber = shallowRef("");
const newPatientTags = shallowRef("");
const newPatientArchived = ref(false);
const patientVisibility = shallowRef<"private" | "public">("private");
const newPatientMember = shallowRef<any | null>(null);
const newPatientMembers = ref<any[]>([]);
const selectedUsersByPermission = reactive<Record<string, any>>({});

const newChartTitle = shallowRef("");

const isAddNoteDialogOpen = ref(false);
const newNoteTitle = shallowRef("");
const newNoteBody = shallowRef("");
const newNoteEncounterDate = shallowRef("");

const isAddMedDialogOpen = ref(false);
const newMedName = shallowRef("");
const newMedDose = shallowRef("");
const newMedInstructions = shallowRef("");
const newMedStartDate = shallowRef("");
const newMedEndDate = shallowRef("");

const patientVisibilityOptions = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
];

const filteredPatients = computed(() => {
  if (selectedStatus.value === "active") {
    return patients.value.filter((item) => !item.data.archived);
  }
  if (selectedStatus.value === "archived") {
    return patients.value.filter((item) => item.data.archived);
  }
  return patients.value;
});

const activePatient = computed(
  () =>
    patients.value.find((item) => item.data.id === activePatientId.value) ??
    null
);

const activePatientPermissionId = computed(
  () =>
    activePatient.value?.data.permissionId ??
    activePatient.value?.data.permission ??
    null
);

const permissionMembers = computed(() => {
  if (!activePatientPermissionId.value) return [];
  return permissionGrants.value.filter(
    (grant) => grant.data.permissionId === activePatientPermissionId.value
  );
});

const patientCharts = computed(() => {
  if (!activePatient.value || activePatient.value.data.keyMissing) return [];
  return charts.value
    .filter((chart) => chart.data.patientId === activePatient.value?.data.id)
    .sort((a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0));
});

const activeChart = computed(
  () =>
    patientCharts.value.find(
      (chart) => chart.data.id === activeChartId.value
    ) ?? null
);

const activeNotes = computed(() => {
  if (!activeChart.value?.data?.id) return [];
  return notesByChartId.value.get(activeChart.value.data.id) ?? [];
});

const activeMeds = computed(() => {
  if (!activeChart.value?.data?.id) return [];
  return medsByChartId.value.get(activeChart.value.data.id) ?? [];
});

watch(
  filteredPatients,
  (nextPatients) => {
    if (!nextPatients.length) {
      activePatientId.value = null;
      return;
    }
    const isActiveStillVisible = nextPatients.some(
      (item) => item.data.id === activePatientId.value
    );
    if (!isActiveStillVisible) {
      activePatientId.value =
        nextPatients.find((item) => !item.data.archived)?.data.id ??
        nextPatients[0].data.id;
    }
  },
  { immediate: true }
);

watch(
  patientCharts,
  (nextCharts) => {
    if (!nextCharts.length) {
      activeChartId.value = null;
      return;
    }
    const isActiveStillVisible = nextCharts.some(
      (item) => item.data.id === activeChartId.value
    );
    if (!isActiveStillVisible) {
      activeChartId.value = nextCharts[0].data.id;
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
});

watch(isAddPatientDialogOpen, (nextValue) => {
  if (nextValue) return;
  newPatientName.value = "";
  newPatientDob.value = "";
  newPatientNhsNumber.value = "";
  newPatientTags.value = "";
  newPatientArchived.value = false;
  patientVisibility.value = "private";
  newPatientMember.value = null;
  newPatientMembers.value = [];
});

watch(isAddChartDialogOpen, (nextValue) => {
  if (nextValue) return;
  newChartTitle.value = "";
});

watch(isAddNoteDialogOpen, (nextValue) => {
  if (nextValue) return;
  newNoteTitle.value = "";
  newNoteBody.value = "";
  newNoteEncounterDate.value = "";
});

watch(isAddMedDialogOpen, (nextValue) => {
  if (nextValue) return;
  newMedName.value = "";
  newMedDose.value = "";
  newMedInstructions.value = "";
  newMedStartDate.value = "";
  newMedEndDate.value = "";
});

function openAddPatientDialog() {
  if (!canAddItem.value) return;
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
  isEditPatientDialogOpen.value = true;
}

function parseTags(raw: string) {
  const tokens = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return tokens.length ? tokens : undefined;
}

function openAddChartDialog() {
  if (!canAddItem.value) return;
  if (!activePatient.value || activePatient.value.data.keyMissing) return;
  isAddChartDialogOpen.value = true;
}

function openMembersDialog() {
  if (!activePatientPermissionId.value) return;
  isMembersDialogOpen.value = true;
}

function addPatientMember() {
  if (!newPatientMember.value) return;
  const next = newPatientMember.value;
  const exists = newPatientMembers.value.some(
    (member) => member?.publicIdentityKey === next?.publicIdentityKey
  );
  if (!exists) newPatientMembers.value = [...newPatientMembers.value, next];
  newPatientMember.value = null;
}

async function addUserToPatient(permissionId: string) {
  const selectedUser = selectedUsersByPermission[permissionId];
  if (!selectedUser) return;
  await addUserPermission(
    permissionId,
    selectedUser.publicIdentityKey,
    selectedUser.publicEncryptionKey
  );
  selectedUsersByPermission[permissionId] = null;
}

async function createPatient() {
  const displayName = newPatientName.value.trim();
  if (!displayName) return;
  if (!myIdentity.value) return;
  let permissionId: string | null = null;
  if (patientVisibility.value === "private") {
    const permission = await createPermission(displayName, "patients");
    if (!permission?.id) return;
    permissionId = permission.id;
    if (newPatientMembers.value.length) {
      for (const member of newPatientMembers.value) {
        if (!member?.publicIdentityKey || !member?.publicEncryptionKey)
          continue;
        await addUserPermission(
          permission.id,
          member.publicIdentityKey,
          member.publicEncryptionKey
        );
      }
    }
  }
  const patientId = generateId();
  await addItem(
    stripUndefined({
      id: patientId,
      displayName,
      authorId: myIdentity.value,
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
  activePatientId.value = patientId;
  isAddPatientDialogOpen.value = false;
}

async function addChart() {
  if (!activePatient.value) return;
  const title = newChartTitle.value.trim();
  if (!title) return;
  if (!myIdentity.value) return;
  const permissionId = activePatientPermissionId.value ?? null;
  const chartId = generateId();
  await addItem(
    {
      id: chartId,
      title,
      patientId: activePatient.value.data.id,
      authorId: myIdentity.value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    "patient-charts",
    permissionId
  );
  activeChartId.value = chartId;
  isAddChartDialogOpen.value = false;
}

async function rotatePatientKey() {
  if (!activePatient.value || !activePatientPermissionId.value) return;
  const permission = await createPermission(
    `${activePatient.value.data.displayName} (rotated)`,
    "patients"
  );
  if (!permission?.id) return;
  for (const member of permissionMembers.value) {
    const user = usersByIdentity.value.get(member.data.identity);
    if (!user?.publicIdentityKey || !user?.publicEncryptionKey) continue;
    await addUserPermission(
      permission.id,
      user.publicIdentityKey,
      user.publicEncryptionKey
    );
  }
  await addItem(
    {
      ...activePatient.value.data,
      permissionId: permission.id,
      updatedAt: Date.now(),
    },
    "patients",
    permission.id
  );
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

function openAddNoteDialog() {
  if (!activePatient.value || activePatient.value.data.keyMissing) return;
  if (!activeChart.value || activeChart.value.data.keyMissing) return;
  isAddNoteDialogOpen.value = true;
}

async function addNote() {
  if (!activePatient.value || !activeChart.value) return;
  if (activeChart.value.data.keyMissing) return;
  const body = newNoteBody.value.trim();
  if (!body) return;
  if (!myIdentity.value) return;
  const permissionId = activePatientPermissionId.value ?? null;
  await addItem(
    stripUndefined({
      id: generateId(),
      patientId: activePatient.value.data.id,
      chartId: activeChart.value.data.id,
      patientDisplayName: activePatient.value.data.displayName,
      authorId: myIdentity.value,
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
  if (!activeChart.value || activeChart.value.data.keyMissing) return;
  isAddMedDialogOpen.value = true;
}

async function addMedication() {
  if (!activePatient.value || !activeChart.value) return;
  if (activeChart.value.data.keyMissing) return;
  const name = newMedName.value.trim();
  if (!name) return;
  if (!myIdentity.value) return;
  const permissionId = activePatientPermissionId.value ?? null;
  await addItem(
    stripUndefined({
      id: generateId(),
      patientId: activePatient.value.data.id,
      chartId: activeChart.value.data.id,
      patientDisplayName: activePatient.value.data.displayName,
      name,
      authorId: myIdentity.value,
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
        <div class="flex items-center justify-between text-xs">
          <span class="uppercase tracking-[0.16em] opacity-60"> Patients </span>
          <Button
            type="button"
            size="xs"
            variant="plain-secondary"
            class="text-[11px] uppercase tracking-[0.12em]"
            @click="openAddPatientDialog"
          >
            Add patient
          </Button>
        </div>
        <SListButton
          v-for="patient in filteredPatients"
          :key="patient.entryId"
          :active="activePatientId === patient.data.id"
          variant="secondary"
          @click="activePatientId = patient.data.id"
          size="sm"
        >
          <div class="flex items-center gap-2">
            <IdentityAvatar
              v-if="patient.data.authorId"
              :identity="
                usersByIdentity.get(patient.data.authorId)?.publicIdentityKey ||
                patient.data.authorId
              "
              size="xs"
            />
            <span class="truncate">
              {{
                patient.data.keyMissing
                  ? "Insufficient permission"
                  : patient.data.displayName
              }}
            </span>
          </div>
        </SListButton>
        <div v-if="!filteredPatients.length" class="text-xs opacity-60">
          No patients yet.
        </div>
      </div>
    </aside>

    <section class="flex-1 flex flex-col gap-4 min-h-0">
      <header
        class="sticky top-0 z-10 flex flex-wrap gap-3 items-center justify-between px-4 py-3 backdrop-blur border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 90%, transparent)]"
      >
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-thin">
            {{ activePatient?.data?.displayName || "Patients" }}
          </h2>
          <span class="text-xs text-[var(--ui-fg-muted)]">
            {{
              activePatient
                ? `${patientCharts.length} charts`
                : `${filteredPatients.length} patients`
            }}
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
            :disabled="
              !canAddItem || !activePatient || activePatient.data?.keyMissing
            "
            @click="openAddChartDialog"
          >
            Add chart
          </Button>
          <Button
            v-if="activePatientPermissionId && !activePatient?.data?.keyMissing"
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            @click="openMembersDialog"
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
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-7.346A9 9 0 0 0 12 3a9 9 0 0 0-9.741 8.374A9.094 9.094 0 0 0 6 18.72M12 9.75a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
                />
              </svg>
            </span>
            Members ({{ permissionMembers.length }})
          </Button>
          <Button
            v-if="activePatientPermissionId && !activePatient?.data?.keyMissing"
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            @click="rotatePatientKey"
          >
            Rotate key
          </Button>
          <Button
            v-if="activePatient && !activePatient.data?.keyMissing"
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            @click="openEditPatientDialog(activePatient)"
          >
            Edit
          </Button>
        </div>
      </header>

      <div class="lg:hidden flex gap-2 overflow-x-auto pb-2">
        <SListButton
          v-for="patient in filteredPatients"
          :key="patient.entryId"
          size="sm"
          :full-width="false"
          :active="activePatientId === patient.data.id"
          variant="secondary"
          class="shrink-0"
          @click="activePatientId = patient.data.id"
        >
          {{
            patient.data.keyMissing
              ? "Insufficient permission"
              : patient.data.displayName
          }}
        </SListButton>
      </div>

      <div class="overflow-hidden flex-1">
        <div class="flex-1 min-h-0 flex flex-col xl:flex-row gap-3">
          <div class="flex-1 overflow-auto min-h-0 flex flex-col gap-3">
            <div v-if="!activePatient" class="text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                Select a patient to view charts.
              </div>
            </div>
            <div v-else-if="activePatient.data.keyMissing" class="text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                Insufficient permission to view this patient.
              </div>
            </div>
            <ul
              v-else
              class="w-full flex flex-col border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))]"
            >
              <li
                v-for="chart in patientCharts"
                :key="chart.entryId"
                class="border-b border-[var(--ui-border)] last:border-b-0"
              >
                <div
                  class="flex items-center gap-3 px-3 py-2 text-sm transition"
                  :class="
                    chart.data.id === activeChartId
                      ? 'bg-[var(--ui-surface-hover)]'
                      : 'hover:bg-[var(--ui-surface-hover)]/70'
                  "
                  @click="activeChartId = chart.data.id"
                >
                  <span
                    class="flex items-center justify-center size-7 rounded-full border border-[var(--ui-border)] text-[var(--ui-fg-muted)]"
                    :class="
                      chart.data.keyMissing
                        ? 'text-[var(--ui-critical)] opacity-70'
                        : ''
                    "
                    aria-label="Chart"
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
                        d="M7.5 8.25h9m-9 3.5h9m-9 3.5h5.25"
                      />
                    </svg>
                  </span>

                  <div class="flex-1 min-w-0">
                    <p class="truncate">
                      {{
                        chart.data.keyMissing
                          ? "Insufficient permission"
                          : chart.data.title
                      }}
                    </p>
                  </div>

                  <div
                    class="ml-auto flex items-center gap-2 text-xs text-[var(--ui-fg-muted)]"
                  >
                    <SBadge
                      v-if="chart.data?.createdAt"
                      size="xs"
                      tone="neutral"
                      variant="outline"
                    >
                      {{
                        formatDate(chart.data.createdAt, {
                          dateStyle: "medium",
                        })
                      }}
                    </SBadge>
                  </div>
                </div>
              </li>
              <li v-if="!patientCharts.length" class="py-8 px-3 text-sm">
                <div
                  class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
                >
                  No charts yet. Use the add chart button to get started.
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
                  Record detail
                </p>
                <h3 class="text-base font-semibold truncate">
                  {{ activeChart?.data?.title || "Select a chart to view" }}
                </h3>
                <p class="text-xs text-[var(--ui-fg-muted)]">
                  {{
                    activePatient?.data?.displayName
                      ? `Patient: ${activePatient.data.displayName}`
                      : "Select a patient"
                  }}
                </p>
                <div
                  v-if="activeChart?.data?.authorId"
                  class="mt-2 flex items-center gap-2 text-xs text-[var(--ui-fg-muted)]"
                >
                  <IdentityAvatar
                    :identity="
                      usersByIdentity.get(activeChart.data.authorId)?.publicIdentityKey ||
                      activeChart.data.authorId
                    "
                    size="xs"
                  />
                  <span>
                    {{
                      usersByIdentity.get(activeChart.data.authorId)?.name ||
                      activeChart.data.authorId
                    }}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="xs"
                variant="secondary"
                class="!rounded-full"
                :disabled="
                  !activeChart ||
                  activeChart.data?.keyMissing ||
                  !activePatient ||
                  activePatient.data?.keyMissing
                "
                @click="openAddNoteDialog"
              >
                Add note
              </Button>
            </div>

            <div v-if="!activePatient" class="text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                Select a patient to view details.
              </div>
            </div>

            <div v-else-if="activePatient.data.keyMissing" class="text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                Insufficient permission to view this patient.
              </div>
            </div>

            <template v-else>
              <div class="flex flex-col gap-2 text-sm">
                <div class="flex flex-wrap gap-2 text-xs">
                  <SBadge
                    v-if="activePatient?.data?.archived"
                    size="xs"
                    tone="neutral"
                    variant="outline"
                  >
                    Archived
                  </SBadge>
                  <SBadge
                    v-if="activePatient?.data?.createdAt"
                    size="xs"
                    tone="neutral"
                    variant="outline"
                  >
                    {{
                      formatDate(activePatient?.data.createdAt, {
                        dateStyle: "medium",
                      })
                    }}
                  </SBadge>
                  <SBadge
                    v-if="activePatientPermissionId"
                    size="xs"
                    tone="secondary"
                    variant="outline"
                  >
                    Private patient
                  </SBadge>
                </div>
                <div class="flex flex-col gap-1 text-xs">
                  <span class="uppercase tracking-[0.14em] opacity-60">
                    DOB
                  </span>
                  <span>
                    {{
                      activePatient?.data?.dob
                        ? formatDate(activePatient?.data.dob, {
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
                  <span>{{
                    activePatient?.data?.nhsNumber || "Not recorded"
                  }}</span>
                </div>
                <div class="flex flex-col gap-1 text-xs">
                  <span class="uppercase tracking-[0.14em] opacity-60"
                    >Tags</span
                  >
                  <span>
                    {{
                      activePatient?.data?.tags?.length
                        ? activePatient?.data?.tags.join(", ")
                        : "None"
                    }}
                  </span>
                </div>
              </div>

              <div v-if="!activeChart" class="text-sm">
                <div
                  class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
                >
                  Select a chart to view records.
                </div>
              </div>

              <div v-else-if="activeChart.data.keyMissing" class="text-sm">
                <div
                  class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
                >
                  Insufficient permission to view this chart.
                </div>
              </div>

              <template v-else>
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
                    :disabled="
                      !activeChart ||
                      activeChart.data?.keyMissing ||
                      !activePatient ||
                      activePatient.data?.keyMissing
                    "
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
                    <div class="flex items-center gap-2">
                      <IdentityAvatar
                        v-if="note.data.authorId"
                        :identity="
                          usersByIdentity.get(note.data.authorId)?.publicIdentityKey ||
                          note.data.authorId
                        "
                        size="xs"
                      />
                      <p class="font-semibold truncate">
                        {{
                          note.data.keyMissing
                            ? "Insufficient permission"
                            : note.data.title || "Clinical note"
                        }}
                      </p>
                    </div>
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
                      {{
                        note.data.keyMissing ? "Encrypted note" : note.data.body
                      }}
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
                    :disabled="
                      !activeChart ||
                      activeChart.data?.keyMissing ||
                      !activePatient ||
                      activePatient.data?.keyMissing
                    "
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
                    <div class="flex items-center gap-2">
                      <IdentityAvatar
                        v-if="med.data.authorId"
                        :identity="
                          usersByIdentity.get(med.data.authorId)?.publicIdentityKey ||
                          med.data.authorId
                        "
                        size="xs"
                      />
                      <p class="font-semibold truncate">
                        {{
                          med.data.keyMissing
                            ? "Insufficient permission"
                            : med.data.name
                        }}
                      </p>
                    </div>
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
                    <div
                      class="mt-2 flex flex-col gap-1 text-[var(--ui-fg-muted)]"
                    >
                      <template v-if="med.data.keyMissing">
                        <span>Encrypted medication details</span>
                      </template>
                      <template v-else>
                        <span v-if="med.data.dose"
                          >Dose: {{ med.data.dose }}</span
                        >
                        <span v-if="med.data.instructions">
                          {{ med.data.instructions }}
                        </span>
                        <span v-if="med.data.endDate">
                          Ends:
                          {{
                            formatDate(med.data.endDate, {
                              dateStyle: "medium",
                            })
                          }}
                        </span>
                      </template>
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
            </template>
          </aside>
        </div>
      </div>
    </section>

    <SDialog v-model:open="isAddChartDialogOpen" title="Add chart">
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
          Chart title
        </label>
        <input
          v-model="newChartTitle"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. Respiratory clinic"
        />
        <Button type="button" size="sm" variant="primary" @click="addChart">
          Add chart
        </Button>
      </div>
    </SDialog>

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
        <div v-if="patientVisibility === 'private'" class="flex flex-col gap-2">
          <div class="text-xs uppercase tracking-[0.16em] opacity-60">
            Add members
          </div>
          <UserPicker v-model="newPatientMember" />
          <Button
            type="button"
            size="xs"
            variant="secondary"
            @click="addPatientMember"
          >
            Add member
          </Button>
          <div
            v-if="newPatientMembers.length"
            class="flex flex-wrap items-center gap-2 text-xs"
          >
            <div
              v-for="member in newPatientMembers"
              :key="member?.publicIdentityKey"
              class="flex items-center gap-2 border border-[var(--ui-border)] px-2 py-1"
            >
              <IdentityAvatar
                v-if="member?.publicIdentityKey"
                :identity="member.publicIdentityKey"
                size="xs"
              />
              <span class="max-w-[10rem] truncate">
                {{ member?.name || member?.publicIdentityKey }}
              </span>
              <Button
                type="button"
                size="xs"
                variant="plain-secondary"
                class="text-[11px] uppercase tracking-[0.12em]"
                @click="
                  newPatientMembers = newPatientMembers.filter(
                    (entry) =>
                      entry?.publicIdentityKey !== member?.publicIdentityKey
                  )
                "
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
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
        <Button
          type="button"
          size="sm"
          variant="primary"
          @click="createPatient"
        >
          Create patient
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

    <SDialog v-model:open="isAddMedDialogOpen" size="lg" title="Add medication">
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

    <SDialog
      v-if="activePatientPermissionId && !activePatient?.data?.keyMissing"
      v-model:open="isMembersDialogOpen"
      :title="`${activePatient?.data.displayName || 'Patient'} members`"
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
            d="M18 18.72a9.094 9.094 0 0 0 3.741-7.346A9 9 0 0 0 12 3a9 9 0 0 0-9.741 8.374A9.094 9.094 0 0 0 6 18.72M12 9.75a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-3">
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Add member
        </div>
        <div class="flex flex-col gap-2">
          <UserPicker
            v-model="selectedUsersByPermission[activePatientPermissionId]"
          />
          <Button
            type="button"
            size="xs"
            variant="secondary"
            @click="addUserToPatient(activePatientPermissionId)"
          >
            Add member
          </Button>
        </div>
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Members
        </div>
        <div
          v-if="permissionMembers.length"
          class="flex flex-wrap items-center gap-2 text-xs"
        >
          <div
            v-for="member in permissionMembers"
            :key="member.data.identity"
            class="flex items-center gap-2 border border-[var(--ui-border)] px-2 py-1"
          >
            <IdentityAvatar
              :identity="
                usersByIdentity.get(member.data.identity)?.publicIdentityKey ||
                member.data.identity
              "
              size="xs"
            />
            <span class="max-w-[12rem] truncate">
              {{
                usersByIdentity.get(member.data.identity)?.name ||
                member.data.identity
              }}
            </span>
          </div>
        </div>
        <div v-else class="text-xs opacity-60">No members yet.</div>
      </div>
    </SDialog>
  </div>
</template>
