import { useState } from "react";

interface FlipCardProps {
  title: string;
  image: string;
  description: string;
  tag: string;
}

const FlipCard = ({ title, image, description, tag }: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-full cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className="relative w-full h-[420px]"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-campus-navy-deep/90 via-campus-navy-deep/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground mb-3">
              {tag}
            </span>
            <h3 className="font-display text-2xl font-bold text-primary-foreground">
              {title}
            </h3>
            <p className="text-primary-foreground/50 text-xs mt-2">Click to know more →</p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden bg-primary p-8 flex flex-col justify-center shadow-card"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground mb-4 self-start">
            {tag}
          </span>
          <h3 className="font-display text-2xl font-bold text-primary-foreground mb-4">
            {title}
          </h3>
          <p className="text-primary-foreground/80 leading-relaxed text-sm">
            {description}
          </p>
          <p className="text-primary-foreground/50 text-xs mt-6">← Click to flip back</p>
        </div>
      </div>
    </div>
  );
};

export default FlipCard;
