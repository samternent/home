import { ref, shallowRef, computed, provide, inject, reactive } from "vue";
import {
  login,
  handleIncomingRedirect,
  onSessionRestore,
  fetch,
  getDefaultSession,
  logout,
} from "@inrupt/solid-client-authn-browser";
import {
  getFile,
  getSolidDataset,
  getThing,
  overwriteFile,
  deleteFile,
  getStringNoLocale,
} from "@inrupt/solid-client";
import { FOAF } from "@inrupt/vocab-common-rdf";

const client_id = "6f195e5b-2627-4520-a996-34b79bc0b06f";
const client_secret = "c5b8f172-683a-455b-8a00-b2651ecf24d3";

const providers = [
  "https://login.inrupt.com",
  "https://inrupt.net",
  "https://solidcommunity.net",
  "https://solidweb.org",
];

const useSolidSymbol = Symbol("useSolid");

function Solid() {
  const hasSolidSession = shallowRef(false);
  const webId = shallowRef(null);
  const profile = shallowRef({});
  const oidcIssuer = shallowRef(providers[0]);
  const store = reactive({
    wallet: {},
    wallets: [],
  });

  const activeWorkspace = ref(0);
  const workspace = computed(() => {
    return profile.value.workspace && profile.value.workspace.length
      ? profile.value.workspace[activeWorkspace.value]
      : null;
  });
  function solidLogin() {
    login({
      redirectUrl: `${window.location.origin}`,
      oidcIssuer: oidcIssuer.value,
      clientName: "concords.app",
    });
  }

  async function solidFetch(name, id) {
    try {
      const file = await getFile(`${workspace.value}concords/${name}/${id}`, {
        fetch: fetch,
      });

      return new Promise((res, rej) => {
        async function onLoadFileHandler(e) {
          store[name] = {
            ...store[name],
            [id]: e.target.result,
          };

          const arr = id.split("");
          res(e.target.result);
        }
        let fr = new FileReader();
        fr.onload = onLoadFileHandler;
        fr.readAsText(file);
      });
    } catch (e) {
      throw e;
    }
  }

  async function solidWrite(name, type = "ledger", details) {
    const file = new File([details], `${name}`, {
      type: "application/json",
    });
    await overwriteFile(`${workspace.value}concords/${type}/${name}`, file, {
      contentType: file.type,
      fetch: fetch,
    });
  }

  async function solidDelete(name, type = "ledger") {
    await deleteFile(`${workspace.value}concords/${type}/${name}`, {
      fetch: fetch,
    });
  }

  async function handleSessionLogin() {
    await handleIncomingRedirect({
      // url: "http://localhost:3000/auth",
      restorePreviousSession: true,
    });
    const session = getDefaultSession();
    hasSolidSession.value = session.info.isLoggedIn;
    if (hasSolidSession.value) {
      webId.value = session.info.webId;

      const myDataset = await getSolidDataset(webId.value.split("#")[0], {
        fetch: fetch,
      });

      const myProfile = getThing(myDataset, webId.value);
      profile.value = {
        name: getStringNoLocale(myProfile, FOAF.name),
        url: myProfile.url,
        workspace:
          myProfile.predicates["http://www.w3.org/ns/pim/space#storage"]
            .namedNodes,
      };

      try {
        const walletData = await getSolidDataset(
          `${workspace.value}/concords`,
          {
            fetch: fetch,
          }
        );

        store["wallets"] = Object.keys(walletData.graphs.default)
          .filter((key) => /[^\\]*\.(\w+)$/.test(key))
          .map((str) =>
            str.split("\\").pop().split("/").pop().split(".").shift()
          );
      } catch (e) {
        console.error(e);
      }

      try {
        await solidFetch("wallet", "wallet");
      } catch (e) {
        // solidWrite(`${identity.x}_${_identity.y}`, _secret);
      }
    }
  }

  function getDataSet(name) {
    if (!workspace.value) return;
    return getSolidDataset(`${workspace.value}concords/${name}`, {
      fetch: fetch,
    });
  }

  handleSessionLogin();

  return {
    login: solidLogin,
    hasSolidSession,
    fetch: solidFetch,
    write: solidWrite,
    deleteLedger: solidDelete,
    getDataSet,
    webId,
    handleSessionLogin,
    profile,
    store,
    workspace,
    oidcIssuer,
    providers,
    logout: async () => {
      await logout();
      hasSolidSession.value = false;
    },
  };
}

/**
 *
 * @returns {Solid}
 */
export function provideSolid() {
  const solid = Solid();
  provide(useSolidSymbol, solid);
  return solid;
}

/**
 *
 * @returns {Solid}
 */
export function useSolid() {
  return inject(useSolidSymbol);
}
