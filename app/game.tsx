"use client"

import { useState, useRef } from "react"
import { usePartySocket } from "partysocket/react"
import { Card } from "@/components/card"
import { Button } from "@/components/ui/button"
import { motion, PanInfo } from "framer-motion"
import Image from "next/image"
import { RotateCcw } from "lucide-react"
import MintGameState from "@/components/mint-game-state"
import { toPng } from 'html-to-image'
import { put } from '@vercel/blob'

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

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: "game",
    onMessage(event) {
      const data = JSON.parse(event.data)
      if (data.type === "gameState") {
        setGameState(data.state)
      }
    },
  })

  const addCard = (isBlack: boolean) => {
    socket.send(JSON.stringify({ type: "addCard", isBlack }))
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
      
      // Upload to Vercel Blob
      const { url } = await put('game-state.png', blob, {
        access: 'public',
        token: process.env.NEXT_PUBLIC_VERCEL_BLOB_RW_TOKEN!
      })

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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading game board...</h2>
          <p className="text-gray-400">Please wait while we set up the cards</p>
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
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-10">
          <div className="h-1.5 w-full" />
          <div className="max-w-7xl mx-auto">
            {/* Navigation Bar */}
            <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <a 
                  href="https://nvg8.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <Image
                    src="/nvg.svg"
                    alt="Navigate Logo"
                    width={40}
                    height={40}
                    className="group-hover:opacity-80 transition-opacity"
                  />
                  <div className="border-l border-white/10 pl-3">
                    <p className="text-xs text-orange-500 font-medium">powered by <span className="text-white font-bold">Navigate</span></p>
                    <p className="text-xs text-gray-400">The Data Marketplace for AI Agents <span className="text-blue-500">Built on Base</span></p>
                  </div>
                </a>
              </div>
              <div className="flex items-center gap-4">
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
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="pt-24 flex-grow relative">
          <div 
            ref={gameRef}
            className="relative min-h-[calc(100vh-12rem)] mx-auto"
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

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/90 to-transparent backdrop-blur-md">
          <div className="max-w-7xl mx-auto py-6">
            <div className="flex flex-col items-center justify-center gap-4">
              {/* Navigate Attribution */}
              <div className="flex items-center gap-3 group">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <Image
                    src="/nvg.svg"
                    alt="Navigate Logo"
                    width={18}
                    height={18}
                    className="group-hover:opacity-100 opacity-70 transition-opacity"
                  />
                  <p className="text-sm">
                    Built by{" "}
                    <a 
                      href="https://x.com/navigate_ai" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:text-orange-400 font-semibold transition-colors"
                    >
                      Navigate
                    </a>
                  </p>
                </div>
                <span className="text-orange-500/50">•</span>
                <a 
                  href="https://nvg8.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  The Data Marketplace for AI Agents
                </a>
              </div>

              {/* Disclaimer */}
              <div className="flex items-center gap-3 text-xs text-white">
                This is a parody game inspired by Cards Against Humanity and is not affiliated with, endorsed, or sponsored by Cards Against Humanity.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 