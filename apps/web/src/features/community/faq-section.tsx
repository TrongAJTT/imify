"use client"

import React, { useState } from "react"
import { Heading, BodyText } from "@imify/ui/ui/typography"
import { ChevronDown } from "lucide-react"
import { cn } from "@imify/ui/ui/utils"
import * as Collapsible from "@radix-ui/react-collapsible"

const FAQ_ITEMS = [
  {
    question: "Are my photos safe while processing on your website?",
    answer: "Absolutely. Imify is serverless. There is no remote server storing your data; the entire processing pipeline happens locally on your machine. Your privacy isn't just a feature—it's the architecture."
  },
  {
    question: "The website feels slow or lags during conversion. Is this a bug?",
    answer: "Imify uses your own hardware to process images. Heavy formats like AVIF or JXL can be resource-intensive. If you experience lag, it means the processing demands are reaching the limits of your device's web environment. For extreme professional needs, a dedicated native application might be a better fit."
  },
  {
    question: "What image formats are supported?",
    answer: "We support a wide range of modern and traditional formats including JPEG, PNG, WebP, AVIF, and JPEG XL. Capabilities are constantly expanding based on browser support."
  },
  {
    question: "Can I use Imify on mobile or tablet?",
    answer: "In theory, yes. The website is responsive for both small and large screens. However, we don't recommend it. Imify is designed and optimized for large screens to provide the best working experience. Using it on a small phone screen will make it difficult to operate and you won't be able to enjoy all the features to their full extent."
  },
  {
    question: "Do I need to install anything before using Imify Web?",
    answer: "No installation is required. You can start using Imify Web directly in your browser right away. For extension-exclusive workflows, you can optionally install the browser extension."
  },
  {
    question: "Is Imify completely free to use?",
    answer: "Yes, all the core tools provided in Imify Web are free to use. There are no hidden fees or premium locks on the web workspace features."
  },
  {
    question: "How can Imify stay free?",
    answer: "Since the processing happens on your device, I don't incur server-side processing costs. However, building the tool and maintaining the domain still costs money. I've included a *Donate* button for those who find the tool valuable and wish to help me cover these maintenance costs. Your support is purely optional but deeply appreciated!"
  },
  {
    question: "How can I support Imify?",
    answer: "If Imify has saved your workflow and you're wondering how to fuel this one-man revolution, look no further than the glorious 'Donate' button on the app bar! Whether it's through *PayPal*, *Buy Me A Coffee*, or the legendary *GitHub Sponsors*, your contribution is the lifeblood that keeps this high-performance engine roaring. Support the craft, fuel the innovation, and help me keep this toolkit free for everyone, everywhere. Your generosity is truly legendary!"
  }
]

function FaqItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Collapsible.Root open={isOpen} onOpenChange={onToggle} className="w-full">
      <div className={cn(
        "border-b border-slate-200 dark:border-slate-800 transition-all duration-200",
        isOpen ? "bg-slate-50/50 dark:bg-slate-900/20" : "bg-white dark:bg-slate-950"
      )}>
        <Collapsible.Trigger asChild>
          <button className="flex w-full items-center justify-between px-6 py-5 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 group">
            <span className={cn(
              "text-lg font-semibold transition-colors",
              isOpen ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-slate-100 group-hover:text-blue-500"
            )}>
              {question}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-slate-400 transition-transform duration-300",
                isOpen && "rotate-180 text-blue-500"
              )}
            />
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <div className="px-6 pb-6 pt-0">
            <BodyText className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
              {answer}
            </BodyText>
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  )
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="mx-auto max-w-4xl px-4 space-y-12 pb-24">
      <div className="text-center space-y-4">
        <Heading className="text-4xl md:text-5xl">Frequently Asked Questions</Heading>
        <BodyText className="text-slate-500 text-lg md:text-xl">
          Everything you need to know about Imify.
        </BodyText>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-950">
        {FAQ_ITEMS.map((item, index) => (
          <FaqItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  )
}
