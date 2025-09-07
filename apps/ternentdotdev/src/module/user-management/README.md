# User Management & Profile System

A comprehensive user management system for secure identity, profile management, and cryptographic key sharing built for the Concords platform.

## 🌟 Features

### 1. **User Profiles**
- **Personal Profile Management**: Create and maintain detailed user profiles with personal information
- **Privacy Controls**: Multiple sharing levels (basic, contact, trusted)
- **Profile Completeness**: Visual indicators to encourage complete profiles
- **Avatar Integration**: Uses identity-based avatar generation

### 2. **Secure Key Management**
- **Identity Keys**: ECDSA P-256 keys for digital signatures and verification
- **Encryption Keys**: X25519 keys for secure communication
- **Key Persistence**: Secure storage in browser local storage
- **Key Backup**: Export/import functionality for key recovery

### 3. **Secure Key Sharing**
- **Multi-step Wizard**: Guided process for sharing cryptographic keys
- **Risk Assessment**: Clear warnings for high-risk operations (private key sharing)
- **Access Control**: Granular permissions and expiration settings
- **Encrypted Transfer**: All shared keys are encrypted for the recipient

### 4. **Profile Sharing**
- **Granular Access Levels**:
  - **Basic**: Name, avatar, bio only
  - **Contact**: Basic + contact information
  - **Trusted**: Full profile access
- **Encrypted Sharing**: Profiles are encrypted for specific recipients
- **Share Management**: Track what you've shared and with whom

### 5. **Backup & Sync**
- **Solid Pod Integration**: Sync profiles to your personal data pod
- **Export/Import**: JSON-based backup system
- **Cross-device Sync**: Access your profile from multiple devices
- **Version Control**: Timestamped profile updates

## 🏗️ Architecture

### Core Components

#### `useUserProfiles.js`
The main composable that provides all user management functionality:

```javascript
const {
  // State
  profiles,
  myProfile,
  currentUserProfile,
  isLoading,
  
  // Actions
  saveMyProfile,
  shareProfileWith,
  exportMyProfile,
  syncToSolid,
  
  // Computed
  profilesSharedWithMe,
  profilesSharedByMe
} = useUserProfiles();
```

#### `UserProfileManager.vue`
The main UI component for profile management with tabs for:
- **My Profile**: View and edit personal information
- **Shared Profiles**: Manage profile sharing relationships
- **Backup & Sync**: Export, import, and Solid pod synchronization

#### `SecureKeySharing.vue`
A specialized component for sharing cryptographic keys securely:
- Step-by-step wizard interface
- Risk assessment and warnings
- Encryption for secure transfer
- Expiration and usage controls

## 🔐 Security Features

### 1. **Encryption at Rest**
- Private keys are stored encrypted in local storage
- Sensitive profile data is encrypted before storage
- Uses industry-standard AES encryption

### 2. **Secure Key Sharing**
- All shared keys are encrypted using the recipient's public key
- Support for expiration dates and one-time use
- Clear warnings for high-risk operations

### 3. **Access Control**
- Granular permission system
- Identity-based access control
- Audit trail for all sharing activities

### 4. **Data Integrity**
- Cryptographic signatures for all profile updates
- Hash-based integrity checking
- Tamper detection mechanisms

## 🚀 Usage

### Setting Up User Management

1. **Provide the service** in your main application:

```javascript
// In your main route component
import { provideUserProfiles } from "@/module/user-management/useUserProfiles";

// Provide at the app level
provideUserProfiles();
```

2. **Use in components**:

```javascript
import { useUserProfiles } from "@/module/user-management/useUserProfiles";

const { saveMyProfile, shareProfileWith } = useUserProfiles();
```

### Creating a Profile

```javascript
await saveMyProfile({
  name: "John Doe",
  bio: "Software developer passionate about privacy",
  email: "john@example.com",
  website: "https://johndoe.dev",
  socialLinks: {
    github: "johndoe",
    twitter: "@johndoe"
  }
});
```

### Sharing a Profile

```javascript
await shareProfileWith(
  "recipient-identity-key",
  null, // Use default profile data
  "contact" // Access level: basic, contact, or trusted
);
```

