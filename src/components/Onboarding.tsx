import { ChevronRight, Headphones, Move3D, Smartphone } from 'lucide-react';

interface OnboardingProps {
  onBegin: () => void;
  onAccessible: () => void;
}

export function Onboarding({ onBegin, onAccessible }: OnboardingProps) {
  return (
    <main className="onboarding">
      <div className="onboarding-orbit" aria-hidden="true">
        <span className="onboarding-earth" />
        <span className="onboarding-moon" />
        <span className="onboarding-flight" />
      </div>
      <section className="onboarding-copy">
        <p className="kicker">AN INTERACTIVE APOLLO 11 RECONSTRUCTION</p>
        <h1>From Earth<br />to Tranquility</h1>
        <p className="onboarding-intro">
          Follow the complete mission from Pad 39A to the lunar surface and safely home—through a mobile-first 3D journey built around scale, engineering, and documented events.
        </p>
        <div className="onboarding-features" aria-label="Experience features">
          <div><Move3D size={18} /><span>Touch-driven 3D scenes</span></div>
          <div><Smartphone size={18} /><span>Portrait and landscape</span></div>
          <div><Headphones size={18} /><span>Procedural mission soundscape</span></div>
        </div>
        <button className="primary-action begin-button" onClick={onBegin}>
          Begin mission <ChevronRight size={18} />
        </button>
        <button className="text-action" onClick={onAccessible}>Open accessible story instead</button>
        <p className="onboarding-note">Best experienced with sound. Headphones optional.</p>
      </section>
    </main>
  );
}
