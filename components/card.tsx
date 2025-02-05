import { cn } from "@/lib/utils"
import Image from "next/image"

interface CardProps {
  content: string
  isBlack?: boolean
  onClick?: () => void
  isDraggable?: boolean
}

export function Card({ content, isBlack, onClick, isDraggable }: CardProps) {
  return (
    <div
      className={cn(
        "w-64 h-96 rounded-lg p-6 shadow-lg font-bold text-xl relative select-none",
        isBlack 
          ? "bg-black text-white border border-white/20" 
          : "bg-white text-black border-2 border-black",
        isDraggable && "cursor-grab active:cursor-grabbing"
      )}
      onClick={onClick}
    >
      <div className="h-full flex items-start">
        <p>{content}</p>
      </div>
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="w-4 h-4 relative">
          <Image
            src="/nvg.svg"
            alt="Navigate Logo"
            fill
            className="object-contain"
          />
        </div>
        <span className="text-sm font-normal">Cards Against Singularity™</span>
      </div>
    </div>
  )
}

