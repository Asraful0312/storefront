import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const PackageIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    (
        { size = 24, className = "", strokeWidth = 2, color = "currentColor" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = async () => {
            // Bounce/Lift animation
            animate(
                ".package-content",
                {
                    y: [0, -5, 0],
                    scale: [1, 1.1, 1],
                },
                { duration: 0.5, ease: "easeInOut" }
            );
        };

        const stop = async () => {
            animate(
                ".package-content",
                { y: 0, scale: 1 },
                { duration: 0.2, ease: "easeOut" }
            );
        };

        useImperativeHandle(ref, () => {
            return {
                startAnimation: start,
                stopAnimation: stop,
            };
        });

        return (
            <motion.svg
                ref={scope}
                onHoverStart={start}
                onHoverEnd={stop}
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                color={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`cursor-pointer ${className}`}
            >
                <motion.g className="package-content" style={{ originX: "50%", originY: "50%" }}>
                    <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
                    <path d="M12 22V12" />
                    <polyline points="3.29 7 12 12 20.71 7" />
                    <path d="m7.5 4.27 9 5.15" />
                </motion.g>
            </motion.svg>
        );
    },
);

PackageIcon.displayName = "PackageIcon";

export default PackageIcon;
