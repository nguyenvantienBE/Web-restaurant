import { Navbar } from "@/components/layout/Navbar";
import { SubNav } from "@/components/layout/SubNav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { MenuSection } from "@/components/sections/MenuSection";
import { Chef } from "@/components/sections/Chef";
import { Gallery } from "@/components/sections/Gallery";
import { LiveStatus } from "@/components/sections/LiveStatus";

export default function Home() {
  return (
    <main className="w-full min-w-0 overflow-x-clip">
      <Navbar />
      <Hero />
      <SubNav />
      <About />
      <MenuSection />
      <Chef />
      <Gallery />
      <Footer />
      <LiveStatus />
    </main>
  );
}
