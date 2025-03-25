
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check immediately on mount
    checkMobile()
    
    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile === undefined ? false : isMobile
}
