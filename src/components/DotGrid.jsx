import { useEffect, useRef } from 'react';

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function DotGrid({
    dotSize = 4,
    gap = 28,
    baseColor = '#3a3a52',
    activeColor = '#7c5cff',
    proximity = 120,
    pushStrength = 0.15,
    shockRadius = 220,
    shockStrength = 12,
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const parent = canvas.parentElement;
        const base = hexToRgb(baseColor);
        const active = hexToRgb(activeColor);
        const mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };
        let dots = [];
        let w = 0;
        let h = 0;
        let raf;

        const build = () => {
            const dpr = window.devicePixelRatio || 1;
            w = parent.clientWidth;
            h = parent.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const cols = Math.floor(w / gap);
            const rows = Math.floor(h / gap);
            const startX = (w - (cols - 1) * gap) / 2;
            const startY = (h - (rows - 1) * gap) / 2;
            dots = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    dots.push({ x: startX + c * gap, y: startY + r * gap, ox: 0, oy: 0, vx: 0, vy: 0 });
                }
            }
        };

        const onMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (mouse.x > -9000) {
                mouse.vx = x - mouse.x;
                mouse.vy = y - mouse.y;
            }
            mouse.x = x;
            mouse.y = y;
        };

        const onClick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            for (const d of dots) {
                const dx = d.x - cx;
                const dy = d.y - cy;
                const dist = Math.hypot(dx, dy) || 1;
                if (dist < shockRadius) {
                    const f = 1 - dist / shockRadius;
                    d.vx += (dx / dist) * shockStrength * f;
                    d.vy += (dy / dist) * shockStrength * f;
                }
            }
        };

        const tick = () => {
            ctx.clearRect(0, 0, w, h);
            for (const d of dots) {
                const px = d.x + d.ox;
                const py = d.y + d.oy;
                const dist = Math.hypot(px - mouse.x, py - mouse.y);
                const t = dist < proximity ? 1 - dist / proximity : 0;

                if (t > 0) {
                    d.vx += mouse.vx * t * pushStrength;
                    d.vy += mouse.vy * t * pushStrength;
                }

                d.vx += -d.ox * 0.06;
                d.vy += -d.oy * 0.06;
                d.vx *= 0.9;
                d.vy *= 0.9;
                d.ox += d.vx;
                d.oy += d.vy;

                const r = Math.round(base[0] + (active[0] - base[0]) * t);
                const g = Math.round(base[1] + (active[1] - base[1]) * t);
                const b = Math.round(base[2] + (active[2] - base[2]) * t);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.beginPath();
                ctx.arc(d.x + d.ox, d.y + d.oy, dotSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            mouse.vx *= 0.8;
            mouse.vy *= 0.8;
            raf = requestAnimationFrame(tick);
        };

        build();
        tick();
        const ro = new ResizeObserver(build);
        ro.observe(parent);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('click', onClick);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('click', onClick);
        };
    }, [dotSize, gap, baseColor, activeColor, proximity, pushStrength, shockRadius, shockStrength]);

    return (
        <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }}
        />
    );
}