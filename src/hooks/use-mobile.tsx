
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [initialized, setInitialized] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      if (!initialized) setInitialized(true)
    }
    
    // Check immediately on mount
    checkIfMobile()
    
    // Set up listener for window resize
    window.addEventListener("resize", checkIfMobile)
    
    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [initialized])

  return isMobile
}
