"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, BarChart3, RadioTower } from "lucide-react";
import { HeroStatus } from "@/components/dashboard/HeroStatus";
import { HeroStats } from "@/components/dashboard/HeroStats";
import { useT } from "@/lib/i18n/LanguageProvider";

interface HeroHeaderProps {
  data?: any;
  loading?: boolean;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ data, loading }) => {
  const { t } = useT();
  return (
    <section className="relative min-h-[380px] rounded-[20px] border border-[#D7E2EC] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(215,226,236,0.2)),linear-gradient(0deg,transparent,rgba(215,226,236,0.2))] dark:bg-[linear-gradient(90deg,transparent,rgba(30,41,59,0.4)),linear-gradient(0deg,transparent,rgba(30,41,59,0.4))] bg-[length:32px_32px,32px_32px]" />
      </div>

      <div className="absolute right-[-70px] top-[-70px] opacity-[0.07] dark:opacity-[0.04]">
        <img src="/india-map.svg" alt="" className="w-[420px] h-[420px] object-cover dark:invert" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6">
          <div className="flex items-center gap-3">
            <img src="/bhoomi-sanket-emblem.png" alt="Government Emblem" className="w-12 h-12 rounded-full border border-[#D7E2EC] dark:border-slate-700 bg-white dark:bg-slate-800" />
            <img src="/bhoomi-sanket-logo.png" alt="Bhoomi Sanket Logo" className="h-11 w-auto" />
          </div>

          <div className="text-right">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2F3A4A] dark:text-slate-200">{t("hero.viksitBharat")}</div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1">{t("hero.subtitle")}</div>
            <div className="mt-2 h-0.5 w-24 rounded-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] border border-[#D7E2EC] dark:border-slate-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-4 px-6 sm:px-8 pt-4 pb-7">
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-3"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D7E2EC] dark:border-slate-700 bg-[#F8FDFB] dark:bg-slate-800/90 text-[10px] font-black uppercase tracking-[0.14em] text-[#2F3A4A] dark:text-emerald-400">
                <RadioTower className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("hero.intelligence")}</span>
              </div>

              <div>
                <h1 className="text-4xl sm:text-5xl font-black leading-none font-[Plus_Jakarta_Sans,Inter,Arial,sans-serif] text-[#2F3A4A] dark:text-slate-100 tracking-[-0.035em]">
                  Bhoomi Sanket-AI
                </h1>
                <div className="mt-3 h-1 w-28 bg-[#B7CCF3] dark:bg-blue-600 rounded-full" />
              </div>

              <div className="text-[16px] font-semibold text-slate-700 dark:text-slate-200 tracking-[0.035em]">
                {t("hero.description")}
              </div>

              <p className="max-w-2xl text-[12px] sm:text-[13px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                {t("hero.descriptionLong")}
              </p>

              <HeroStatus />
              <HeroStats data={data} />
            </motion.div>
          </div>

          <div className="flex items-center justify-end">
            <div className="relative w-full max-w-[380px] min-h-[250px] rounded-[24px] border border-[#D7E2EC] dark:border-slate-800 bg-[#eef6f5] dark:bg-slate-950 p-2 shadow-md">
              <div className="absolute -left-4 top-8 h-11 w-11 rounded-full border border-[#D7E2EC] dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#2F3A4A] dark:text-slate-200" />
              </div>

              <div className="absolute right-3 top-3 px-2 py-1 rounded-full border border-[#D7E2EC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[9px] font-black uppercase tracking-[0.12em] text-[#2F3A4A] dark:text-slate-200">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />{t("hero.gisLive")}
              </div>

              <div className="absolute left-3 bottom-3 px-2 py-1 rounded-full border border-[#D7E2EC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[9px] font-black uppercase tracking-[0.12em] text-[#2F3A4A] dark:text-slate-200">
                <BarChart3 className="w-3.5 h-3.5 inline-block mr-1" />
                {t("hero.systemSync")}
              </div>

              <img src="/highway.svg" alt="" className="w-full h-[250px] rounded-[18px] object-cover border border-[#D7E2EC] dark:border-slate-800" />

              <div className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-[#D7E2EC] dark:border-slate-700 px-3 py-1.5 shadow-sm">
                <Navigation className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#2F3A4A] dark:text-slate-200">{t("hero.nhaiGis")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
