# Africa Gate - B2B Trading Marketplace

A sophisticated blockchain-powered B2B marketplace for African commodity trading with real-world asset tokenization, AI-powered insights, and automated workflow management.

## 🌟 Features

### Core Marketplace
- **Real-World Asset Tokenization**: Convert physical commodities into NFTs for transparent trading
- **Smart Contract Auctions**: Automated escrow and settlement via Hedera blockchain
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

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- pnpm package manager
- Hedera testnet account (ECDSA key type)
- HashPack wallet (for testing)
- IPFS pinning service account (Web3.Storage or Pinata)

### Environment Setup

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd tracetrade

# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
\`\`\`

### Required Environment Variables

\`\`\`env
# Blockchain Configuration
NEXT_PUBLIC_RPC_URL=https://testnet.hashio.io/api
NEXT_PUBLIC_AUCTION_ADDRESS=0x...
NEXT_PUBLIC_LOT_NFT_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_EXPLORER_URL=https://hashscan.io/testnet

# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e...
HCS_TOPIC_ID=0.0.xxxxx
NEXT_PUBLIC_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# API Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# IPFS Configuration
IPFS_ENDPOINT=https://api.web3.storage
IPFS_TOKEN=your_web3_storage_token
IPFS_GATEWAY=https://w3s.link

# AI Services
NEXT_PUBLIC_AI_API_KEY=your_ai_api_key

# n8n Workflow Automation
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key

# Security
ADMIN_KEY=your_admin_key
\`\`\`

### Development

\`\`\`bash
# Start the development server
pnpm dev

# Start backend API (in separate terminal)
cd api && pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
\`\`\`

## 📁 Project Structure

\`\`\`
tracetrade/
├── app/                    # Next.js app router pages
│   ├── auctions/          # Auction listing and detail pages
│   ├── marketplace/       # Main marketplace interface
│   ├── tokenization/      # Asset tokenization tools
│   ├── dashboard/         # User dashboard
│   └── workflows/         # Workflow management
├── components/            # Reusable React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── navigation.tsx    # Main navigation component
│   ├── ai-insights.tsx   # AI analysis components
│   └── workflow-dashboard.tsx
├── api/                   # Backend API server
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   └── middleware/       # Express middleware
├── lib/                   # Utility libraries
│   ├── blockchain.ts     # Blockchain interaction utilities
│   ├── ai-services.ts    # AI integration services
│   └── n8n-workflows.ts  # Workflow automation
├── hooks/                 # React hooks
├── contracts/            # Solidity smart contracts
└── scripts/              # Deployment and utility scripts
\`\`\`

## 🔧 Smart Contracts

### AuctionHouse Contract
- **NFT Escrow**: Automatically holds lot NFTs during auctions
- **Bid Management**: Handles bid placement and refunds
- **Settlement**: Automated NFT/fund swapping on auction completion
- **Fee Collection**: Configurable platform fees

### TraceTradeLot NFT
- **Metadata Storage**: IPFS-based metadata with HIP-412 compliance
- **Ownership Transfer**: Seamless NFT transfers on auction settlement
- **Batch Operations**: Efficient multi-lot management

### Demo Token Contract
- **ERC-20 Compatibility**: Standard token interface for bidding
- **Faucet Functionality**: Test token distribution for development
- **Allowance Management**: Secure bid authorization

## 🤖 AI Features

### Market Analysis
- **Price Recommendations**: AI-powered reserve price suggestions
- **Market Trends**: Real-time commodity market analysis
- **Risk Assessment**: Automated bid and seller risk evaluation
- **Historical Data**: Comprehensive market performance tracking

### Treasury Management
- **Cash Flow Analysis**: Automated financial health monitoring
- **Payment Optimization**: Best payment method recommendations
- **Risk Scoring**: Multi-factor risk assessment algorithms
- **Portfolio Insights**: Diversification and exposure analysis

## 🔄 Workflow Automation

### Available Workflows
1. **Auction Lifecycle**: Complete auction management from creation to settlement
2. **Compliance Checking**: Automated KYC and regulatory compliance
3. **Payment Processing**: End-to-end payment verification and processing
4. **Inventory Management**: Physical asset tracking and logistics
5. **Market Analytics**: Automated reporting and data analysis

### Workflow Triggers
- Auction events (created, started, ended, settled)
- User actions (registration, high-value bids)
- Payment events (received, failed, disputed)
- Compliance flags and risk alerts
- Scheduled tasks (daily reports, market analysis)

## 🧪 Testing

### Integration Tests
\`\`\`bash
# Run full integration test suite
pnpm test:integration

# Test specific components
pnpm test:api
pnpm test:blockchain
pnpm test:workflows
\`\`\`

### Test Coverage
- API endpoint functionality
- Smart contract interactions
- Workflow automation
- AI service integration
- Security and performance

## 🚀 Deployment

### Vercel Deployment (Frontend)
\`\`\`bash
# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
\`\`\`

### Backend Deployment (Railway/Render)
\`\`\`bash
# Deploy API server
railway deploy
# or
render deploy
\`\`\`

### Smart Contract Deployment
\`\`\`bash
# Deploy to Hedera testnet
cd contracts
pnpm hardhat run scripts/deploy.ts --network hedera_testnet
\`\`\`

## 📊 Monitoring & Analytics

### Health Checks
- API endpoint monitoring
- Blockchain connection status
- Workflow execution tracking
- AI service availability

### Performance Metrics
- Response time monitoring
- Transaction success rates
- Workflow completion rates
- User engagement analytics

## 🔒 Security

### Best Practices
- Smart contract auditing
- Input validation and sanitization
- Rate limiting and DDoS protection
- Secure environment variable management
- Regular security updates

### Compliance
- KYC/AML integration
- Regulatory reporting
- Data privacy (GDPR compliance)
- Financial transaction monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core marketplace functionality
- ✅ Smart contract integration
- ✅ AI-powered insights
- ✅ Workflow automation

### Phase 2 (Next)
- Multi-language support
- Mobile application
- Advanced analytics dashboard
- Cross-chain integration

### Phase 3 (Future)
- Decentralized governance
- Staking mechanisms
- Advanced DeFi features
- Global expansion

---

Built with ❤️ for the African B2B trading community
