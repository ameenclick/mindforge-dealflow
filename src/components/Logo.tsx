import { Brain } from "lucide-react";

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 gradient-primary rounded-lg blur-lg opacity-50 animate-glow" />
        <div className="relative gradient-primary p-2 rounded-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        MindForge
      </span>
    </div>
  );
};
