// Declarações de tipos para importação estática de assets (imagens) via next/image.
// O `next-env.d.ts` é gerado pelo Next e está no .gitignore — em ambientes de CI que
// rodam `tsc --noEmit` sem um `next dev`/`next build` prévio, ele não existe.
// Este arquivo versionado garante que imports como `import img from '.../foto.jpeg'`
// sejam tipados em qualquer ambiente.
/// <reference types="next" />
/// <reference types="next/image-types/global" />
