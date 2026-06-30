"use client";

import { motion } from "framer-motion";
import { BookOpen, LineChart, MessageSquare, TrendingUp, Cpu, Calendar } from "lucide-react";

const modules = [
  {
    name: "Cashbooks",
    icon: <BookOpen size={24} className="text-blue-600" />,
    desc: "Organize transactions into separate books for personal, family, or business.",
    color: "bg-blue-50"
  },
  {
    name: "Billing & Subscriptions",
    icon: <Calendar size={24} className="text-teal-600" />,
    desc: "Track your recurring bills and subscriptions with automated reminders so you never miss a payment.",
    color: "bg-teal-50"
  },
  {
    name: "Analytics",
    icon: <LineChart size={24} className="text-purple-600" />,
    desc: "Deep dive into your cashflow, budgets, and spending habits automatically.",
    color: "bg-purple-50"
  },
  {
    name: "Wealth & Markets",
    icon: <TrendingUp size={24} className="text-green-600" />,
    desc: "Track gold rates, stock watchlists, and your overall net worth.",
    color: "bg-green-50"
  },
  {
    name: "Cashtro Chat",
    icon: <MessageSquare size={24} className="text-pink-600" />,
    desc: "Securely discuss shared expenses and split bills inside the app.",
    color: "bg-pink-50"
  },
  {
    name: "Cashtro AI",
    icon: <Cpu size={24} className="text-orange-600" />,
    desc: "Your personal financial assistant providing smart insights and saving tips.",
    color: "bg-orange-50"
  }
];

export default function EcosystemSection() {
  return (
    <section id="ecosystem" className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-brand-text-main mb-4">
            Everything in One Connected Workspace
          </h2>
          <p className="text-lg text-brand-text-muted max-w-2xl mx-auto">
            Say goodbye to jumping between five different apps. Cashtro brings your entire financial life into a single, cohesive ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${mod.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {mod.icon}
              </div>
              <h3 className="text-xl font-bold text-brand-text-main mb-3">{mod.name}</h3>
              <p className="text-brand-text-muted">
                {mod.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
