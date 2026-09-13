"use client";

import React from "react";
import { motion } from "framer-motion";

interface HeroHeaderProps {
  data?: any;
  loading?: boolean;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ data, loading }) => {
  return (
    <section className="relative min-h-[460px] overflow-hidden rounded-[28px] border border-[#D7E2EC] bg-[#E1EFFC] shadow-[0_18px_60px_rgba(28,43,58,0.08)]">
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(190,205,219,0.10)_1px,transparent_1px),linear-gradient(0deg,rgba(190,205,219,0.10)_1px,transparent_1px)] bg-[length:36px_36px]" />
        <div className="absolute left-[-12%] top-[-10%] h-[300px] w-[300px] rounded-full bg-white/40 blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-12%] h-[260px] w-[260px] rounded-full bg-[#9DB8D6]/20 blur-3xl" />
      </div>

      <div className="absolute right-[-80px] top-[-60px] opacity-[0.075]">
        <img src="/India%20map.jfif" alt="" className="h-[420px] w-[420px] object-contain" />
      </div>

      <div className="relative z-10 flex min-h-[460px] flex-col">
        <div className="flex items-center justify-between px-8 pt-8">
          <div className="flex items-center gap-4">
            <img src="/Government%20logo.jfif" alt="Government of India Logo" className="h-16 w-16 object-contain rounded-full border border-white/80 bg-white/60 shadow-sm" />
            <img src="/bhoomi-sanket-logo.png" alt="Bhoomi Sanket Logo" className="h-16 w-auto object-contain" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 px-8 pb-8 pt-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#B6CBE1] bg-white/60 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#2F4B68]">
              <span className="h-2 w-2 rounded-full bg-[#365B78]" />
              NATIONAL INFRASTRUCTURE INTELLIGENCE
            </div>

            <motion.h1
              className="font-[Plus_Jakarta_Sans,Inter,Arial,sans-serif] text-[56px] font-black leading-[1.08] tracking-[-0.035em] text-[#243B56] sm:text-[60px] md:text-[64px]"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              Bhoomi Sanket-AI
            </motion.h1>

            <motion.div
              className="mt-3 text-[24px] font-semibold tracking-[0.03em] text-[#334B63]"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.14, ease: "easeOut" }}
            >
              AI-Powered Land Acquisition Risk Intelligence Platform
            </motion.div>

            <motion.p
              className="mt-5 max-w-[680px] text-[18px] font-medium leading-[1.7] text-[#486177]"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: "easeOut" }}
            >
              Predicting acquisition delays, identifying legal bottlenecks, and supporting data-driven infrastructure governance for infrastructure projects.
            </motion.p>
          </motion.div>

          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: "easeOut" }}
          >
            <div className="group relative h-[300px] w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/80 bg-white/60 shadow-[0_28px_80px_rgba(44,86,105,0.22)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(44,86,105,0.30)]">
              <div className="absolute inset-0 bg-black/20" />
              <img src="/Highway.jfif" alt="" className="h-full w-full object-cover brightness-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#153A4B]/70 via-transparent to-white/10" />
              <div className="absolute left-4 top-4 rounded-full border border-white/80 bg-white/24 px-3 py-2 backdrop-blur-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-[#E8F6E7] shadow-[0_0_0_3px_rgba(255,255,255,0.7)]" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/30 bg-white/12 px-4 py-3 backdrop-blur-md">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white">National GIS Network</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-100">Land acquisition intelligence</div>
                </div>
                <span className="rounded-full border border-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">LIVE</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
