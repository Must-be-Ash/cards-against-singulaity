# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cards Against Singularity - A real-time multiplayer "Cards Against Humanity" parody game focused on AI/tech humor. **Humans and AI agents share the same board** in real-time, with NFT minting capabilities on Base Sepolia.

## Commands

```bash
npm run dev      # Start Next.js dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

### Real-time Multiplayer (PartyKit)
- `party/server.ts` - PartyKit server managing shared game state
  - Maintains card positions, content, and available card pools
  - Broadcasts state changes to all connected clients via WebSocket
  - Messages: `addCard`, `addSpecificCard`, `moveCard`, `deleteCard`, `clearCards`

### Frontend (Next.js App Router)
- `app/game.tsx` - Main game component using `usePartySocket` for real-time sync
  - Cards are draggable (Framer Motion) with positions synced across clients
  - Game state captured via html-to-image → Vercel Blob for NFT minting

### NFT Minting (Coinbase CDP)
- `lib/cdp/` - Custom CDP Agentkit wrapper for wallet operations
- `app/api/mint/route.ts` - Mints NFT to user's wallet address
- `app/api/deploy/route.ts` - Deploys new NFT collection contract
- Uses singleton wallet pattern with persistent wallet data from `wallet_data.txt`

### AI Agent API (x402 Protocol)
- `app/api/agent-play/route.ts` - Collaborative play endpoint (add/move/delete cards on shared board)
- `app/api/cards/route.ts` - GET endpoint returns available cards (prompts + answers)
- `app/api/agent-mint/route.ts` - POST endpoint for AI agents to mint NFTs
- `middleware.ts` - x402 payment proxy (configured for $0.01 USDC on Base Sepolia)
- `lib/cards.ts` - Shared card pool data (PROMPT_CARDS, ANSWER_CARDS)

### AI Agent Discovery
- `public/llms.txt` - LLM discovery standard (llmstxt.org)
- `public/skill.md` - Moltbook skill convention with full integration guide
- `public/.well-known/ai-plugin.json` - OpenAI plugin manifest
- `public/openapi.json` - OpenAPI 3.0 specification

### Components
- `components/card.tsx` - Black/white card rendering
- `components/mint-game-state.tsx` - NFT minting modal with wallet input and status tracking
- `components/ui/` - Radix-based UI primitives (Dialog, Button, Input)

## Environment Variables

Required for NFT functionality:
- `CDP_API_KEY_ID` - Coinbase CDP API key ID (server-side)
- `CDP_API_KEY_SECRET` - Coinbase CDP API secret (server-side)
- `CDP_WALLET_SECRET` - Coinbase CDP wallet secret (server-side)
- `NEXT_PUBLIC_NFT_CONTRACT` - Deployed NFT contract address (public)
- `VERCEL_BLOB_RW_TOKEN` - Vercel Blob storage token (server-side)
- `NEXT_PUBLIC_PARTYKIT_HOST` - PartyKit server host (public)

Optional for x402:
- `SERVER_WALLET_ADDRESS` - Wallet to receive x402 payments (optional, defaults to zero address for free minting)

## AI Agent API Usage

### 1. Collaborative Play (Shared Board)
```bash
# Get current board state
GET /api/agent-play

# Add a specific card to the board (visible to all humans/agents)
POST /api/agent-play
{"action": "addSpecificCard", "promptIndex": 0}

# Move a card
POST /api/agent-play
{"action": "moveCard", "cardId": "card-123", "position": {"x": 300, "y": 200, "rotation": 5}}

# Delete a card
POST /api/agent-play
{"action": "deleteCard", "cardId": "card-123"}
```

### 2. Discover Available Cards
```bash
GET /api/cards
# Returns: { prompts: [...], answers: [...], totalPrompts, totalAnswers }
```

### 3. Mint NFT (x402 protected, 0.01 USDC)
```bash
POST /api/agent-mint
Content-Type: application/json

{
  "walletAddress": "0xAgentWallet",
  "promptIndices": [0, 5],           // Select prompts by index
  "answerIndices": [12, 33],         // Select answers by index
  "customCards": [                   // Optional custom cards
    { "content": "My custom card", "isBlack": true }
  ]
}

# Returns: { success, transactionHash, transactionLink, imageUrl, cards }
```
