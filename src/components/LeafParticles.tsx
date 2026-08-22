import { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  left: number;
  duration: number;
  drift: number;
  emoji: string;
}

const EMOJIS = ['🍃', '🍂'];

export function LeafParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const spawn = () => {
      const id = counter.current++;
      const particle: Particle = {
        id,
        left: 20 + Math.random() * 60,
        duration: 2.2 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 40,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      };
      setParticles((prev) => [...prev, particle]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, particle.duration * 1000);
    };
    const interval = setInterval(spawn, 2600 + Math.random() * 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="leaf-particles">
      {particles.map((p) => (
        <span
          key={p.id}
          className="leaf-particle"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            // @ts-expect-error custom property for drift
            '--drift': `${p.drift}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
