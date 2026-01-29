import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
  suffix?: string;
}

export default function AnimatedCounter({ 
  value, 
  duration = 1000, 
  decimals = 0,
  className = '',
  suffix = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const startValue = prevValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function (ease out cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={className}>
      {displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}
