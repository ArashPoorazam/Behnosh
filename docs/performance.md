# Performance and asset report

## Asset choice

The HQ tropical can was evaluated first as requested. The shipped derivative uses its sharper **AI-reconstructed texture**, not the original-art variant. Fine print, logo details and illustrations can differ from the supplied photograph; this choice is acceptable only for the showcase. Original-art HQ and lower-resolution can sources remain intact for comparison. The classic bottle retains its original photographic label. Hidden surfaces and dimensions are inferred; GLBs do not include studio lighting. The website supplies a local procedural room environment and lights.

| Asset | Source triangles | Derivative triangles | Source bytes | Derivative bytes |
|---|---:|---:|---:|---:|
| Tropical HQ | 121,344 | 28,352 | 3,303,276 | 701,516 |
| Classic bottle | 43,792 | 10,502 | 978,292 | 234,576 |

The tropical payload drops about 79%; triangles drop about 77%. glTF Transform weld/simplify/dedup/prune and embedded WebP textures (maximum 1024 px) produce the derivatives. Transparent Blender-rendered WebP posters are about 84 KB and 28 KB. Original GLBs, Blender files, textures and build scripts are unchanged. The optimized geometry was inspected on desktop/mobile; the full-detail source was not benchmarked at equivalent hardware/frame rate, so payload reduction is not a claim of a measured source-vs-derivative FPS speedup.

Additional Draco/Meshopt bitstream and KTX2 compression have not been benchmarked. At this payload size, avoiding decoder downloads/complexity is the initial tradeoff; measure actual visitor devices before adding them.

## Runtime strategy

HTML typography and product poster render before dynamic Three/R3F loading. Canvas renders on demand. A short entrance float ends; scrolling invalidates the scene. Hidden tabs suppress invalidation. No postprocessing, remote HDR, runtime CDN or per-frame React state updates. DPR is capped at 1.25 and reduced to 0.75 when a window of 16 contiguous active frame samples averages over 32 ms. This trades sharpness for responsiveness on slow renderers; it is not an FPS guarantee. Reduced-motion users receive the poster without loading the canvas. Failed assets/WebGL retain the poster and all shopping controls.

## Measurement environment and interpretation

`node scripts/performance.mjs` records browser PerformanceObserver paint/layout/event timing, requestAnimationFrame intervals during a four-second scripted scroll, and resource transfer sizes. Latest raw results are in `performance-measurements.json`. CPU: Intel i7-11800H, 16 logical CPUs. Chromium 155.0.8059.84, **SwiftShader software GPU**, Next production mode, localhost unthrottled, cold browser contexts at 1440×1000 and 390×844. Mobile is emulation, not a physical phone.

The initial production sample before adaptive quality measured:

| Metric | Desktop | Mobile emulation |
|---|---:|---:|
| LCP | 632 ms | 216 ms |
| CLS | 0.0080 | 0.0032 |
| Largest sampled event duration | 880 ms | 512 ms |
| Active-scroll RAF median | 16.7 ms | 83.3 ms |
| Active-scroll RAF p95 | 250 ms | 100 ms |
| Transferred resources | 1.09 MB | 1.05 MB |

The initial measurements exposed a real responsiveness gap, prompting adaptive DPR. A follow-up sample is recorded below when run. Frame intervals measure main-thread scheduling and include software rendering cost; they are not a GPU trace. Event durations from a small scripted interaction set are **not field INP**. These single runs are not distributions or representative Iranian network results. Lighthouse was not used. No real-user telemetry was collected.

**Acceptance remains incomplete:** fast localhost LCP and low CLS do not establish field targets; consistent 60 fps and INP ≤200 ms are not proven. The next performance work is device testing (midrange Android/iPhone), throttled/mobile-network measurements and input/render scheduling tuning, followed by field LCP/INP/CLS collection. Hosting and CDN accessibility in Iran remain unmeasured.

Follow-up with adaptive DPR (same environment): desktop LCP 704 ms, CLS 0, sampled event duration 984 ms, RAF median/p95 266.6/299.9 ms; mobile LCP 260 ms, CLS 0.0032, sampled event duration 368 ms, RAF median/p95 16.7/100 ms. The desktop result regressed and mobile results varied; a single sample cannot establish an improvement. These results are retained rather than claiming the adaptive change meets acceptance. The final readiness fix does not alter geometry or payload; the sampling window now includes frames up to 500 ms so very slow software-rendered frames also trigger resolution reduction.
