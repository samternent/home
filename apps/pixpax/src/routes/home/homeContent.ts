import type {
  PixpaxPublicCollectionBundle,
  PixpaxPublicCollectionCard,
} from "@/modules/api/client";

export type HomeLink = {
  href: string;
  label: string;
};

export type HomeFeature = {
  title: string;
  description: string;
  iconLabel: string;
  tone: "primary" | "secondary" | "accent" | "success";
};

export const heroContent = {
  headline: "Open packs. Build your Pixbook.",
  supporting:
    "PixPax is a digital collectible game built around issued cards, pack reveals, and a Pixbook you build over time.",
  ctaLabel: "Get started",
} as const;

export const whyItFeelsGoodSection = {
  title: "How it works",
  supporting:
    "Packs contain digitally issued cards. Open a pack, reveal what was issued inside, and add them to your Pixbook.",
  items: [
    {
      title: "Issued cards",
      description:
        "Each card is issued as a real digital collectible, not just a temporary app reward.",
      iconLabel: "Pack",
      tone: "primary",
    },
    {
      title: "Open and reveal",
      description:
        "Packs are opened in the app so players can reveal what was issued inside.",
      iconLabel: "Set",
      tone: "secondary",
    },
    {
      title: "Build your Pixbook",
      description:
        "Each reveal grows your collection.",
      iconLabel: "Drop",
      tone: "accent",
    },
  ] satisfies readonly HomeFeature[],
} as const;

export const keepGoingSection = {
  title: "Keep collecting",
  supporting: [
    "QR cards, events, and rewards can unlock the next pack.",
    "Each collectible has its own place in your Pixbook.",
    "Every reveal leaves behind a record.",
  ],
  items: [
    {
      title: "Unlock with QR",
      description: "A printed card can link back into PixPax with a scan.",
      iconLabel: "Drop",
      tone: "primary",
    },
    {
      title: "Digital issuance",
      description:
        "Cards are issued intentionally, giving each reveal a clear collectible result.",
      iconLabel: "Unlock",
      tone: "accent",
    },
    {
      title: "Recorded to keep",
      description:
        "Each reveal is recorded to your Pixbook so the collection is more than just a screen state.",
      iconLabel: "Book",
      tone: "success",
    },
  ] satisfies readonly HomeFeature[],
} as const;

export const finalCtaSection = {
  title: "Start your Pixbook",
  description:
    "Open your first issued pack. Reveal what lands inside and start building your Pixbook.",
  ctaLabel: "Get started",
  details: [
    "Issued cards",
    "QR unlocks",
    "Recorded to keep",
  ],
} as const;

export const heroBundle: PixpaxPublicCollectionBundle = {
  collectionId: "starter-showcase",
  resolvedVersion: "preview",
  collection: {
    collectionId: "starter-showcase",
    version: "preview",
    name: "Starter Showcase",
    description: "Marketing preview cards for the PixPax landing page.",
    gridSize: 8,
    palette: {
      id: "pixpax-hero",
      colors: [
        0, 4278915104, 4294967295, 4294368184, 4290348380, 4285416486,
        4294934453, 4286335834, 4292181767, 4292528135, 4284243036, 4286851671,
        4278583233, 4292131035, 4294931200, 4294901760,
      ],
    },
  },
  index: null,
  settings: null,
  cards: [
    {
      cardId: "dragon-001",
      label: "Lemon Dragon",
      renderPayload: {
        gridSize: 16,
        gridB64:
          "AAAAAAAAAAAAAAAJAAAAAAAAAJmQAAAAAAAJmZkAAAAAAAkZGQAAAAkAmRkZkAkACJCZmZmQmAAIiZEREZmIAACIkXdxmIAAAACZERmQAAAAAAmZmQAAAAAACZmZAAAAAAAAmZCZAJkAAAAJmZmZkAAAAAmZAJkAAAAAAAAAAAA=",
      },
    },
    {
      cardId: "axylotl-001",
      label: "Axyotl 01",
      attributes: {
        shiny: true,
      },
      renderPayload: {
        gridSize: 16,
        gridB64:
          "AAwAIiIAwAACIAoCIKACICAAwAAADAACAMAAARAADAAAAAEWYRAAAAABFmZmYRAAABZmZmZmYQAAF2YmYmZxAAAWZhZhZmEAAAFmZmZmEAAAABZhFmEAAAAAFmZmYQAAAAABEREQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      },
    },
    {
      cardId: "capybara-05",
      label: "Capybara 05",
      renderPayload: {
        gridSize: 16,
        gridB64:
          "AAAAANAAAAAAAAAN3QAAAAAAAd3dEAAAAAAUERFBAAAAAUREREQQAAABRERERBAAAAFEJEJEEAAAAUQUQUQQAAABRERERBAAAAFEREREEAAAAURBQUQQAAABRERERBAAAAARERERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      },
    },
  ],
};

export const heroCards =
  heroBundle.cards as readonly PixpaxPublicCollectionCard[];

export const footerLinks: readonly HomeLink[] = [
  {
    href: "/app/pixbook",
    label: "Pixbook",
  },
  {
    href: "https://github.com/samternent/home/tree/main/apps/pixpax",
    label: "GitHub",
  },
] as const;
