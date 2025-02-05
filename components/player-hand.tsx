import { Card } from "./card"

interface PlayerHandProps {
  cards: string[]
  onPlayCard: (card: string) => void
  isActive: boolean
}

export function PlayerHand({ cards, onPlayCard, isActive }: PlayerHandProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="flex gap-4 overflow-x-auto pb-4 justify-center">
        {cards.map((card, index) => (
          <div key={index} className="transform hover:-translate-y-4 transition-transform">
            <Card content={card} onClick={() => isActive && onPlayCard(card)} />
          </div>
        ))}
      </div>
    </div>
  )
}

