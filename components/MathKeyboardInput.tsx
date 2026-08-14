"use client";

import dynamic from "next/dynamic";

// mathlive's real MathfieldElement class only exists in the browser (it's a
// custom HTMLElement), so the implementation is split into its own module
// and loaded with ssr:false - otherwise the framework's server-rendering
// pass tries to resolve mathlive under its Node/SSR build, which only
// exposes a reduced static-rendering API and doesn't export MathfieldElement.
export const MathKeyboardInput = dynamic(
  () => import("./MathKeyboardInputInner").then((m) => m.MathKeyboardInput),
  { ssr: false }
);
