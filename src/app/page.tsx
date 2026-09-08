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

// Code-split Ultra act + ending to reduce initial bundle / mobile TBT
// Ultra sections are below-fold heavy, loaded on approach
const UltraTransition = dynamic(() => import('@/sections/ultra-transition/UltraTransition').then(m => ({ default: m.UltraTransition })), { ssr: true });
const UltraHero = dynamic(() => import('@/sections/ultra-hero/UltraHero').then(m => ({ default: m.UltraHero })), { ssr: true });
const Fold = dynamic(() => import('@/sections/fold/Fold').then(m => ({ default: m.Fold })), { ssr: true });
const Thickness = dynamic(() => import('@/sections/thickness/Thickness').then(m => ({ default: m.Thickness })), { ssr: true });
const TouchId = dynamic(() => import('@/sections/touch/TouchId').then(m => ({ default: m.TouchId })), { ssr: true });
const UltraColors = dynamic(() => import('@/sections/ultra-colors/UltraColors').then(m => ({ default: m.UltraColors })), { ssr: true });
const ProVsUltra = dynamic(() => import('@/sections/compare-ultra/ProVsUltra').then(m => ({ default: m.ProVsUltra })), { ssr: true });
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
 *   12–18  the Ultra act, hinged on the one bright clip in the library
 *   19–20  the differentiators: the confidence map, then the sources
 *
 * The order is also a colour temperature: warm crimson through white to cool
 * silver and indigo, which is why the Ultra transition sits exactly where it
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

        <UltraTransition />
        <UltraHero />
        <Fold />
        <Thickness />
        <TouchId />
        <UltraColors />
        <ProVsUltra />

        <ConfidenceMap />
        <Ending />
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
