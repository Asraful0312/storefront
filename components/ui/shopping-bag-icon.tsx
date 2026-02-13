import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const ShoppingBagIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    (
        { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            // Animate handle lifting up
            animate(
                ".bag-handle",
                {
                    y: [0, -4, 0],
                },
                {
                    duration: 0.5,
                    ease: "easeInOut",
                },
            );

            // Animate body lifting up slightly after
            animate(
                ".bag-body",
                {
                    y: [0, -1, 0],
                },
                {
                    duration: 0.5,
                    ease: "easeInOut",
                    delay: 0.1,
                },
            );
        }, [animate]);

        const stop = useCallback(() => {
            animate(
                ".bag-handle, .bag-body",
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
                    {/* Handle */}
                    <motion.path
                        className="bag-handle"
                        d="M16 10a4 4 0 0 1-8 0"
                    />

                    {/* Body Top Line */}
                    <motion.path
                        className="bag-body"
                        d="M3.103 6.034h17.794"
                    />

                    {/* Main Body */}
                    <motion.path
                        className="bag-body"
                        d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"
                    />
                </svg>
            </motion.div>
        );
    },
);

ShoppingBagIcon.displayName = "ShoppingBagIcon";
export default ShoppingBagIcon;
