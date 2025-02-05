import { cn } from "@/lib/utils"

interface CardProps {
  content: string
  isBlack?: boolean
  onClick?: () => void
}

export function Card({ content, isBlack, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "w-64 h-96 rounded-lg p-6 shadow-lg font-bold text-xl relative select-none",
        isBlack 
          ? "bg-black text-white border border-white/20" 
          : "bg-white text-black border-2 border-black",
      )}
      onClick={onClick}
    >
      <div className="h-full flex items-start">
        <p>{content}</p>
      </div>
      <div className="absolute bottom-4 left-4">
        <span className="text-sm font-normal">Cards Against Singularity™</span>
      </div>
    </div>
  )
}

