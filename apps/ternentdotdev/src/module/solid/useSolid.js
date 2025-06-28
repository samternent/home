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
  createContainerAt,
  overwriteFile,
  getFile,
  getContainedResourceUrlAll,
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
    webId.value = null;
    profile.value = {};
  }

  function getProfile(profileUrl) {
    if (!profileUrl) {
      throw new Error("Profile URL is required but was undefined or null");
    }
    console.log("Fetching profile for URL:", profileUrl);
    return getSolidDataset(profileUrl, {
      fetch: fetch,
    });
  }

  async function saveLedgerToSolid(ledgerData, filename = "ledger.json") {
    if (!hasSolidSession.value || !webId.value) {
      throw new Error("Not logged into Solid pod or webId is missing");
    }

    const ledgerJson = JSON.stringify(ledgerData, null, 2);
    
    // Get the storage location from the profile
    let storageUrl = null;
    try {
      console.log("Current profile:", profile.value);
      
      // Try to get storage from different profile sources
      if (profile.value?.storageAll && profile.value.storageAll.length > 0) {
        storageUrl = profile.value.storageAll[0];
        console.log("✅ Using storage URL from profile.storageAll:", storageUrl);
      } else if (profile.value?.webIdProfile?.storage && profile.value.webIdProfile.storage.length > 0) {
        storageUrl = profile.value.webIdProfile.storage[0];
        console.log("✅ Using storage URL from profile.webIdProfile.storage:", storageUrl);
      } else {
        // Extract storage URL from the RDF graph structure
        const graphs = profile.value?.webIdProfile?.graphs?.default;
        const webIdSubject = graphs?.[webId.value];
        const storagePredicates = webIdSubject?.predicates?.["http://www.w3.org/ns/pim/space#storage"];
        
        if (storagePredicates?.namedNodes && storagePredicates.namedNodes.length > 0) {
          storageUrl = storagePredicates.namedNodes[0];
          console.log("✅ Extracted storage URL from RDF graph:", storageUrl);
        } else {
          // Manual extraction from webId profile data
          console.log("Profile storage not available, analyzing webId:", webId.value);
          console.log("Full profile data:", JSON.stringify(profile.value, null, 2));
          
          // Always use the webId base for maximum compatibility
          storageUrl = webId.value.split("/profile")[0] + "/";
          console.log("🔧 Using webId-based storage URL:", storageUrl);
        }
      }
    } catch (error) {
      console.log("❌ Error determining storage URL, using webId fallback:", error.message);
      storageUrl = webId.value.split("/profile")[0] + "/";
    }
    
    // Try a few common container paths that are typically writable
    const containerPaths = [
      `${storageUrl}public/`,  // Public folder (most permissive)
      `${storageUrl}`,         // Root level (direct to storage root)
      `${storageUrl}private/`, // Private folder
      `${storageUrl}private/ledgers/`, // Private ledgers subfolder
      `${storageUrl}ledgers/`  // Public ledgers folder
    ];
    
    console.log("Saving ledger to connected Solid pod storage:", storageUrl);
    
    for (let i = 0; i < containerPaths.length; i++) {
      const containerUrl = containerPaths[i];
      const fileUrl = `${containerUrl}${filename}`;
      console.log(`Trying container ${i + 1}/${containerPaths.length}: ${containerUrl}`);
      
      try {
        // First try to ensure the container exists (skip for root and public - they typically exist)
        if (containerUrl !== storageUrl && !containerUrl.endsWith('public/')) {
          try {
            console.log("Creating/ensuring container exists:", containerUrl);
            await createContainerAt(containerUrl, { fetch });
            console.log("✅ Container created/verified:", containerUrl);
          } catch (containerError) {
            console.log("⚠️ Container creation failed (might already exist):", containerError.message);
            // Continue anyway - container might already exist
          }
        } else {
          console.log("Skipping container creation for root/public folder:", containerUrl);
        }

        // Now try to save the file using Solid's overwriteFile function
        console.log("Attempting to save file using overwriteFile:", fileUrl);
        try {
          const savedFile = await overwriteFile(
            fileUrl,
            new Blob([ledgerJson], { type: "application/json" }),
            { 
              fetch,
              contentType: "application/json"
            }
          );
          console.log("✅ Ledger saved successfully to:", fileUrl);
          return fileUrl;
        } catch (overwriteError) {
          console.log("overwriteFile failed, trying raw fetch:", overwriteError.message);
          
          // Fallback to raw fetch if overwriteFile fails
          const response = await fetch(fileUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: ledgerJson,
          });

          if (response.ok) {
            console.log("✅ Ledger saved successfully to:", fileUrl);
            return fileUrl;
          } else {
            console.log(`❌ Failed at ${fileUrl}: ${response.status} ${response.statusText}`);
            // Log response body for debugging
            const responseText = await response.text();
            console.log("Response body:", responseText);
          }
        }
      } catch (fetchError) {
        console.log(`❌ Network error at ${fileUrl}:`, fetchError.message);
      }
    }
    
    // If all locations failed
    throw new Error(`Failed to save ledger to your Solid pod storage. Your provider might not allow file creation in the attempted locations.`);
  }

  async function loadLedgerFromSolid(filename = "ledger.json") {
    if (!hasSolidSession.value || !webId.value) {
      throw new Error("Not logged into Solid pod or webId is missing");
    }

    // Get the storage location from the profile  
    let storageUrl = null;
    try {
      // Try to get storage from different profile sources
      if (profile.value?.storageAll && profile.value.storageAll.length > 0) {
        storageUrl = profile.value.storageAll[0];
      } else if (profile.value?.webIdProfile?.storage && profile.value.webIdProfile.storage.length > 0) {
        storageUrl = profile.value.webIdProfile.storage[0];
      } else {
        // Extract storage URL from the RDF graph structure
        const graphs = profile.value?.webIdProfile?.graphs?.default;
        const webIdSubject = graphs?.[webId.value];
        const storagePredicates = webIdSubject?.predicates?.["http://www.w3.org/ns/pim/space#storage"];
        
        if (storagePredicates?.namedNodes && storagePredicates.namedNodes.length > 0) {
          storageUrl = storagePredicates.namedNodes[0];
        } else {
          // Always use the webId base for maximum compatibility
          storageUrl = webId.value.split("/profile")[0] + "/";
        }
      }
    } catch (error) {
      storageUrl = webId.value.split("/profile")[0] + "/";
    }
    
    // Try the same locations as save function
    const locations = [
      `${storageUrl}public/${filename}`,
      `${storageUrl}${filename}`,
      `${storageUrl}private/${filename}`,
      `${storageUrl}private/ledgers/${filename}`,
      `${storageUrl}ledgers/${filename}`
    ];
    
    console.log(`Loading ledger "${filename}" from connected Solid pod storage...`);
    
    for (let i = 0; i < locations.length; i++) {
      const fileUrl = locations[i];
      console.log(`Trying location ${i + 1}/${locations.length}: ${fileUrl}`);
      
      try {
        // Try using Solid's getFile function first
        try {
          console.log("Attempting to load file using getFile:", fileUrl);
          const file = await getFile(fileUrl, { fetch });
          const text = await file.text();
          const ledgerData = JSON.parse(text);
          console.log("✅ Ledger loaded successfully from:", fileUrl);
          return ledgerData;
        } catch (getFileError) {
          console.log("getFile failed, trying raw fetch:", getFileError.message);
          
          // Fallback to raw fetch
          const response = await fetch(fileUrl);
          
          if (response.ok) {
            const ledgerData = await response.json();
            console.log("✅ Ledger loaded successfully from:", fileUrl);
            return ledgerData;
          } else {
            console.log(`❌ Failed at ${fileUrl}: ${response.status} ${response.statusText}`);
          }
        }
      } catch (fetchError) {
        console.log(`❌ Network error at ${fileUrl}:`, fetchError.message);
      }
    }
    
    // If we get here, all locations failed
    throw new Error(`Ledger "${filename}" not found in your Solid pod storage`);
  }

  async function listLedgersFromSolid() {
    if (!hasSolidSession.value || !webId.value) {
      throw new Error("Not logged into Solid pod or webId is missing");
    }

    // Get the storage location from the profile
    let storageUrl = null;
    try {
      // Try to get storage from different profile sources
      if (profile.value?.storageAll && profile.value.storageAll.length > 0) {
        storageUrl = profile.value.storageAll[0];
      } else if (profile.value?.webIdProfile?.storage && profile.value.webIdProfile.storage.length > 0) {
        storageUrl = profile.value.webIdProfile.storage[0];
      } else {
        // Extract storage URL from the RDF graph structure
        const graphs = profile.value?.webIdProfile?.graphs?.default;
        const webIdSubject = graphs?.[webId.value];
        const storagePredicates = webIdSubject?.predicates?.["http://www.w3.org/ns/pim/space#storage"];
        
        if (storagePredicates?.namedNodes && storagePredicates.namedNodes.length > 0) {
          storageUrl = storagePredicates.namedNodes[0];
        } else {
          // Always use the webId base for maximum compatibility
          storageUrl = webId.value.split("/profile")[0] + "/";
        }
      }
    } catch (error) {
      storageUrl = webId.value.split("/profile")[0] + "/";
    }
    
    // Check the same container locations as save function
    const containerUrls = [
      `${storageUrl}public/`,
      `${storageUrl}`,
      `${storageUrl}private/`,
      `${storageUrl}private/ledgers/`,
      `${storageUrl}ledgers/`
    ];
    
    console.log("Searching for ledgers in connected Solid pod storage...");
    
    let allLedgers = [];
    
    for (let i = 0; i < containerUrls.length; i++) {
      const containerUrl = containerUrls[i];
      console.log(`Checking location ${i + 1}/${containerUrls.length}: ${containerUrl}`);
      
      try {
        // Try to get the container dataset
        console.log(`Attempting to list files in container: ${containerUrl}`);
        const dataset = await getSolidDataset(containerUrl, { fetch });
        
        // Alternative approach: Get contained resources using Solid client
        const containedResourceUrls = getContainedResourceUrlAll(dataset);
        console.log(`Found ${containedResourceUrls.length} resources in ${containerUrl}:`, containedResourceUrls);
        
        for (const resourceUrl of containedResourceUrls) {
          const filename = resourceUrl.replace(containerUrl, '');
          
          // Only include JSON files (ledger files) and avoid duplicates
          if ((filename.endsWith('.json') || filename.endsWith('.ledger.json')) &&
              !allLedgers.find(l => l.filename === filename)) {
            
            // Try to get file metadata for last modified date
            let modified = null;
            try {
              const fileDataset = await getSolidDataset(resourceUrl, { fetch });
              // Extract modification date if available
              const resourceInfo = fileDataset.internal_resourceInfo;
              if (resourceInfo && resourceInfo.lastModified) {
                modified = resourceInfo.lastModified;
              }
            } catch (metaError) {
              // Skip metadata if we can't get it
              console.log(`Could not get metadata for ${resourceUrl}:`, metaError.message);
            }
            
            allLedgers.push({
              filename,
              url: resourceUrl,
              location: containerUrl,
              modified
            });
            console.log(`Added ledger: ${filename} from ${containerUrl}`);
          }
        }
        
      } catch (error) {
        // Expected for missing containers, just continue
        if (error.message?.includes('404') || error.message?.includes('Not Found')) {
          console.log(`No container at ${containerUrl} (this is normal)`);
        } else {
          console.log(`Error checking ${containerUrl}:`, error.message);
        }
      }
    }
    
    console.log(`Found ${allLedgers.length} ledgers in your pod storage:`, allLedgers);
    return allLedgers;
  }

  async function handleSessionLogin() {
    try {
      console.log("Checking for existing Solid session...");
      
      // First check if there's already an active session
      const session = getDefaultSession();
      if (session.info.isLoggedIn && session.info.webId) {
        console.log("Found existing active session:", session.info.webId);
        hasSolidSession.value = true;
        webId.value = session.info.webId;
        
        try {
          const profileDataset = await getProfile(webId.value);
          const profileThing = getThing(profileDataset, webId.value);
          if (profileThing) {
            // Try to get profile data including storage info
            try {
              profile.value = await getProfileAll(webId.value);
              console.log("Full profile loaded:", profile.value);
            } catch (profileAllError) {
              console.log("getProfileAll failed, using basic profile data:", profileAllError.message);
              // Fallback: extract basic info from profileThing
              profile.value = {
                webId: webId.value,
                // Try to extract storage URLs manually if getProfileAll fails
                storageAll: [] // We'll use fallback logic in save/load functions
              };
            }
          }
          console.log("Existing session loaded successfully:", { webId: webId.value, profile: profile.value });
        } catch (profileError) {
          console.log("Profile fetch failed for existing session, but session is valid:", profileError.message);
          // Set minimal profile for fallback
          profile.value = { webId: webId.value, storageAll: [] };
        }
        return;
      }
      
      // If no active session, try to restore from previous session
      console.log("No active session found, attempting to restore previous session...");
      await handleIncomingRedirect({
        restorePreviousSession: true,
      });
      
      // Check session again after restore attempt
      const restoredSession = getDefaultSession();
      hasSolidSession.value = restoredSession.info.isLoggedIn;
      
      if (hasSolidSession.value && restoredSession.info.webId) {
        webId.value = restoredSession.info.webId;
        console.log("Solid session restored, fetching profile for webId:", webId.value);
        
        try {
          const profileDataset = await getProfile(webId.value);
          const profileThing = getThing(profileDataset, webId.value);
          if (profileThing) {
            try {
              profile.value = await getProfileAll(webId.value);
              console.log("Full profile loaded after restore:", profile.value);
            } catch (profileAllError) {
              console.log("getProfileAll failed after restore, using basic profile data:", profileAllError.message);
              profile.value = {
                webId: webId.value,
                storageAll: []
              };
            }
          }
          console.log("Solid session restored successfully:", { webId: webId.value, profile: profile.value });
        } catch (profileError) {
          console.log("Solid profile fetch had issues, but session is valid. This is often normal:", profileError.message);
          // Session is still valid even if profile fetch fails
          profile.value = { webId: webId.value, storageAll: [] };
        }
      } else if (hasSolidSession.value) {
        console.warn("Solid session is logged in but webId is undefined");
        hasSolidSession.value = false; // Reset session state if webId is missing
      } else {
        console.log("No previous Solid session to restore");
      }
    } catch (error) {
      console.error("Error handling Solid session:", error);
      hasSolidSession.value = false;
      webId.value = null;
      profile.value = {};
    }
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
    saveLedgerToSolid,
    loadLedgerFromSolid,
    listLedgersFromSolid,
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
