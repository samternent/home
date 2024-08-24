import { shallowRef, provide, inject } from "vue";
import {
  login,
  handleIncomingRedirect,
  fetch,
  getDefaultSession,
  logout,
} from "@inrupt/solid-client-authn-browser";
import {
  getThing,
  getProfileAll,
  setUrl,
  setThing,
  buildThing,
  getSourceUrl,
  saveSolidDatasetAt,
  getSolidDataset,
} from "@inrupt/solid-client";
import { SCHEMA_INRUPT, RDF } from "@inrupt/vocab-common-rdf";
import { useIdentity } from "../identity/useIdentity";

// some default providers... must access free text also
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

  const { publicKeyPEM } = useIdentity();

  console.log(publicKeyPEM.value);

  function solidLogin() {
    // leaves our domain.
    login({
      redirectUrl: new URL("/solid/redirect", window.location.href).toString(),
      oidcIssuer: oidcIssuer.value,
    });
  }

  async function solidLogout() {
    await logout();
    hasSolidSession.value = false;
  }

  function getProfile(profileUrl) {
    console.log("profileUrl", profileUrl);
    return getSolidDataset(profileUrl, {
      fetch: fetch,
    });
  }

  async function handleSessionLogin() {
    // await handleIncomingRedirect({
    //   restorePreviousSession: true,
    // });
    // const session = getDefaultSession();
    // hasSolidSession.value = session.info.isLoggedIn;
    // if (hasSolidSession.value) {
    //   webId.value = session.info.webId;
    //   const profile = await getProfile(webId);
    //   console.log(profile);
    // }
  }

  return {
    login: solidLogin,
    hasSolidSession,
    webId,
    handleSessionLogin,
    profile,
    oidcIssuer,
    providers,
    logout: solidLogout,
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
