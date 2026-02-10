"use client"

import { useState, useRef } from "react"
import { usePartySocket } from "partysocket/react"
import { Card } from "@/components/card"
import { Button } from "@/components/ui/button"
import { motion, PanInfo } from "framer-motion"
import Image from "next/image"
import { RotateCcw, Plus, Sparkles } from "lucide-react"
import MintGameState from "@/components/mint-game-state"
import { toPng } from 'html-to-image'

type CardPosition = {
  x: number
  y: number
  rotation: number
}

type PlayedCard = {
  id: string
  content: string
  position: CardPosition
  isBlack: boolean
}

type GameState = {
  playedCards: Record<string, PlayedCard>
  availablePrompts: string[]
  availableAnswers: string[]
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const dragOrigins = useRef<Record<string, { x: number; y: number }>>({})
  const gameRef = useRef<HTMLDivElement>(null)
  const [showMintModal, setShowMintModal] = useState(false)
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Adjust card positions to fit within viewport (for mobile)
  const adjustPositionsForViewport = (state: GameState): GameState => {
    const isMobile = window.innerWidth < 768
    if (!isMobile) return state

    const viewportWidth = window.innerWidth
    const cardWidth = 144 // mobile card width (w-36)
    const cardHeight = 208 // mobile card height (h-52)
    const centerX = (viewportWidth - cardWidth) / 2
    const startY = 80 // Below header

    const adjustedCards: Record<string, PlayedCard> = {}
    const cardEntries = Object.entries(state.playedCards)

    cardEntries.forEach(([id, card]) => {
      // Check if this is a default card or off-screen
      const isOffScreen = card.position.x < 0 || card.position.x > (viewportWidth - cardWidth)
      const isDefaultCard = id === 'default-black' || id === 'default-white'

      if (isOffScreen || isDefaultCard) {
        // Position cards stacked with slight overlap, opposite tilts
        const isBlackCard = card.isBlack
        const yOffset = isBlackCard ? 0 : cardHeight - 40 // White card overlaps black by 40px
        const xOffset = isBlackCard ? -15 : 15 // Slight horizontal offset
        const rotation = isBlackCard ? -6 : 6 // Opposite tilts

        adjustedCards[id] = {
          ...card,
          position: {
            x: centerX + xOffset,
            y: startY + yOffset,
            rotation: rotation
          }
        }
      } else {
        // Keep user-positioned cards as-is (clamped to viewport)
        adjustedCards[id] = {
          ...card,
          position: {
            ...card.position,
            x: Math.max(8, Math.min(card.position.x, viewportWidth - cardWidth - 8))
          }
        }
      }
    })

    return { ...state, playedCards: adjustedCards }
  }

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: "game",
    onMessage(event) {
      const data = JSON.parse(event.data)
      if (data.type === "gameState") {
        setGameState(adjustPositionsForViewport(data.state))
      }
    },
  })

  const addCard = (isBlack: boolean) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    socket.send(JSON.stringify({ type: "addCard", isBlack, viewport }))
  }

  const clearCards = () => {
    socket.send(JSON.stringify({ type: "clearCards" }))
  }

  const updateCardPosition = (cardId: string, position: CardPosition) => {
    socket.send(JSON.stringify({ type: "moveCard", cardId, position }))
  }

  const handleDragStart = (cardId: string) => {
    if (!gameState?.playedCards[cardId]) return
    
    // Store the original position when starting to drag
    dragOrigins.current[cardId] = {
      x: gameState.playedCards[cardId].position.x,
      y: gameState.playedCards[cardId].position.y
    }
    setDraggedCard(cardId)
  }

  const handleDragEnd = (cardId: string, info: PanInfo) => {
    if (!gameState?.playedCards[cardId]) return

    const originalPosition = dragOrigins.current[cardId]
    if (!originalPosition) return

    const position = {
      x: originalPosition.x + info.offset.x,
      y: originalPosition.y + info.offset.y,
      rotation: (Math.random() - 0.5) * 10
    }
    
    updateCardPosition(cardId, position)
    setDraggedCard(null)
    delete dragOrigins.current[cardId]
  }

  const processGameState = async () => {
    if (!gameRef.current) return null

    try {
      setIsProcessing(true)
      // Capture the game state
      const dataUrl = await toPng(gameRef.current)

      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      // Upload to Vercel Blob via API route
      const formData = new FormData()
      formData.append('file', blob, 'game-state.png')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      const { url } = await uploadResponse.json()
      setCapturedImageUrl(url)
    } catch (err) {
      console.error('Failed to capture game state:', err)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMint = () => {
    setShowMintModal(true)
    processGameState()
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Loading game board...</h2>
          <p className="text-sm sm:text-base text-gray-400">Please wait while we set up the cards</p>
        </div>
      </div>
    )
  }

  // Sort cards so black cards are rendered first (appearing below white cards)
  const sortedCards = Object.values(gameState.playedCards).sort((a, b) => {
    if (a.isBlack === b.isBlack) return 0
    return a.isBlack ? -1 : 1
  })

  return (
    <div className="min-h-screen relative text-white flex flex-col overflow-hidden bg-[#111111]">
      {/* Background */}
      <div className="fixed inset-0 w-full h-full bg-[#0000FF]" />
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-10">
          <div className="h-1.5 w-full" />
          <div className="max-w-7xl mx-auto">
            {/* Navigation Bar */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
              <div className="flex items-center gap-3 sm:gap-6">
                <a
                  href="https://x.com/Must_be_Ash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 group"
                >
                  <Image
                    src="/logo-white.svg"
                    alt="Cards Against Singularity"
                    width={32}
                    height={32}
                    className="group-hover:opacity-80 transition-opacity sm:w-10 sm:h-10"
                  />
                  <div className="hidden sm:block border-l border-white/10 pl-3">
                    <p className="text-xs text-white font-bold">Cards Against Singularity</p>
                    <p className="text-xs text-gray-400">A parody card game for AI humor</p>
                  </div>
                </a>
              </div>
              {/* Desktop buttons */}
              <div className="hidden md:flex items-center gap-4">
                <Button
                  onClick={clearCards}
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 hover:text-orange-500 transition-colors"
                  title="Reset Cards"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-white/10" />
                <Button
                  onClick={handleMint}
                  className="bg-black text-white border border-white/20 hover:bg-white/10"
                >
                  Mint NFT
                </Button>
                <Button
                  onClick={() => addCard(true)}
                  className="bg-black text-white border border-white hover:bg-gray-900"
                >
                  Add Black Card
                </Button>
                <Button
                  onClick={() => addCard(false)}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  Add White Card
                </Button>
              </div>
              {/* Mobile buttons - compact */}
              <div className="flex md:hidden items-center gap-2">
                <Button
                  onClick={clearCards}
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10"
                  title="Reset Cards"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={handleMint}
                  size="sm"
                  className="bg-black text-white border border-white/20 hover:bg-white/10 text-xs px-2 h-8"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Mint
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="pt-16 sm:pt-24 pb-32 sm:pb-24 flex-grow relative overflow-x-hidden overflow-y-auto">
          <div
            ref={gameRef}
            className="relative min-h-[calc(100vh-12rem)] w-full"
          >
            {sortedCards.map((card) => (
              <motion.div
                key={card.id}
                drag
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => handleDragStart(card.id)}
                onDragEnd={(_, info) => handleDragEnd(card.id, info)}
                initial={{ x: card.position.x, y: card.position.y, rotate: card.position.rotation }}
                animate={{
                  x: card.position.x,
                  y: card.position.y,
                  rotate: card.position.rotation,
                  scale: draggedCard === card.id ? 1.05 : 1,
                  zIndex: card.isBlack ? 1 : 2
                }}
                transition={{
                  type: "tween",
                  duration: 0.1
                }}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{ touchAction: "none" }}
              >
                <Card
                  content={card.content}
                  isBlack={card.isBlack}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <MintGameState
          isOpen={showMintModal}
          onClose={() => {
            setShowMintModal(false)
            setCapturedImageUrl(null)
          }}
          imageUrl={capturedImageUrl || ''}
          isProcessing={isProcessing}
        />

        {/* Mobile floating action buttons */}
        <div className="fixed bottom-24 left-0 right-0 flex md:hidden justify-center gap-3 z-20 px-4">
          <Button
            onClick={() => addCard(true)}
            className="bg-black text-white border border-white shadow-lg flex-1 max-w-[140px] active:bg-black focus:bg-black hover:bg-black/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Black
          </Button>
          <Button
            onClick={() => addCard(false)}
            className="bg-white text-black shadow-lg flex-1 max-w-[140px] active:bg-white focus:bg-white hover:bg-gray-100"
          >
            <Plus className="h-4 w-4 mr-1" />
            White
          </Button>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/90 to-transparent backdrop-blur-md">
          <div className="max-w-7xl mx-auto py-3 sm:py-6">
            <div className="flex flex-col items-center justify-center gap-2 sm:gap-4">
              {/* Attribution */}
              <div className="flex items-center gap-2 sm:gap-3 group">
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <Image
                    src="/logo-white.svg"
                    alt="Cards Against Singularity"
                    width={14}
                    height={14}
                    className="group-hover:opacity-100 opacity-70 transition-opacity sm:w-[18px] sm:h-[18px]"
                  />
                  <p className="text-xs sm:text-sm">
                    Built by{" "}
                    <a
                      href="https://x.com/Must_be_Ash"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-400 font-semibold transition-colors"
                    >
                      @Must_be_Ash
                    </a>
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[10px] sm:text-xs text-white text-center px-4">
                This is a parody game inspired by Cards Against Humanity and is not affiliated with, endorsed, or sponsored by Cards Against Humanity.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 