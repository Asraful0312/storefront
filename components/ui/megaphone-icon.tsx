import { forwardRef, useImperativeHandle } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const MegaphoneIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    (
        { size = 24, className = "", strokeWidth = 2, color = "currentColor" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = async () => {
            // Shout animation: Shake/Rotate
            animate(
                ".megaphone-content",
                {
                    rotate: [0, -15, 15, -15, 15, 0],
                    scale: [1, 1.1, 1.1, 1.1, 1.1, 1],
                },
                { duration: 0.6, ease: "easeInOut" }
            );
        };

        const stop = async () => {
            animate(
                ".megaphone-content",
                { rotate: 0, scale: 1 },
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
                <motion.g className="megaphone-content" style={{ originX: "50%", originY: "50%" }}>
                    <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
                    <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
                    <path d="M8 6v8" />
                </motion.g>
            </motion.svg>
        );
    },
);

MegaphoneIcon.displayName = "MegaphoneIcon";

export default MegaphoneIcon;
