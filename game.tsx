"use client"

import { useState } from "react"
import { usePartySocket } from "partysocket/react"
import { Card } from "./components/card"
import { PlayerHand } from "./components/player-hand"
import { Button } from "@/components/ui/button"

type Player = {
  id: string
  name: string
  hand: string[]
  score: number
}

type GameState = {
  players: Record<string, Player>
  currentPrompt: string | null
  submissions: Record<string, string>
  czar: string | null
  phase: "joining" | "playing" | "judging" | "scoring"
  availablePrompts: string[]
  availableAnswers: string[]
}

export default function Game() {
  const [playerName, setPlayerName] = useState("")
  const [gameState, setGameState] = useState<GameState | null>(null)

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

  const joinGame = () => {
    if (playerName) {
      socket.send(JSON.stringify({ type: "join", name: playerName }))
    }
  }

  const playCard = (card: string) => {
    socket.send(JSON.stringify({ type: "playCard", card }))
  }

  const selectWinner = (playerId: string) => {
    socket.send(JSON.stringify({ type: "selectWinner", playerId }))
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="space-y-6 text-center">
          <h1 className="text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Cards Against Singularity
          </h1>
          <p className="text-gray-400 mb-8">The AI-themed card game for developers</p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              className="p-3 w-64 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinGame()}
            />
            <div>
              <Button 
                onClick={joinGame}
                className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-6 rounded-lg"
              >
                Join Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isPlayerCzar = gameState.czar === socket.id
  const currentPlayer = gameState.players[socket.id]
  const playerCount = Object.keys(gameState.players).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-sm z-10">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Cards Against Singularity</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">Players: {playerCount}</div>
            <div className="text-sm bg-white/10 px-3 py-1 rounded-full">
              Score: {currentPlayer?.score || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className="fixed top-20 left-0 right-0 text-center text-sm text-gray-400 z-10">
        {isPlayerCzar 
          ? "You are the Card Czar - Wait for others to play their cards" 
          : gameState.phase === "playing" 
            ? "Pick your best card!" 
            : "Waiting for the Card Czar to pick a winner"}
      </div>

      {/* Main Game Area */}
      <div className="pt-32 px-4 pb-40">
        {/* Current prompt */}
        {gameState.currentPrompt && (
          <div className="flex justify-center mb-12">
            <Card content={gameState.currentPrompt} isBlack />
          </div>
        )}

        {/* Played cards */}
        {gameState.phase === "judging" && (
          <div className="flex flex-wrap gap-6 justify-center">
            {Object.entries(gameState.submissions).map(([playerId, card]) => (
              <div key={playerId} className="transform hover:scale-105 transition-transform">
                <Card 
                  content={card as string} 
                  onClick={() => isPlayerCzar && selectWinner(playerId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player's hand */}
      <PlayerHand
        cards={currentPlayer?.hand || []}
        onPlayCard={playCard}
        isActive={!isPlayerCzar && gameState.phase === "playing"}
      />
    </div>
  )
}

