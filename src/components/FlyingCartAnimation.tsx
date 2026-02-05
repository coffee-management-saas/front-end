"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface FlyingItemProps {
    imageSrc: string;
    startX: number;
    startY: number;
    onComplete: () => void;
}

export function FlyingCartItem({ imageSrc, startX, startY, onComplete }: FlyingItemProps) {
    const [position, setPosition] = useState({ x: startX, y: startY });
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') {
            onComplete();
            return;
        }

        // Get cart icon position (top right of screen)
        const cartElement = document.querySelector('[data-cart-icon]');
        const cartRect = cartElement?.getBoundingClientRect();

        if (!cartRect) {
            onComplete();
            return;
        }

        const endX = cartRect.left + cartRect.width / 2;
        const endY = cartRect.top + cartRect.height / 2;

        // Animate to cart position
        const duration = 800; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Calculate current position
            const currentX = startX + (endX - startX) * eased;
            const currentY = startY + (endY - startY) * eased;

            setPosition({ x: currentX, y: currentY });

            // Fade out near the end
            if (progress > 0.7) {
                setOpacity(1 - (progress - 0.7) / 0.3);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                onComplete();
            }
        };

        requestAnimationFrame(animate);
    }, [startX, startY, onComplete]);

    return (
        <div
            className="fixed pointer-events-none z-[9999]"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, -50%)',
                opacity,
                transition: 'transform 0.1s ease-out',
            }}
        >
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-2xl ring-4 ring-amber-400 animate-pulse">
                <Image
                    src={imageSrc}
                    alt="Flying item"
                    fill
                    className="object-cover"
                />
            </div>
        </div>
    );
}

interface FlyingCartManagerProps {
    children: React.ReactNode;
}

export function FlyingCartManager({ children }: FlyingCartManagerProps) {
    const [flyingItems, setFlyingItems] = useState<Array<{
        id: string;
        imageSrc: string;
        startX: number;
        startY: number;
    }>>([]);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        const handleAddToCart = (event: CustomEvent) => {
            const { imageSrc, buttonElement } = event.detail;
            const rect = buttonElement.getBoundingClientRect();

            const newItem = {
                id: Date.now().toString(),
                imageSrc,
                startX: rect.left + rect.width / 2,
                startY: rect.top + rect.height / 2,
            };

            setFlyingItems(prev => [...prev, newItem]);
        };

        window.addEventListener('addToCart' as any, handleAddToCart);
        return () => window.removeEventListener('addToCart' as any, handleAddToCart);
    }, []);

    const handleComplete = (id: string) => {
        setFlyingItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <>
            {children}
            {flyingItems.map(item => (
                <FlyingCartItem
                    key={item.id}
                    imageSrc={item.imageSrc}
                    startX={item.startX}
                    startY={item.startY}
                    onComplete={() => handleComplete(item.id)}
                />
            ))}
        </>
    );
}

// Helper function to trigger the animation
export function triggerFlyToCart(imageSrc: string, buttonElement: HTMLElement) {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('addToCart', {
        detail: { imageSrc, buttonElement }
    });
    window.dispatchEvent(event);
}
