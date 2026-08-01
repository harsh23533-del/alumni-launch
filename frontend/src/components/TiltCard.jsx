import { useRef } from 'react';

export default function TiltCard({
  as: Component = 'div',
  children,
  className = '',
  style = {},
  maxTilt = 8,
  ...rest
}) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -maxTilt;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;
    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale3d(1.015, 1.015, 1.015)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1,1,1)';
  };

  return (
    <Component
      ref={ref}
      className={className}
      style={{ transition: 'transform 0.15s ease-out', willChange: 'transform', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </Component>
  );
}