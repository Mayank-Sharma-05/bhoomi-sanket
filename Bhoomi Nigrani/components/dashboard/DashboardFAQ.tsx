"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n/LanguageProvider";

interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
}

const FAQ_DATA: FAQItem[] = [
  { id: "faq-1", questionKey: "faq.q1", answerKey: "faq.a1" },
  { id: "faq-2", questionKey: "faq.q2", answerKey: "faq.a2" },
  { id: "faq-3", questionKey: "faq.q3", answerKey: "faq.a3" },
  { id: "faq-4", questionKey: "faq.q4", answerKey: "faq.a4" },
  { id: "faq-5", questionKey: "faq.q5", answerKey: "faq.a5" },
  { id: "faq-6", questionKey: "faq.q6", answerKey: "faq.a6" },
  { id: "faq-7", questionKey: "faq.q7", answerKey: "faq.a7" },
];

export const DashboardFAQ: React.FC = () => {
  const { t } = useT();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs transition-colors">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 shrink-0">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t("faq.title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t("faq.desc")}
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
        {FAQ_DATA.map((item, index) => {
          const isOpen = openIds.has(item.id);

          return (
            <div key={item.id} className={index === 0 ? "pb-3" : "py-3"}>
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
                className="w-full flex items-center justify-between gap-4 text-left py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 rounded"
              >
                <span className="leading-snug">{t(item.questionKey)}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-answer-${item.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="pt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {t(item.answerKey)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
