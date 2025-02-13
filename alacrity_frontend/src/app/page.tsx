import Charts from '@/components/Charts';
import LandingPage from '@/components/LandingPage';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';


export default function Home() {
  return (
    <>
    {/* Landing page content */}
    <LandingPage/>
    <div className="justify-center flex flex-col sm:flex-row gap-4 mb-12">
          <Link href="/auth/sign-up" className={buttonVariants()}>Sign Up</Link>
          <Button variant="ghost">Social Media &rarr;</Button>
        </div>
    <Charts/>


    </>
  )
}
