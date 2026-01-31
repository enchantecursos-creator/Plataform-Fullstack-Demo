import React from 'react';

export default function FloatingInfoBadge() {
  return (
    <div className="fixed bottom-10 right-10 sm:right-6 sm:bottom-6 pointer-events-none z-30 max-w-[420px]">
      <div className="pointer-events-auto text-white text-left">
        <div className="mb-2">
          <h2 className="uppercase font-extrabold text-2xl md:text-3xl tracking-tight">GABRIEL ALVES</h2>
          <p className="text-sm md:text-base opacity-90">Junior Full-Stack Developer (Next.js / Node.js)</p>
        </div>

        <ul className="flex flex-col gap-2 text-sm md:text-sm opacity-90">
          <li className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90" aria-hidden="true">
              <path d="M22 6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6z" />
              <path d="M22 6l-10 7L2 6" />
            </svg>
            <a href="mailto:enchantecursos@gmail.com" target="_blank" rel="noopener noreferrer" aria-label="Enviar email" className="truncate hover:underline inline-block">enchantecursos@gmail.com</a>
          </li>

          <li className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90" aria-hidden="true">
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.92.57.11.78-.25.78-.55 0-.27-.01-1.13-.01-2.05-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.52-2.56-.29-5.25-1.29-5.25-5.72 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.48.11-3.09 0 0 .97-.31 3.17 1.18.92-.26 1.91-.39 2.89-.39s1.97.13 2.89.39c2.2-1.49 3.17-1.18 3.17-1.18.62 1.61.23 2.8.11 3.09.73.81 1.18 1.84 1.18 3.1 0 4.44-2.69 5.42-5.26 5.71.41.36.78 1.07.78 2.15 0 1.56-.01 2.81-.01 3.19 0 .31.21.67.79.55C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z" />
            </svg>
            <a href="https://github.com/enchantecursos-creator" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="truncate hover:underline inline-block">github.com/enchantecursos-creator</a>
          </li>

          <li className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="4" />
              <path d="M16 8a3 3 0 0 1 3 3v6h-3v-6a1 1 0 0 0-1-1h-1v7h-3v-7H9v7H6v-7a4 4 0 0 1 4-4h6z" />
            </svg>
            <a href="https://linkedin.com/in/gabriel2alve" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="truncate hover:underline inline-block">linkedin.com/in/gabriel2alve</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
