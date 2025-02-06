import Link from 'next/link'
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button, buttonVariants } from "@/components/ui/button";


export default function Home() {
  return (
    <>
    {/* Landing page content */}
    <MaxWidthWrapper>
      <div className="flex flex-col py-20 mx-auto text-center items-center max-w-3xl tracking-tight">
        <h1 className="text-4xl font-bold sm:text-6xl"> Your favourite platform for secure{''} <span className="text-primary">data collaboration</span>.
        </h1>
        <p className="mt-4 text-lg max-w-prose">
        Welcome to Alacrity. The fastest way for organisations to upload, 
        manage, and share datasets while giving researchers secure, 
        on-platform analysis.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link href="/uploadData" className={buttonVariants()}>Upload Data</Link>
          <Button variant="ghost">Approve Access &rarr;</Button>
        </div>
      </div>
    </MaxWidthWrapper>

    </>
  )
}
