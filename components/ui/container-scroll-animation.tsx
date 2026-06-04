"use client";

import React, { useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleDimensions = () => (isMobile ? [0.72, 0.92] : [1.05, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="relative flex h-[54rem] items-center justify-center p-2 md:h-[72rem] md:p-20"
      ref={containerRef}
    >
      <div className="relative w-full py-10 md:py-40" style={{ perspective: "1000px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}) => {
  return (
    <motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 0 1px rgba(154,116,40,.22), 0 18px 50px rgba(0,0,0,.55), 0 70px 120px rgba(0,0,0,.42), 0 0 90px rgba(47,138,85,.12)",
      }}
      className="mx-auto -mt-8 h-[28rem] w-full max-w-5xl rounded-lg border border-volt/55 bg-[#08150d] p-2 md:-mt-12 md:h-[40rem] md:p-3"
    >
      <div className="h-full w-full overflow-hidden rounded-md border border-line bg-[#07120c]">
        {children}
      </div>
    </motion.div>
  );
};
