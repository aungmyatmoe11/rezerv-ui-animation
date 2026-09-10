import dynamic from 'next/dynamic';
import { Preloader } from '@/components/Preloader';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { BackToTop } from '@/components/BackToTop';
import { Hero } from '@/sections/hero/Hero';
import { Colors } from '@/sections/colors/Colors';
import { Design } from '@/sections/design/Design';
import { DynamicIsland } from '@/sections/dynamic-island/DynamicIsland';
import { Display } from '@/sections/display/Display';
import { CameraSensor } from '@/sections/camera-sensor/CameraSensor';
import { Aperture } from '@/sections/aperture/Aperture';
import { A20Pro } from '@/sections/a20/A20Pro';
import { C2Modem } from '@/sections/c2/C2Modem';
import { Battery } from '@/sections/battery/Battery';
import { ProVsProMax } from '@/sections/compare/ProVsProMax';
import { ConfidenceMap } from '@/sections/confidence/ConfidenceMap';

// Code-split Duo act + ending to reduce initial bundle / mobile TBT
// Duo sections are below-fold heavy, loaded on approach
const DuoTransition = dynamic(() => import('@/sections/duo-transition/DuoTransition').then(m => ({ default: m.DuoTransition })), { ssr: true });
const DuoHero = dynamic(() => import('@/sections/duo-hero/DuoHero').then(m => ({ default: m.DuoHero })), { ssr: true });
const Fold = dynamic(() => import('@/sections/fold/Fold').then(m => ({ default: m.Fold })), { ssr: true });
const Thickness = dynamic(() => import('@/sections/thickness/Thickness').then(m => ({ default: m.Thickness })), { ssr: true });
const TouchId = dynamic(() => import('@/sections/touch/TouchId').then(m => ({ default: m.TouchId })), { ssr: true });
const DuoColors = dynamic(() => import('@/sections/duo-colors/DuoColors').then(m => ({ default: m.DuoColors })), { ssr: true });
const ProVsDuo = dynamic(() => import('@/sections/compare-duo/ProVsDuo').then(m => ({ default: m.ProVsDuo })), { ssr: true });
const Ending = dynamic(() => import('@/sections/ending/Ending').then(m => ({ default: m.Ending })), { ssr: true });

/**
 * The whole product is one page.
 *
 * Three acts and a close, all built on the same primitives: ScrubStage for the
 * eight scroll-scrubbed films, FeatureFilm/LazyVideo for every other clip, and
 * Section for the one reveal batch.
 *
 *   01–02  the opening: preloader, hero film, colours
 *   03–11  the Pro act
 *   12–18  the Duo act, hinged on the one bright clip in the library
 *   19–20  the differentiators: the confidence map, then the sources
 *
 * The order is also a colour temperature: warm crimson through white to cool
 * silver and indigo, which is why the Duo transition sits exactly where it
 * does rather than anywhere else in the run.
 */
export default function Page() {
  return (
    <>
      <Preloader />
      <SiteNav />
      <main id="main">
        <Hero />
        <Colors />

        <Design />
        <DynamicIsland />
        <Display />
        <CameraSensor />
        <Aperture />
        <A20Pro />
        <C2Modem />
        <Battery />
        <ProVsProMax />

        <DuoTransition />
        <DuoHero />
        <Fold />
        <Thickness />
        <TouchId />
        <DuoColors />
        <ProVsDuo />

        <ConfidenceMap />
        <Ending />
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
