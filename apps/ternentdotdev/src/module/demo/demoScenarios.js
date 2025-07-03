// Demo scenarios for resistance organizing
import { generateId } from "concords-utils";

export const resistanceScenarios = {
  'food-justice': {
    name: 'Food Justice Campaign 2025',
    description: 'Organizing for food sovereignty and community access to healthy, affordable food',
    icon: '🥬',
    tasks: [
      {
        id: generateId(),
        title: 'Research local food deserts',
        status: 'todo',
        priority: 'high',
        encrypted: false,
        description: 'Map areas with limited access to fresh, healthy food options',
        assignee: null
      },
      {
        id: generateId(),
        title: 'Contact vulnerable community leaders',
        status: 'in-progress', 
        priority: 'critical',
        encrypted: true,
        description: 'Confidential outreach to at-risk community members - source protection required',
        assignee: null,
        note: 'Names and contact info must remain encrypted'
      },
      {
        id: generateId(),
        title: 'Document corporate land grabs',
        status: 'todo',
        priority: 'medium',
        encrypted: true,
        description: 'Evidence gathering on corporate acquisition of community food sources',
        assignee: null
      }
    ],
    notes: [
      {
        id: generateId(),
        title: 'Corporate response analysis',
        content: 'Document corporate pushback strategies and legal threats. Keep evidence of intimidation tactics.',
        encrypted: true,
        author: 'organizer',
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(),
        title: 'Community meeting notes',
        content: 'Next meeting: Saturday 2pm at community center. Focus on building coalition.',
        encrypted: false,
        author: 'organizer',
        createdAt: new Date().toISOString()
      }
    ],
    members: [
      {
        id: generateId(),
        name: 'Community Organizer',
        role: 'coordinator',
        encrypted: false
      }
    ]
  },

  'housing-rights': {
    name: 'Housing Rights Organizing',
    description: 'Fighting displacement and ensuring housing as a human right',
    icon: '🏠',
    tasks: [
      {
        id: generateId(),
        title: 'Document tenant complaints',
        status: 'in-progress',
        priority: 'high',
        encrypted: true,
        description: 'Secure collection of tenant testimonies and evidence',
        assignee: null
      },
      {
        id: generateId(),
        title: 'Plan rent strike strategy',
        status: 'todo',
        priority: 'critical',
        encrypted: true,
        description: 'Coordinate collective action - requires secure communication',
        assignee: null
      },
      {
        id: generateId(),
        title: 'Research landlord connections',
        status: 'todo',
        priority: 'medium',
        encrypted: false,
        description: 'Public records research on property ownership networks',
        assignee: null
      }
    ],
    notes: [
      {
        id: generateId(),
        title: 'Legal strategy notes',
        content: 'Consult with tenant rights attorneys. Document all retaliation attempts.',
        encrypted: true,
        author: 'legal-advisor',
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(),
        title: 'Vulnerable tenant protection',
        content: 'Prioritize protection of undocumented and elderly tenants. Extra security measures needed.',
        encrypted: true,
        author: 'organizer',
        createdAt: new Date().toISOString()
      }
    ],
    members: [
      {
        id: generateId(),
        name: 'Tenant Organizer',
        role: 'coordinator',
        encrypted: false
      }
    ]
  },

  'environmental': {
    name: 'Environmental Justice Action',
    description: 'Protecting communities from pollution and environmental racism',
    icon: '🌍',
    tasks: [
      {
        id: generateId(),
        title: 'Water quality testing',
        status: 'in-progress',
        priority: 'critical',
        encrypted: false,
        description: 'Scientific documentation of contamination levels',
        assignee: null
      },
      {
        id: generateId(),
        title: 'Corporate accountability research',
        status: 'todo',
        priority: 'high',
        encrypted: true,
        description: 'Investigation into corporate pollution sources and cover-ups',
        assignee: null
      },
      {
        id: generateId(),
        title: 'Community health survey',
        status: 'todo',
        priority: 'medium',
        encrypted: true,
        description: 'Health impact documentation - protect participant privacy',
        assignee: null
      }
    ],
    notes: [
      {
        id: generateId(),
        title: 'Whistleblower contacts',
        content: 'Potential inside sources at the chemical plant. Extreme security protocols required.',
        encrypted: true,
        author: 'investigator',
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(),
        title: 'Pollution evidence',
        content: 'Photo documentation of illegal dumping sites. GPS coordinates and timestamps recorded.',
        encrypted: false,
        author: 'field-researcher',
        createdAt: new Date().toISOString()
      }
    ],
    members: [
      {
        id: generateId(),
        name: 'Environmental Organizer',
        role: 'coordinator',
        encrypted: false
      }
    ]
  },

  'media-freedom': {
    name: 'Press Freedom Defense',
    description: 'Protecting journalists and information freedom from censorship',
    icon: '📰',
    tasks: [
      {
        id: generateId(),
        title: 'Source protection protocols',
        status: 'in-progress',
        priority: 'critical',
        encrypted: true,
        description: 'Implement secure communication channels for sensitive sources',
        assignee: null
      },
      {
        id: generateId(),
        title: 'Document censorship attempts',
        status: 'todo',
        priority: 'high',
        encrypted: false,
        description: 'Public record of platform censorship and content removal',
        assignee: null
      },
      {
        id: generateId(),
        title: 'Secure story distribution',
        status: 'todo',
        priority: 'medium',
        encrypted: true,
        description: 'Decentralized publication networks immune to takedowns',
        assignee: null
      }
    ],
    notes: [
      {
        id: generateId(),
        title: 'Source security measures',
        content: 'All source communications through encrypted channels. No metadata logging.',
        encrypted: true,
        author: 'security-advisor',
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(),
        title: 'Legal threats tracking',
        content: 'Monitor legal challenges and intimidation tactics against press freedom.',
        encrypted: false,
        author: 'legal-observer',
        createdAt: new Date().toISOString()
      }
    ],
    members: [
      {
        id: generateId(),
        name: 'Independent Journalist',
        role: 'coordinator',
        encrypted: false
      }
    ]
  }
};

export const revolutionaryMessages = {
  welcome: "Welcome to the resistance. Your digital sovereignty starts here.",
  security: "Every action cryptographically signed. Every record immutable. Every choice yours.",
  privacy: "No corporate surveillance. No data harvesting. No algorithmic manipulation.",
  freedom: "Organize without fear. Collaborate without compromise. Resist without surrender."
};

export const quickStartTips = [
  {
    icon: "🔑",
    title: "Your identity is yours",
    description: "Keys generated locally - never transmitted to any server"
  },
  {
    icon: "🔒", 
    title: "Encrypt sensitive content",
    description: "Toggle encryption for private notes and confidential tasks"
  },
  {
    icon: "🌐",
    title: "Works completely offline", 
    description: "Full functionality without internet - perfect for secure environments"
  },
  {
    icon: "💾",
    title: "Backup your resistance",
    description: "Export encrypted files or sync to your chosen storage"
  }
];
