import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileTabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface MobileTabsListProps {
  children: React.ReactNode
  className?: string
}

interface MobileTabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface MobileTabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

const MobileTabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

const MobileTabs: React.FC<MobileTabsProps> = ({ 
  value, 
  onValueChange, 
  children, 
  className 
}) => {
  return (
    <MobileTabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </MobileTabsContext.Provider>
  )
}

const MobileTabsList: React.FC<MobileTabsListProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3",
      "snap-x snap-mandatory",
      className
    )}>
      {children}
    </div>
  )
}

const MobileTabsTrigger: React.FC<MobileTabsTriggerProps> = ({ 
  value, 
  children, 
  className 
}) => {
  const context = React.useContext(MobileTabsContext)
  if (!context) throw new Error("MobileTabsTrigger must be used within MobileTabs")
  
  const { value: activeValue, onValueChange } = context
  const isActive = activeValue === value

  return (
    <button
      className={cn(
        "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 snap-start",
        "whitespace-nowrap select-none touch-manipulation",
        isActive 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        className
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}

const MobileTabsContent: React.FC<MobileTabsContentProps> = ({ 
  value, 
  children, 
  className 
}) => {
  const context = React.useContext(MobileTabsContext)
  if (!context) throw new Error("MobileTabsContent must be used within MobileTabs")
  
  const { value: activeValue } = context
  if (activeValue !== value) return null

  return (
    <div className={cn("animate-fade-in", className)}>
      {children}
    </div>
  )
}

export { MobileTabs, MobileTabsList, MobileTabsTrigger, MobileTabsContent }