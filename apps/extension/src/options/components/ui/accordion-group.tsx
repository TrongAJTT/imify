import React, { createContext, useContext, useState } from "react"

interface AccordionGroupContextType {
  openId: string | null
  setOpenId: (id: string | null) => void
}

const AccordionGroupContext = createContext<AccordionGroupContextType | undefined>(undefined)

/**
 * AccordionGroup provider enables mutually exclusive accordion behavior.
 * Only one accordion can be open at a time within the group.
 */
export function AccordionGroup({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <AccordionGroupContext.Provider value={{ openId, setOpenId }}>
      {children}
    </AccordionGroupContext.Provider>
  )
}

export function useAccordionGroup(): AccordionGroupContextType | undefined {
  return useContext(AccordionGroupContext)
}
