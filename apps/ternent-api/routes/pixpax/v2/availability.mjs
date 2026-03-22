function trim(value) {
  return String(value || "").trim();
}

export function parseV2AvailableCollections(raw) {
  return Array.from(
    new Map(
      String(raw || "")
        .split(/[\n,]/g)
        .map((entry) => trim(entry))
        .filter(Boolean)
        .map((entry) => {
          const [collectionIdPart, versionPart = ""] = entry.split("@");
          const collectionId = trim(collectionIdPart);
          const version = trim(versionPart);
          if (!collectionId) {
            return null;
          }
          const key = `${collectionId}::${version}`;
          return [
            key,
            {
              collectionId,
              version: version || "",
            },
          ];
        })
        .filter(Boolean),
    ).values(),
  );
}

export function isV2CollectionAvailable(availableCollections, collectionId, version = "") {
  const normalizedCollectionId = trim(collectionId);
  const normalizedVersion = trim(version);
  if (!availableCollections.length) {
    return true;
  }
  return availableCollections.some((entry) => {
    if (entry.collectionId !== normalizedCollectionId) {
      return false;
    }
    if (!entry.version) {
      return true;
    }
    if (!normalizedVersion) {
      return true;
    }
    return entry.version === normalizedVersion;
  });
}

export function resolveAvailableCollectionVersion(
  availableCollections,
  collectionId,
  requestedVersion = "",
) {
  const normalizedCollectionId = trim(collectionId);
  const normalizedRequestedVersion = trim(requestedVersion);
  if (normalizedRequestedVersion) {
    return normalizedRequestedVersion;
  }

  const matchingEntries = availableCollections.filter(
    (entry) => entry.collectionId === normalizedCollectionId && entry.version,
  );
  if (matchingEntries.length === 1) {
    return matchingEntries[0].version;
  }
  return "";
}
