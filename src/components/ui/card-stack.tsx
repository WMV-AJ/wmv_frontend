"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

let interval: any;

export type Card = {
  id: number;
  name: string;
  designation: string;
  content: React.ReactNode;
};

export const CardStack = ({
  items,
  offset,
  scaleFactor,
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
}) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const [cards, setCards] = useState<Card[]>(items);

  useEffect(() => {
    startFlipping();
    return () => clearInterval(interval);
  }, []);

  const startFlipping = () => {
    interval = setInterval(() => {
      setCards((prevCards: Card[]) => {
        const newArray = [...prevCards];
        newArray.unshift(newArray.pop()!);
        return newArray;
      });
    }, 5000);
  };

  return (
    <div className="relative h-[500px] w-full max-w-md md:h-[600px] md:max-w-lg">
      {cards.map((card, index) => {
        // Colorful gradient backgrounds cycling through cards
        const gradients = [
          'from-green-400 to-green-600',
          'from-yellow-400 to-orange-500',
          'from-orange-400 to-red-500',
          'from-amber-400 to-pink-500',
          'from-blue-400 to-cyan-500',
        ];

        return (
          <motion.div
            key={card.id}
            className={`absolute h-[500px] w-full md:h-[600px] rounded-3xl p-6 shadow-xl
              border border-white/20
              shadow-black/[0.1] dark:shadow-white/[0.05]
              flex flex-col justify-between
              bg-gradient-to-br ${gradients[index % gradients.length]}
              text-white`}
            style={{
              transformOrigin: "top center",
            }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR,
              zIndex: cards.length - index,
            }}
          >
            <div className="font-normal text-white overflow-y-auto flex-1">
              {card.content}
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-white font-bold text-lg">
                {card.name}
              </p>
              <p className="text-white/90 font-normal text-sm">
                {card.designation}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
