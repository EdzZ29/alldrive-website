import { Navbar } from "./_components/navbar";
import { Hero } from "./_components/hero";
import { Marquee } from "./_components/marquee";
import { Fleet } from "./_components/fleet";
import { Estimator } from "./_components/estimator";
import { Rates } from "./_components/rates";
import { DriverFees } from "./_components/driver-fees";
import { Services } from "./_components/services";
import { WhyUs } from "./_components/why-us";
import { Contact, Footer } from "./_components/contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Fleet />
        <Estimator />
        <Rates />
        <DriverFees />
        <Services />
        <WhyUs />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
