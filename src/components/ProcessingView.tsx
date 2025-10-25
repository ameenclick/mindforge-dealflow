import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, FileText, Presentation } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'complete';
}

interface ProcessingViewProps {
  onComplete: () => void;
}

export const ProcessingView = ({ onComplete }: ProcessingViewProps) => {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'parse', label: 'Parsing documents', status: 'processing' },
    { id: 'extract', label: 'Extracting financial data', status: 'pending' },
    { id: 'analyze', label: 'AI analysis in progress', status: 'pending' },
    { id: 'memo', label: 'Drafting investment memo', status: 'pending' },
    { id: 'slides', label: 'Creating presentation slides', status: 'pending' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const updateSteps = () => {
      const currentProgress = progress;
      setSteps(prev => prev.map((step, index) => {
        const stepProgress = (index / prev.length) * 100;
        if (currentProgress >= stepProgress + 20) {
          return { ...step, status: 'complete' as const };
        } else if (currentProgress >= stepProgress) {
          return { ...step, status: 'processing' as const };
        }
        return step;
      }));
    };

    updateSteps();
  }, [progress]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="gradient-card rounded-2xl p-8 shadow-elevated">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4 animate-float">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Processing Your Analysis</h2>
          <p className="text-muted-foreground">
            Our AI is analyzing your documents and generating insights
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50 transition-all duration-300"
              >
                <div>
                  {step.status === 'complete' && (
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  )}
                  {step.status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {step.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-muted" />
                  )}
                </div>
                <span className={`text-sm ${
                  step.status === 'complete' 
                    ? 'text-foreground' 
                    : step.status === 'processing'
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/30 border border-border">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Generating</p>
                <p className="text-sm font-medium">Investment Memo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/30 border border-border">
              <Presentation className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Creating</p>
                <p className="text-sm font-medium">Presentation Slides</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
