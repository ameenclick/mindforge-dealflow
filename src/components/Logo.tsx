export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-lg blur-lg opacity-50 animate-glow" />
        <div className="relative p-2 rounded-lg">
          <img 
            src="/logo.svg" 
            alt="MindForge AI Brain Logo" 
            className="w-8 h-8"
          />
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        MindForge
      </span>
    </div>
  );
};
