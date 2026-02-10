# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cards Against Singularity - A real-time multiplayer "Cards Against Humanity" parody game focused on AI/tech humor, with NFT minting capabilities on Base Sepolia.

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
  - Messages: `addCard`, `moveCard`, `clearCards`

### Frontend (Next.js App Router)
- `app/game.tsx` - Main game component using `usePartySocket` for real-time sync
  - Cards are draggable (Framer Motion) with positions synced across clients
  - Game state captured via html-to-image → Vercel Blob for NFT minting

### NFT Minting (Coinbase CDP)
- `lib/cdp/` - Custom CDP Agentkit wrapper for wallet operations
- `app/api/mint/route.ts` - Mints NFT to user's wallet address
- `app/api/deploy/route.ts` - Deploys new NFT collection contract
- Uses singleton wallet pattern with persistent wallet data from `wallet_data.txt`

### Components
- `components/card.tsx` - Black/white card rendering
- `components/mint-game-state.tsx` - NFT minting modal with wallet input and status tracking
- `components/ui/` - Radix-based UI primitives (Dialog, Button, Input)

## Environment Variables

Required for NFT functionality:
- `CDP_API_KEY_NAME` - Coinbase CDP API key name (server-side)
- `CDP_API_KEY_PRIVATE_KEY` - Coinbase CDP API private key (server-side)
- `NEXT_PUBLIC_NFT_CONTRACT` - Deployed NFT contract address (public)
- `VERCEL_BLOB_RW_TOKEN` - Vercel Blob storage token (server-side)
- `NEXT_PUBLIC_PARTYKIT_HOST` - PartyKit server host (public)
