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
        "w-36 h-52 sm:w-64 sm:h-96 rounded-lg p-3 sm:p-6 shadow-lg font-bold text-sm sm:text-xl relative select-none",
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
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex items-center gap-1 sm:gap-2">
        <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 relative">
          <Image
            src={isBlack ? "/logo-white.svg" : "/logo.svg"}
            alt="Cards Against Singularity"
            fill
            className="object-contain"
          />
        </div>
        <span className="text-[8px] sm:text-sm font-normal whitespace-nowrap">Cards Against Singularity™</span>
      </div>
    </div>
  )
}

