import { provide, inject, shallowRef, computed, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useLedger } from "../ledger/useLedger";
import { useIdentity } from "../identity/useIdentity";
import { useEncryption } from "../encryption/useEncryption";
import { useSolid } from "../solid/useSolid";
import { encrypt, decrypt } from "concords-encrypt";
import { formatEncryptionFile, stripEncryptionFile, generateId } from "concords-utils";

const useUserProfilesSymbol = Symbol("useUserProfiles");

function UserProfiles() {
  const { ledger, addItem, getCollection } = useLedger();
  const { publicKeyPEM, privateKeyPEM } = useIdentity();
  const { publicKey: encryptionPublicKey, privateKey: encryptionPrivateKey } = useEncryption();
  const { hasSolidSession, saveLedgerToSolid, loadLedgerFromSolid } = useSolid();

  // Local profile cache
  const profileCache = useLocalStorage("concords/user-profiles/cache", {});
  const myProfile = useLocalStorage("concords/user-profiles/my-profile", {});
  
  // Reactive state
  const profiles = shallowRef([]);
  const sharedProfiles = shallowRef([]);
  const myCompleteProfile = shallowRef({});
  const isLoading = shallowRef(false);

  // Watch ledger for profile updates
  watch(
    ledger,
    () => {
      loadProfilesFromLedger();
    },
    { immediate: true }
  );

  // Current user's complete profile
  const currentUserProfile = computed(() => {
    return {
      identity: publicKeyPEM.value,
      encryption: encryptionPublicKey.value,
      ...myProfile.value,
      isMe: true,
      lastUpdated: new Date().toISOString()
    };
  });

  // Load all profiles from the ledger
  function loadProfilesFromLedger() {
    try {
      const userProfiles = getCollection("user-profiles")?.data || [];
      const publicProfiles = getCollection("public-profiles")?.data || [];
      
      profiles.value = [...userProfiles, ...publicProfiles].map(record => ({
        ...record.data,
        recordId: record.id,
        encrypted: !!record.encrypted
      }));

      // Decrypt profiles that are shared with us
      decryptSharedProfiles();
    } catch (error) {
      console.error("Error loading profiles from ledger:", error);
    }
  }

  // Decrypt profiles that were encrypted for us
  async function decryptSharedProfiles() {
    const encryptedProfiles = profiles.value.filter(profile => 
      profile.encrypted && profile.sharedWith?.includes(publicKeyPEM.value)
    );

    for (const profile of encryptedProfiles) {
      try {
        if (profile.encryptedData) {
          const decryptedData = await decrypt(
            encryptionPrivateKey.value,
            formatEncryptionFile(profile.encryptedData)
          );
          const profileData = JSON.parse(decryptedData);
          
          // Update the profile with decrypted data
          const index = profiles.value.findIndex(p => p.recordId === profile.recordId);
          if (index !== -1) {
            profiles.value[index] = {
              ...profile,
              ...profileData,
              isDecrypted: true
            };
          }
        }
      } catch (error) {
        console.warn(`Failed to decrypt profile ${profile.id}:`, error);
      }
    }

    sharedProfiles.value = profiles.value.filter(p => p.isDecrypted);
  }

  // Create or update user profile
  async function saveMyProfile(profileData) {
    try {
      isLoading.value = true;

      // Update local storage
      myProfile.value = {
        ...myProfile.value,
        ...profileData,
        lastUpdated: new Date().toISOString()
      };

      // Create public profile record (basic info, no sensitive data)
      const publicProfile = {
        id: generateId(),
        identity: publicKeyPEM.value,
        name: profileData.name || "Anonymous",
        avatar: profileData.avatar || null,
        bio: profileData.bio || null,
        publicContact: profileData.publicContact || null,
        isPublic: true,
        lastUpdated: new Date().toISOString()
      };

      // Save public profile to ledger
      await addItem(publicProfile, "public-profiles");

      // Create private profile with sensitive data (NO RAW PRIVATE KEYS!)
      const privateProfile = {
        id: generateId(),
        identity: publicKeyPEM.value,
        ...profileData,
        // Only store public keys - private keys should NEVER be in ledger
        publicKeys: {
          identity: publicKeyPEM.value,
          encryption: encryptionPublicKey.value
        },
        isPrivate: true,
        lastUpdated: new Date().toISOString()
      };

      // Encrypt the private profile for ourselves
      const encryptedPrivateData = await encrypt(
        encryptionPublicKey.value,
        JSON.stringify(privateProfile)
      );

      const encryptedProfileRecord = {
        id: generateId(),
        identity: publicKeyPEM.value,
        encryptedData: stripEncryptionFile(encryptedPrivateData),
        isPrivate: true,
        sharedWith: [publicKeyPEM.value], // Only we can decrypt this
        lastUpdated: new Date().toISOString()
      };

      await addItem(encryptedProfileRecord, "user-profiles");

      myCompleteProfile.value = privateProfile;

      return { success: true, profile: publicProfile };
    } catch (error) {
      console.error("Error saving profile:", error);
      return { success: false, error: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  // Share profile with another user
  async function shareProfileWith(targetUserIdentity, profileData = null, accessLevel = "basic") {
    try {
      isLoading.value = true;

      // Get the target user's encryption key
      const targetUser = profiles.value.find(p => p.identity === targetUserIdentity);
      if (!targetUser || !targetUser.encryption) {
        throw new Error("Target user not found or missing encryption key");
      }

      // Determine what data to share based on access level
      let dataToShare = {};
      
      if (accessLevel === "basic") {
        dataToShare = {
          identity: publicKeyPEM.value,
          name: myProfile.value.name,
          avatar: myProfile.value.avatar,
          bio: myProfile.value.bio,
          publicContact: myProfile.value.publicContact
        };
      } else if (accessLevel === "contact") {
        dataToShare = {
          ...dataToShare,
          email: myProfile.value.email,
          phone: myProfile.value.phone,
          socialLinks: myProfile.value.socialLinks
        };
      } else if (accessLevel === "trusted") {
        dataToShare = {
          ...myProfile.value,
          identity: publicKeyPEM.value,
          encryption: encryptionPublicKey.value
        };
      }

      // Use custom data if provided
      if (profileData) {
        dataToShare = { ...dataToShare, ...profileData };
      }

      // Encrypt the data for the target user
      const encryptedData = await encrypt(
        targetUser.encryption,
        JSON.stringify(dataToShare)
      );

      // Create shared profile record
      const sharedProfileRecord = {
        id: generateId(),
        identity: publicKeyPEM.value, // Who the profile belongs to
        sharedBy: publicKeyPEM.value, // Who shared it
        sharedWith: [targetUserIdentity], // Who can access it
        encryptedData: stripEncryptionFile(encryptedData),
        accessLevel,
        isShared: true,
        sharedAt: new Date().toISOString()
      };

      await addItem(sharedProfileRecord, "user-profiles");

      return { success: true, sharedRecord: sharedProfileRecord };
    } catch (error) {
      console.error("Error sharing profile:", error);
      return { success: false, error: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  // Get profile by identity
  function getProfile(identity) {
    return profiles.value.find(p => p.identity === identity);
  }

  // Get all profiles shared with me
  function getSharedWithMe() {
    return profiles.value.filter(p => 
      p.sharedWith?.includes(publicKeyPEM.value) && 
      p.identity !== publicKeyPEM.value
    );
  }

  // Get all profiles I've shared
  function getSharedByMe() {
    return profiles.value.filter(p => 
      p.sharedBy === publicKeyPEM.value && 
      p.identity === publicKeyPEM.value
    );
  }

  // Export profile for backup/transfer
  async function exportMyProfile(includePrivateKeys = false) {
    const exportData = {
      profile: myProfile.value,
      identity: publicKeyPEM.value,
      encryption: encryptionPublicKey.value,
      exportedAt: new Date().toISOString(),
      version: "1.0",
      type: "concords-profile-backup"
    };

    // WARNING: Only include private keys for secure offline backup!
    if (includePrivateKeys) {
      console.warn("🔒 SECURITY: Exporting private keys - ensure secure storage!");
      exportData.privateKeys = {
        identity: privateKeyPEM.value,
        encryption: encryptionPrivateKey.value
      };
      exportData.containsPrivateKeys = true;
    }

    return exportData;
  }

  // Import profile from backup
  async function importProfile(profileData, restoreKeys = false) {
    try {
      isLoading.value = true;

      if (profileData.profile) {
        await saveMyProfile(profileData.profile);
      }

      if (restoreKeys && profileData.privateKeys) {
        // This would require updating the identity and encryption composables
        console.warn("Key restoration not implemented in this version");
      }

      return { success: true };
    } catch (error) {
      console.error("Error importing profile:", error);
      return { success: false, error: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  // Sync profiles to Solid pod
  async function syncToSolid() {
    if (!hasSolidSession.value) {
      throw new Error("No Solid session available");
    }

    try {
      // Export current profile state
      const profileBackup = await exportMyProfile(false); // Don't include private keys in Solid sync
      
      await saveLedgerToSolid(
        JSON.stringify(profileBackup), 
        `profile-${publicKeyPEM.value.slice(0, 8)}.json`
      );

      return { success: true };
    } catch (error) {
      console.error("Error syncing to Solid:", error);
      return { success: false, error: error.message };
    }
  }

  // Load profiles from Solid pod
  async function loadFromSolid(filename) {
    if (!hasSolidSession.value) {
      throw new Error("No Solid session available");
    }

    try {
      const profileData = await loadLedgerFromSolid(filename);
      const result = await importProfile(profileData, false);
      return result;
    } catch (error) {
      console.error("Error loading from Solid:", error);
      return { success: false, error: error.message };
    }
  }

  // Initialize - create basic profile if none exists
  async function initialize() {
    if (Object.keys(myProfile.value).length === 0 && publicKeyPEM.value) {
      await saveMyProfile({
        name: "Anonymous User",
        createdAt: new Date().toISOString()
      });
    }
  }

  // Auto-initialize when identity is ready
  watch(publicKeyPEM, (identity) => {
    if (identity) {
      initialize();
    }
  }, { immediate: true });

  return {
    // State
    profiles,
    sharedProfiles,
    myProfile,
    myCompleteProfile,
    currentUserProfile,
    isLoading,

    // Actions
    saveMyProfile,
    shareProfileWith,
    getProfile,
    getSharedWithMe,
    getSharedByMe,
    exportMyProfile,
    importProfile,
    syncToSolid,
    loadFromSolid,
    initialize,

    // Computed
    profilesSharedWithMe: computed(() => getSharedWithMe()),
    profilesSharedByMe: computed(() => getSharedByMe())
  };
}

export function provideUserProfiles() {
  const userProfiles = UserProfiles();
  provide(useUserProfilesSymbol, userProfiles);
  return userProfiles;
}

export function useUserProfiles() {
  return inject(useUserProfilesSymbol);
}
