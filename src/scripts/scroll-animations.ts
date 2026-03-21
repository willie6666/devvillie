import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations() {
  // Fade in elements with .scroll-fade class
  const fadeElements = document.querySelectorAll('.scroll-fade');

  fadeElements.forEach((el, i) => {
    gsap.fromTo(
      el,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        delay: (i % 3) * 0.1,
      }
    );
  });

  // Parallax effect on sections
  const sections = document.querySelectorAll('section:not(#hero)');
  sections.forEach((section) => {
    gsap.fromTo(
      section,
      { backgroundPositionY: '-20%' },
      {
        backgroundPositionY: '20%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}
