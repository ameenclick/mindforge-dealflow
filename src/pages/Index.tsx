import { useState } from "react";
import { Logo } from "@/components/Logo";
import { UploadZone } from "@/components/UploadZone";
import { ProcessingView } from "@/components/ProcessingView";
import { ResultsView } from "@/components/ResultsView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ViewState = 'input' | 'processing' | 'results';

interface UploadedFile {
  id: string;
  file: File;
  type: 'profile' | 'financial';
}

const Index = () => {
  const [viewState, setViewState] = useState<ViewState>('input');
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!companyName.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter a company name to continue",
        variant: "destructive",
      });
      return;
    }

    if (!country.trim()) {
      toast({
        title: "Country required",
        description: "Please enter the company's country",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Documents required",
        description: "Please upload at least one document",
        variant: "destructive",
      });
      return;
    }

    setViewState('processing');
  };

  const handleProcessingComplete = () => {
    setViewState('results');
  };

  const handleStartNew = () => {
    setViewState('input');
    setCompanyName("");
    setCountry("");
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {viewState === 'input' && (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                AI-Powered Investment Analysis
              </div>
              <h1 className="text-5xl font-bold tracking-tight">
                Accelerate Your Due Diligence
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Transform investment analysis with AI. Upload documents, get instant insights, 
                auto-generated memos, and presentation-ready slides.
              </p>
            </div>

            {/* Input Form */}
            <div className="gradient-card rounded-2xl p-8 shadow-elevated space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Name
                  </Label>
                  <Input
                    id="company"
                    placeholder="Enter company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-background/50 border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    placeholder="Enter country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="bg-background/50 border-border focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Upload Documents</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Company profiles (PDF, PPT, DOC) and financial statements (XLS, CSV)
                </p>
                <UploadZone onFilesChange={setFiles} />
              </div>

              <Button
                onClick={handleAnalyze}
                size="lg"
                className="w-full gradient-primary hover:opacity-90 transition-opacity text-lg font-medium h-14 shadow-glow"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze with AI
              </Button>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                {
                  title: "Document Analysis",
                  description: "AI extracts key insights from company profiles and financials"
                },
                {
                  title: "Auto-Generated Memos",
                  description: "Professional investment memos drafted instantly"
                },
                {
                  title: "Presentation Slides",
                  description: "Polished slides ready for stakeholder meetings"
                }
              ].map((feature, index) => (
                <div key={index} className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewState === 'processing' && (
          <ProcessingView onComplete={handleProcessingComplete} />
        )}

        {viewState === 'results' && (
          <ResultsView companyName={companyName} onStartNew={handleStartNew} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-24 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 MindForge. Transforming investment analysis with AI.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
