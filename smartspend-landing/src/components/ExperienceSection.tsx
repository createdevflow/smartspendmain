"use client";

import { motion } from "framer-motion";
import { ArrowDown, PieChart, Wallet, MessageCircle, Shield } from "lucide-react";

const steps = [
  {
    title: "Capture Every Transaction",
    description: "Connect your accounts or use smart entry to instantly log income and expenses. It's fast, secure, and effortless.",
    icon: <Wallet className="text-blue-500" size={32} />,
    color: "bg-blue-50 border-blue-100"
  },
  {
    title: "Understand Your Spending",
    description: "Visual analytics break down exactly where your money goes. Spot trends and cut unnecessary costs instantly.",
    icon: <PieChart className="text-purple-500" size={32} />,
    color: "bg-purple-50 border-purple-100"
  },
  {
    title: "Stay Connected",
    description: "Share cashbooks with family or business partners. Discuss transactions directly in the built-in secure chat.",
    icon: <MessageCircle className="text-green-500" size={32} />,
    color: "bg-green-50 border-green-100"
  },
  {
    title: "Make Smarter Decisions",
    description: "Let Cashtro AI analyze your habits and suggest actionable ways to grow your wealth safely.",
    icon: <Shield className="text-orange-500" size={32} />,
    color: "bg-orange-50 border-orange-100"
  }
];

export default function ExperienceSection() {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-brand-text-main mb-4">
            The Cashtro Experience
          </h2>
          <p className="text-lg text-brand-text-muted">
            A natural flow from logging a coffee to building generational wealth.
          </p>
        </div>

        <div className="flex flex-col gap-8 relative">
          {/* Vertical connecting line */}
          <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-orange-200 hidden md:block" />

          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="flex flex-col md:flex-row gap-6 md:gap-12 items-start relative z-10"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${step.color} mx-auto md:mx-0`}>
                {step.icon}
              </div>
              
              <div className="bg-brand-bg rounded-3xl p-8 border border-gray-100 shadow-sm flex-1">
                <h3 className="text-2xl font-bold text-brand-text-main mb-3">{step.title}</h3>
                <p className="text-brand-text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
