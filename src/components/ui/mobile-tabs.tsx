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
    <div className={cn("mobile-tabs", className)}>
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
        "mobile-tab mobile-tap",
        isActive && "active",
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