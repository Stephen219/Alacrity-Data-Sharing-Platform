'use client'
import LandingPage from "@/components/LandingPage";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { withAccessControl } from "@/components/auth_guard/AccessControl";

function researcher(){
    return <>
        <LandingPage/>
        <div className="justify-center flex flex-col sm:flex-row gap-4 mb-12">
          <Link href="#" className={buttonVariants()}>Upload Research</Link>
          <Button variant="ghost">View Requests&rarr;</Button>
        </div>
    </>
}


export default withAccessControl(researcher, ['organization_admin', 'researcher', 'contributor']);