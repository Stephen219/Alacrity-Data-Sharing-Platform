import LandingPage from "@/components/LandingPage";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function organisation(){
    return <>
        <LandingPage/>
        <div className="justify-center flex flex-col sm:flex-row gap-4 mb-12">
          <Link href="#" className={buttonVariants()}>Upload Data</Link>
          <Button variant="ghost">Approve Access&rarr;</Button>
        </div>
    </>
}