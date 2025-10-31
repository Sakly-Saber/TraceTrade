# TraceTrade - B2B Trading Marketplace

A sophisticated blockchain-powered B2B marketplace for African commodity trading with real-world asset tokenization, AI-powered insights, and automated workflow management. Built on Hedera Hashgraph for transparent, secure, and efficient trading.

## 🌟 Features

### Core Marketplace
- **Real-World Asset Tokenization**: Convert physical commodities into NFTs for transparent trading
- **Smart Contract Auctions**: Automated escrow and settlement via Hedera blockchain
- **Buy Now Marketplace**: Direct purchase with instant NFT transfer
- **Multi-Currency Support**: HBAR native payments and ERC-20 token integration
- **Transparent Bidding**: Immutable audit trail via Hedera Consensus Service (HCS)

### AI-Powered Intelligence
- **AI Auctioneer**: Market analysis, price recommendations, and suspicious bid detection
- **AI Treasurer**: Cash flow analysis, risk assessment, and payment optimization
- **Market Insights**: Real-time commodity pricing and trend analysis
- **Automated Compliance**: KYC verification and regulatory compliance checks

### Workflow Automation
- **n8n Integration**: Comprehensive workflow automation for business processes
- **Event-Driven Architecture**: Automated responses to auction events and user actions
- **Notification Systems**: Multi-channel notifications (email, SMS, Slack, webhooks)
- **Payment Processing**: Automated payment verification and settlement workflows

### Security & Compliance
- **Blockchain Security**: Immutable transaction records on Hedera network
- **Smart Contract Escrow**: Automated NFT and fund swapping on auction completion
- **Audit Trails**: Complete transaction history via HCS integration
- **Risk Management**: AI-powered fraud detection and compliance monitoring

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20+ LTS (recommended: v20.x or v22.x)
- **pnpm**: v10+ (package manager)
- **Git**: For version control
- **Docker & Docker Compose**: (Optional, for containerized development)
- **Hedera Testnet Account**: ECDSA key type for blockchain interactions
- **HashPack Wallet**: For testing wallet connections
- **IPFS Account**: Web3.Storage or Pinata account for metadata storage

### Installing Prerequisites

```bash
# Install Node.js (using nvm - recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install pnpm globally
npm install -g pnpm

# Verify installations
node --version  # Should be v20.x or higher
pnpm --version  # Should be v10.x or higher
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TraceTrade
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Generate Prisma Client
pnpm prisma generate
```

### 3. Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example` if available):

```bash
# Copy environment template (if exists)
cp .env.example .env
```

Then configure the following environment variables:

```env
# ============================================
# Database Configuration
# ============================================
DATABASE_URL="file:./dev.db"

# ============================================
# Hedera Blockchain Configuration
# ============================================
# Public Hedera RPC endpoint
NEXT_PUBLIC_RPC_URL=https://testnet.hashio.io/api

# Hedera Account (Operator - for backend operations)
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
OPERATOR_ACCOUNT_ID=0.0.xxxxx
OPERATOR_PRIVATE_KEY=302e020100300506032b657004220420...

# Public operator ID (safe to expose in frontend)
NEXT_PUBLIC_OPERATOR_ACCOUNT_ID=0.0.xxxxx

# Hedera Consensus Service Topic (for audit logs)
HCS_TOPIC_ID=0.0.xxxxx

# Mirror Node for transaction verification
NEXT_PUBLIC_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# Explorer URL
NEXT_PUBLIC_EXPLORER_URL=https://hashscan.io/testnet

# ============================================
# Smart Contract Addresses
# ============================================
NEXT_PUBLIC_AUCTION_ADDRESS=0x...
NEXT_PUBLIC_LOT_NFT_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_ADDRESS=0x...

# ============================================
# API Configuration
# ============================================
PORT=3001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# ============================================
# IPFS Configuration (Web3.Storage or Pinata)
# ============================================
# Option 1: Web3.Storage
IPFS_ENDPOINT=https://api.web3.storage
IPFS_TOKEN=your_web3_storage_token
IPFS_GATEWAY=https://w3s.link

# Option 2: Pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
IPFS_GATEWAY=https://gateway.pinata.cloud

# ============================================
# AI Services (OpenAI)
# ============================================
NEXT_PUBLIC_AI_API_KEY=sk-your_openai_api_key

# ============================================
# n8n Workflow Automation (Optional)
# ============================================
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key

# ============================================
# Security
# ============================================
ADMIN_KEY=your_secure_admin_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# ============================================
# HashConnect Wallet Configuration
# ============================================
NEXT_PUBLIC_HASHCONNECT_NETWORK=testnet
NEXT_PUBLIC_HASHCONNECT_APP_NAME=TraceTrade
```

### 4. Database Setup

```bash
# Initialize database with schema
pnpm prisma db push

# (Optional) Seed the database with sample data
pnpm run db:seed

# (Optional) Reset database (⚠️ WARNING: Deletes all data)
pnpm run db:reset
```

### 5. Start Development Server

```bash
# Start Next.js development server
pnpm dev

# The application will be available at:
# Frontend: http://localhost:3000
# API Routes: http://localhost:3000/api/*
```

For development with hot reload, the server will automatically restart when you make changes.

## 🐳 Docker Development

### Using Docker Compose

```bash
# Start all services (Next.js + Nginx)
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Building Docker Image

```bash
# Build development image
docker build -f Dockerfile.dev -t tracetrade:dev .

# Run container
docker run -p 3000:3000 --env-file .env tracetrade:dev
```

## 📁 Project Structure

```
TraceTrade/
├── app
```
