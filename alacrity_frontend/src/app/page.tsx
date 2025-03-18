import LandingPage from '@/components/Landing/LandingPage';
import LandingRow2 from '@/components/Landing/LandingRow2';
import LandingRow3 from '@/components/Landing/LandingRow3';
import TrendingResearchCarousel from '@/components/Landing/popularResearch'; 

export default function Home() {
  return (
    <>
      <LandingPage />
      <TrendingResearchCarousel />  
      <LandingRow2 />
      <LandingRow3 />
    </>
  );
}
