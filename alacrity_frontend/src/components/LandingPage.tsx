
import MaxWidthWrapper from "@/components/MaxWidthWrapper";


export default function LandingPage() {
  return (
    <>
    {/* Landing page content */}
    <MaxWidthWrapper>
      <div className="flex flex-col pt-12 pb-6 mx-auto text-center items-center max-w-3xl tracking-tight">
        <h1 className="text-2xl font-bold sm:text-5xl"> Your favourite platform for secure{''} <span className="text-primary">data collaboration</span>.
        </h1>
        <p className="mt-4 text-md max-w-prose">
        Welcome to Alacrity. The fastest way for organisations to upload, 
        manage, and share datasets while giving researchers secure, 
        on-platform analysis.
        </p>
      </div>
    </MaxWidthWrapper>

    </>
  )
}
