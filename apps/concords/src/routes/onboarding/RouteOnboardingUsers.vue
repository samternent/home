<script setup lang="ts">
import { ref, watch } from "vue";
import { LayoutHeaderTitle } from "@/modules/layout";
import { IdentityAvatar, useIdentity } from "@/modules/identity";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";

const { ledger, getCollection, addItem } = useLedger();
const { publicKeyPEM } = useIdentity();
const people = ref<Array<IRecord>>([]);

watch(
  ledger,
  () => {
    people.value = [...(getCollection("users")?.data || [])].reverse();
  },
  { immediate: true }
);

const users = [
  {
    public: {
      username: "WWhite",
      identity:
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEW8vldlC0PeO9E6YF+/2NI2+F+91G\n/Yb1FVly7SpWNquJmSe3ExmOxCv5SApZ/dxG+unjP2yLwN10VbxU0dd6fQ==",
      encryption:
        "age1dvny2sstyvsc5q3pdw5287j60xm8rl6dw957pq6cw0qwydthhulspd7zt9",
    },
    private: {
      identity:
        "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgb74c2bgZw/WRAPUS\noqx3daOPEvOelIdFFnDm6EpvjT+hRANCAARby+V2ULQ9470TpgX7/Y0jb4X73Ub9\nhvUVWXLtKlY2q4mZJ7cTGY7EK/lICln93Eb66eM/bIvA3XRVvFTR13p9\n-----END PRIVATE KEY-----",
      encryption:
        "AGE-SECRET-KEY-15ZTLVX6F7XVEP9A78VUPWFGHUV0RCRMCA9ZUEWPX8ZSZNLQMKACQFFLZPN",
    },
  },
  {
    public: {
      username: "JPinkman",
      identity:
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE6y0yZlNZGnJAbFu9XxmvZaiOycOU\nTrmxGaHtzfe4ZryiepiCaOtbCpPyrUKjHMhdoln+0n8XpEPhphxi7kGisQ==",
      encryption:
        "age1584t6cjav4hm24cdklp3jnyhdpjv7q3unesgydczuyh57qpxc30qngckjh",
    },
    private: {
      identity:
        "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg7LfsPi3SVGf1CCxF\nco8LnfGQ22DNaWjg5pwGeW3es8ahRANCAATrLTJmU1kackBsW71fGa9lqI7Jw5RO\nubEZoe3N97hmvKJ6mIJo61sKk/KtQqMcyF2iWf7SfxekQ+GmHGLuQaKx\n-----END PRIVATE KEY-----",
      encryption:
        "AGE-SECRET-KEY-1HZUEA6VFFXP30PSW62VAW0NRCQQ2GUVG2NMYWHWLDNE2EZNHM4GSFE3LW2",
    },
  },
  {
    public: {
      username: "SGoodman",
      identity:
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEC63YGALYh0V5THKjnXJwJFHWPXvB\ngqoSuoagPPzbytkI/rhSdQX5n6Gp4pIBP/2Ndr45ukQm4MmWq9nu7MiFzQ==",
      encryption:
        "age10shysdpm7c9rjl5tn6vgdtkavxfhl36qhv9mk8aclqnwjpv3jypsgslzpd",
    },
    private: {
      identity:
        "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg+cgmzeEfRAMVPun5\nlDrCdgjhwZxwBT7FaptzFQksbByhRANCAAQLrdgYAtiHRXlMcqOdcnAkUdY9e8GC\nqhK6hqA8/NvK2Qj+uFJ1BfmfoanikgE//Y12vjm6RCbgyZar2e7syIXN\n-----END PRIVATE KEY-----",
      encryption:
        "AGE-SECRET-KEY-10Q8533M6KTAJ0L7W4F02DPQEW3PLH5DLECLU3DUSJC5E2ANDNASSMHW9SJ",
    },
  },
];

async function addPerson(user: Object) {
  try {
    await addItem(user, "users");
  } catch (e) {}
}

function isActiveUser(identity: string, _people: Array<IRecord>) {
  return _people?.some(
    (person: IRecord): Boolean => person.data?.identity === identity
  );
}

function isMe(identity: string) {
  return identity === publicKeyPEM.value;
}
</script>
<template>
  <div class="w-full flex-1 mx-auto max-w-6xl px-8 flex flex-col">
    <LayoutHeaderTitle title="Users" />

    <div class="mt-4">
      <p class="my-3 text-2xl font-thin max-w-5xl mx-auto mt-10">
        Users on this legder
      </p>
      <div
        v-for="person in people"
        :key="person.id"
        class="flex my-3 items-center bg-[#1c1c1c] p-3 rounded"
      >
        <div class="flex flex-1">
          <IdentityAvatar :identity="person.data?.identity" size="md" />
          <span class="text-5xl font-thin ml-3">{{
            person.data?.username
          }}</span>
          <span
            v-if="isMe(person.data?.identity)"
            class="text-5xl font-thin ml-3"
            >you</span
          >
        </div>
        <button
          @click="impersonateUser(person.data?.identity)"
          class="px-4 py-2 text-lg bg-green-600 hover:bg-green-700 transition-all rounded-full flex items-center font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
            />
          </svg>
        </button>
      </div>
      <p class="my-3 text-2xl font-thin max-w-5xl mx-auto mt-10">
        And here are some dummy users to add... (these can be impersonated for
        testing)
      </p>
      <div v-for="user in users" :key="user.public.identity">
        <div
          class="flex my-3 items-center bg-[#1c1c1c] p-3 rounded"
          v-if="!isActiveUser(user.public.identity, people)"
        >
          <div class="flex flex-1">
            <IdentityAvatar :identity="user.public.identity" size="md" />
            <span class="text-5xl font-thin ml-3">{{
              user.public.username
            }}</span>
          </div>
          <button
            @click="addPerson(user.public)"
            class="px-4 py-2 text-lg bg-green-600 hover:bg-green-700 transition-all rounded-full flex items-center font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="mt-12 mb-8 flex text-2xl justify-between items-center w-full">
      <RouterLink
        to="/identity"
        class="px-4 py-2 text-lg transition-all rounded-full flex items-center font-medium"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>

        Identity
      </RouterLink>
      <RouterLink
        to="/ledger"
        class="px-4 py-2 text-lg bg-pink-600 hover:bg-pink-700 transition-all rounded-full flex items-center font-medium"
      >
        Ledger
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 ml-2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>
