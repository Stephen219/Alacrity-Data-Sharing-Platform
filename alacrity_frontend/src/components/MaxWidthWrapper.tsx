import { cn } from "@/lib/utils"
import { ReactNode } from "react"

//ensures content is centered and responsive 

const MaxWidthWrapper = ({
    className,
    children
}: {
    className?: string
    children: ReactNode

}) => {
    return(
        <div 
        className={cn(
            "mx-auto w-full max-w-screen-xl px-2.5 md:px-20", 
        className
        )}>
            {children}
        </div>
    )
}

export default MaxWidthWrapper