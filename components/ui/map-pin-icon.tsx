import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const MapPinIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    (
        { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            // Animate pin lifting up
            animate(
                ".map-pin",
                {
                    y: [0, -5, 0],
                },
                {
                    duration: 0.5,
                    ease: "easeInOut",
                },
            );
        }, [animate]);

        const stop = useCallback(() => {
            animate(
                ".map-pin",
                { y: 0 },
                { duration: 0.2, ease: "easeInOut" },
            );
        }, [animate]);

        useImperativeHandle(ref, () => ({
            startAnimation: start,
            stopAnimation: stop,
        }));

        return (
            <motion.div
                ref={scope}
                onHoverStart={start}
                onHoverEnd={stop}
                className={`inline-flex cursor-pointer ${className}`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <motion.path
                        className="map-pin"
                        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
                    />
                    <motion.circle
                        className="map-pin"
                        cx="12"
                        cy="10"
                        r="3"
                    />
                </svg>
            </motion.div>
        );
    },
);

MapPinIcon.displayName = "MapPinIcon";
export default MapPinIcon;