### Secure Key Sharing

```javascript
// Open the key sharing component
<SecureKeySharing 
  :open="showKeySharing"
  @update:open="showKeySharing = $event"
  @keyShared="handleKeyShared"
/>
```

## 🌐 Solid Pod Integration

The system integrates seamlessly with Solid pods for decentralized storage:

### Profile Backup
```javascript
// Backup profile to Solid pod
await syncToSolid();
```

### Profile Restore
```javascript
// Restore from Solid pod
await loadFromSolid("profile-backup.json");
```

## 📊 Data Structures

### Profile Data
```javascript
{
  identity: "public-key-pem",
  name: "User Name",
  bio: "User bio",
  email: "user@example.com",
  avatar: "https://avatar-url.com/image.jpg",
  socialLinks: {
    twitter: "@username",
    github: "username",
    linkedin: "username"
  },
  preferences: {
    theme: "auto",
    notifications: true,
    publicProfile: true
  },
  lastUpdated: "2025-06-28T12:00:00.000Z"
}
```

### Key Share Record
```javascript
{
  id: "unique-id",
  sharedBy: "sharer-identity",
  sharedWith: "recipient-identity",
  keyTypes: ["identityPublic", "encryptionPublic"],
  encryptedData: "encrypted-key-package",
  expiresAt: "2025-07-28T12:00:00.000Z",
  oneTimeUse: false,
  isActive: true,
  sharedAt: "2025-06-28T12:00:00.000Z"
}
```

## 🛡️ Privacy & Security Considerations

### Data Minimization
- Only collect and store necessary information
- Clear data retention policies
- User control over data sharing

### Encryption Standards
- **Identity Keys**: ECDSA P-256 (NIST recommended)
- **Encryption Keys**: X25519 (state-of-the-art elliptic curve)
- **Symmetric Encryption**: AES-256-GCM
- **Key Derivation**: PBKDF2 with high iteration counts

### Best Practices
- Regular key rotation recommendations
- Secure key backup procedures
- Multi-factor authentication support (future)
- Hardware security module integration (future)

## 🔗 Integration with Existing Systems

### Ledger System
- Profiles are stored as records in the blockchain ledger
- Cryptographic signatures ensure data integrity
- Distributed consensus for profile updates

### Identity System
- Seamless integration with existing identity management
- Uses the same cryptographic primitives
- Backward compatible with existing user data

### Solid Pod System
- Native support for Solid protocol
- Decentralized storage and synchronization
- User-controlled data sovereignty

## 🚧 Future Enhancements

### Planned Features
- **Multi-device Key Synchronization**: Secure key sharing across devices
- **Social Graph**: Friend/contact management system
- **Reputation System**: Trust scoring based on interactions
- **Advanced Permissions**: Role-based access control
- **Mobile App Support**: React Native components
- **Hardware Wallet Integration**: Support for hardware-based keys

### Security Improvements
- **Forward Secrecy**: Automatic key rotation
- **Zero-Knowledge Proofs**: Enhanced privacy features
- **Multi-Party Computation**: Collaborative key management
- **Quantum Resistance**: Post-quantum cryptography migration path

## 📝 API Reference

### Core Methods

#### Profile Management
- `saveMyProfile(profileData)` - Save/update user profile
- `getProfile(identity)` - Get profile by identity
- `exportMyProfile(includePrivateKeys)` - Export profile for backup
- `importProfile(profileData)` - Import profile from backup

#### Sharing
- `shareProfileWith(identity, data, accessLevel)` - Share profile with user
- `getSharedWithMe()` - Get profiles shared with current user
- `getSharedByMe()` - Get profiles shared by current user

#### Synchronization
- `syncToSolid()` - Backup profile to Solid pod
- `loadFromSolid(filename)` - Restore profile from Solid pod

## 🤝 Contributing

When contributing to the user management system:

1. **Security First**: All code changes must undergo security review
2. **Privacy by Design**: Consider privacy implications of new features
3. **Test Coverage**: Maintain high test coverage for critical paths
4. **Documentation**: Update documentation for API changes

## 📄 License

This user management system is part of the Concords platform and follows the same licensing terms.
