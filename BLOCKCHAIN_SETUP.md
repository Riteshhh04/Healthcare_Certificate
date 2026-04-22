# Blockchain Healthcare Certificate Verification - Setup Guide

## Project Overview

This is a full-stack blockchain-based healthcare certificate verification system built with:
- **Frontend**: Next.js 16, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Blockchain**: Solidity Smart Contract on Ethereum (Hardhat)
- **Database**: In-memory store (simulating MongoDB)

## Quick Start (Demo Mode)

The application works out of the box in demo mode without any blockchain setup:

1. Run the Next.js app: `npm run dev`
2. Access at `http://localhost:3000`
3. Use demo credentials:
   - Admin: `admin@healthcare.com` / `admin123`
   - Patient: `john.doe@email.com` / `password123`

## Full Blockchain Setup (For Lab/Production)

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Step 1: Install Hardhat Dependencies

```bash
cd blockchain
npm install
```

### Step 2: Compile Smart Contract

```bash
cd blockchain
npx hardhat compile
```

### Step 3: Start Local Blockchain

Open a new terminal and run:

```bash
cd blockchain
npx hardhat node
```

This starts a local Ethereum network at `http://127.0.0.1:8545`

You'll see 20 test accounts with 10000 ETH each. Save the first account's private key for deployment.

### Step 4: Deploy Smart Contract

In another terminal:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`)

### Step 5: Configure Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 6: Run the Application

```bash
npm run dev
```

## Smart Contract Features

### HealthCertificate.sol

The smart contract provides:

1. **Certificate Storage**: Store certificate hashes on-chain
2. **Verification**: Verify certificate authenticity
3. **Revocation**: Revoke compromised certificates
4. **Access Control**: Only authorized issuers can create certificates
5. **Patient Tracking**: Track all certificates for a patient

### Key Functions

```solidity
// Store a new certificate
function storeCertificate(
    string certificateId,
    string patientId,
    string certificateType,
    string issuedBy,
    uint256 issueDate
) returns (bytes32 certificateHash)

// Verify a certificate
function verifyCertificate(bytes32 hash) returns (
    bool isValid,
    string certificateType,
    string issuedBy,
    uint256 issueDate,
    uint256 timestamp,
    bool revoked
)

// Revoke a certificate
function revokeCertificate(bytes32 certificateHash)
```

## Testing the Smart Contract

```bash
cd blockchain
npx hardhat test
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard pages
│   ├── dashboard/         # Patient dashboard pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── verify/            # Public verification page
├── blockchain/            # Hardhat project
│   ├── contracts/         # Solidity smart contracts
│   ├── scripts/           # Deployment scripts
│   └── test/              # Contract tests
├── components/            # React components
└── lib/                   # Utilities and services
    ├── blockchain.ts      # Blockchain service
    ├── store.ts           # In-memory database
    └── types.ts           # TypeScript types
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new patient |
| `/api/auth/login` | POST | Login (patient/admin) |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/session` | GET | Get current session |
| `/api/certificates` | GET | Get certificates |
| `/api/certificates` | POST | Create certificate (admin) |
| `/api/certificates/verify` | POST | Verify certificate |
| `/api/users` | GET | Get all users (admin) |

## Demo Certificates

Pre-loaded certificates with these hashes can be verified:

```
0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae
0x3fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278
```

## Security Features

1. **Immutable Records**: Once stored, certificates cannot be modified
2. **Cryptographic Hashing**: SHA-256 hashing for data integrity
3. **Access Control**: Only authorized issuers can create/revoke
4. **Event Logging**: All actions are logged on-chain
5. **Session Management**: HTTP-only cookies for auth

## For Lab Submission

Include:
1. This entire project
2. Screenshots of:
   - Contract deployment
   - Certificate creation
   - Verification process
3. Test results from `npx hardhat test`
4. Transaction hashes from Hardhat console

## Troubleshooting

### "Contract not found"
- Ensure Hardhat node is running
- Check contract address in `.env.local`

### "Session expired"
- Clear cookies and login again
- Check if API routes are working

### "Blockchain not connected"
- Start Hardhat node: `npx hardhat node`
- Verify RPC URL is correct

## License

MIT
