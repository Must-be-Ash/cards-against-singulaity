import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { CdpClient } from "@coinbase/cdp-sdk"
import { encodeFunctionData, parseAbi, getAddress } from 'viem'
import satori from 'satori'
import sharp from 'sharp'
import { PROMPT_CARDS, ANSWER_CARDS } from '@/lib/cards'
import React from 'react'

// NFT contract ABI for minting
const NFT_ABI = parseAbi([
  'function mint(address to, uint256 quantity) external'
])

// NFT contract address on Base Sepolia
const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT || "0x3D13c2cEF827A30e7b1282F5C3Ef6F5C1c5c7268"

// Singleton CDP client
let cdpClient: CdpClient | null = null

function getCdpClient(): CdpClient {
  if (!cdpClient) {
    const apiKeyId = process.env.CDP_API_KEY_ID
    const apiKeySecret = process.env.CDP_API_KEY_SECRET
    const walletSecret = process.env.CDP_WALLET_SECRET

    if (!apiKeyId || !apiKeySecret || !walletSecret) {
      throw new Error('Missing CDP credentials')
    }

    cdpClient = new CdpClient({
      apiKeyId,
      apiKeySecret,
      walletSecret,
    })
  }
  return cdpClient
}

// Type definitions
interface CustomCard {
  content: string
  isBlack: boolean
}

interface AgentMintRequest {
  walletAddress: string
  promptIndices?: number[]
  answerIndices?: number[]
  customCards?: CustomCard[]
}

interface CardForImage {
  content: string
  isBlack: boolean
}

// Generate card image using Satori + Sharp
async function generateCardImage(cards: CardForImage[]): Promise<Buffer> {
  // Load a basic font (system font fallback)
  const fontData = await fetch(
    'https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-700-normal.woff'
  ).then(res => res.arrayBuffer())

  // Create card elements using React.createElement
  const cardElements = cards.map((card, i) => {
    const rotation = (Math.random() - 0.5) * 15
    const offsetX = i * 180
    const offsetY = Math.random() * 40

    return React.createElement(
      'div',
      {
        key: i,
        style: {
          display: 'flex',
          flexDirection: 'column' as const,
          width: '160px',
          height: '220px',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: card.isBlack ? '#000000' : '#ffffff',
          color: card.isBlack ? '#ffffff' : '#000000',
          border: card.isBlack ? '1px solid rgba(255,255,255,0.2)' : '2px solid #000000',
          fontWeight: 'bold',
          fontSize: '14px',
          position: 'absolute' as const,
          left: `${100 + offsetX}px`,
          top: `${100 + offsetY}px`,
          transform: `rotate(${rotation}deg)`,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        },
      },
      React.createElement('div', { style: { flex: 1 } }, card.content),
      React.createElement(
        'div',
        { style: { fontSize: '10px', fontWeight: 'normal', opacity: 0.7 } },
        'Cards Against Singularity'
      )
    )
  })

  const element = React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a2e',
        position: 'relative' as const,
      },
    },
    ...cardElements
  )

  const svg = await satori(element, {
    width: 800,
    height: 600,
    fonts: [
      {
        name: 'Inter',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  })

  // Convert SVG to PNG using Sharp
  const pngBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer()

  return pngBuffer
}

export async function POST(request: Request) {
  try {
    const body: AgentMintRequest = await request.json()
    const { walletAddress, promptIndices, answerIndices, customCards } = body

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    // Collect all cards to mint
    const cards: CardForImage[] = []

    // Add cards by index from prompts (black cards)
    if (promptIndices && promptIndices.length > 0) {
      for (const index of promptIndices) {
        if (index < 0 || index >= PROMPT_CARDS.length) {
          return NextResponse.json(
            { error: `Invalid prompt index: ${index}. Valid range: 0-${PROMPT_CARDS.length - 1}` },
            { status: 400 }
          )
        }
        cards.push({ content: PROMPT_CARDS[index], isBlack: true })
      }
    }

    // Add cards by index from answers (white cards)
    if (answerIndices && answerIndices.length > 0) {
      for (const index of answerIndices) {
        if (index < 0 || index >= ANSWER_CARDS.length) {
          return NextResponse.json(
            { error: `Invalid answer index: ${index}. Valid range: 0-${ANSWER_CARDS.length - 1}` },
            { status: 400 }
          )
        }
        cards.push({ content: ANSWER_CARDS[index], isBlack: false })
      }
    }

    // Add custom cards
    if (customCards && customCards.length > 0) {
      for (const card of customCards) {
        if (!card.content || typeof card.isBlack !== 'boolean') {
          return NextResponse.json(
            { error: 'Custom cards must have "content" (string) and "isBlack" (boolean)' },
            { status: 400 }
          )
        }
        cards.push({ content: card.content, isBlack: card.isBlack })
      }
    }

    // Ensure at least one card is selected
    if (cards.length === 0) {
      return NextResponse.json(
        { error: 'At least one card must be selected (via promptIndices, answerIndices, or customCards)' },
        { status: 400 }
      )
    }

    // Limit number of cards
    if (cards.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 cards allowed per mint' },
        { status: 400 }
      )
    }

    console.log('Agent mint request:', { walletAddress, cards: cards.length })

    // Generate card image
    const imageBuffer = await generateCardImage(cards)

    // Upload to Vercel Blob
    const timestamp = Date.now()
    const { url: imageUrl } = await put(
      `agent-mint-${timestamp}.png`,
      imageBuffer,
      {
        access: 'public',
        token: process.env.VERCEL_BLOB_RW_TOKEN!,
        contentType: 'image/png',
      }
    )

    console.log('Image uploaded:', imageUrl)

    // Get CDP client and mint NFT
    const cdp = getCdpClient()

    const account = await cdp.evm.getOrCreateAccount({
      name: "cards-against-singularity-minter"
    })

    // Normalize addresses
    const normalizedWalletAddress = getAddress(walletAddress)
    const normalizedContractAddress = getAddress(NFT_CONTRACT)

    // Encode mint function call
    const mintData = encodeFunctionData({
      abi: NFT_ABI,
      functionName: 'mint',
      args: [normalizedWalletAddress, BigInt(1)]
    })

    // Send mint transaction
    const sendResult = await cdp.evm.sendTransaction({
      address: account.address,
      network: "base-sepolia",
      transaction: {
        to: normalizedContractAddress,
        data: mintData,
      }
    })

    const transactionHash = sendResult.transactionHash
    const transactionLink = `https://sepolia.basescan.org/tx/${transactionHash}`

    console.log('NFT minted:', transactionHash)

    return NextResponse.json({
      success: true,
      transactionHash,
      transactionLink,
      imageUrl,
      cards,
      message: `Successfully minted NFT with ${cards.length} card(s) to ${walletAddress}`,
    })

  } catch (error) {
    console.error('Agent mint error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to mint NFT'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
