import { useState } from "react";
import { Download, FileText, Presentation, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ResultsViewProps {
  companyName: string;
  onStartNew: () => void;
}

export const ResultsView = ({ companyName, onStartNew }: ResultsViewProps) => {
  const [activeTab, setActiveTab] = useState("memo");
  const { toast } = useToast();

  const handleDownload = (type: 'memo' | 'slides') => {
    toast({
      title: "Download started",
      description: `Your ${type === 'memo' ? 'investment memo' : 'presentation slides'} will download shortly`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-6 h-6 text-accent" />
            <h1 className="text-3xl font-bold">Analysis Complete</h1>
          </div>
          <p className="text-muted-foreground">
            Your investment analysis for <span className="font-medium text-foreground">{companyName}</span> is ready
          </p>
        </div>
        <Button onClick={onStartNew} variant="outline">
          Start New Analysis
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="memo" className="gap-2">
            <FileText className="w-4 h-4" />
            Investment Memo
          </TabsTrigger>
          <TabsTrigger value="slides" className="gap-2">
            <Presentation className="w-4 h-4" />
            Presentation Slides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memo" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button onClick={() => handleDownload('memo')} className="gap-2">
              <Download className="w-4 h-4" />
              Download as Word
            </Button>
          </div>
          <div className="bg-card rounded-xl p-8 shadow-card border border-border min-h-[600px]">
            <div className="prose prose-lg max-w-none">
              <h1 className="text-foreground mb-6 border-b border-border pb-4">Investment Memo: {companyName}</h1>
              
              <h2 className="text-foreground mt-8 mb-3">Executive Summary</h2>
              <p className="text-foreground/90 leading-relaxed">
                {companyName} represents a compelling investment opportunity in the technology sector. 
                Based on our comprehensive due diligence, the company demonstrates strong fundamentals 
                with robust revenue growth, healthy margins, and a defensible market position.
              </p>

              <h2 className="text-foreground mt-8 mb-3">Market Opportunity</h2>
              <p className="text-foreground/90 leading-relaxed">
                The addressable market for {companyName}'s products and services is experiencing 
                significant growth, driven by digital transformation trends and increasing demand 
                for innovative solutions.
              </p>

              <h2 className="text-foreground mt-8 mb-3">Financial Analysis</h2>
              <p className="text-foreground/90 leading-relaxed">
                Revenue growth has averaged 45% year-over-year over the past three years, with 
                gross margins consistently above 70%. The company has demonstrated strong unit 
                economics and a clear path to profitability.
              </p>

              <h2 className="text-foreground mt-8 mb-3">Management Team</h2>
              <p className="text-foreground/90 leading-relaxed">
                The leadership team brings deep domain expertise and a proven track record of 
                execution. Key executives have successfully scaled similar businesses in the past.
              </p>

              <h2 className="text-foreground mt-8 mb-3">Risks and Mitigation</h2>
              <p className="text-foreground/90 leading-relaxed">
                Primary risks include competitive pressure and market timing. However, the company's 
                technological moat and strong customer relationships provide significant downside protection.
              </p>

              <h2 className="text-foreground mt-8 mb-3">Investment Recommendation</h2>
              <p className="text-foreground/90 leading-relaxed">
                We recommend proceeding with investment, subject to final due diligence on legal 
                and regulatory matters. The risk-adjusted return profile is attractive at current valuations.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="slides" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button onClick={() => handleDownload('slides')} className="gap-2">
              <Download className="w-4 h-4" />
              Download as PowerPoint
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((slide) => (
              <div key={slide} className="gradient-card rounded-lg p-6 shadow-card aspect-video flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Slide {slide}</div>
                  <h3 className="text-lg font-semibold">
                    {slide === 1 && `${companyName} Investment Overview`}
                    {slide === 2 && 'Market Opportunity'}
                    {slide === 3 && 'Financial Highlights'}
                    {slide === 4 && 'Growth Trajectory'}
                    {slide === 5 && 'Risk Assessment'}
                    {slide === 6 && 'Investment Recommendation'}
                  </h3>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-primary/20 rounded w-full" />
                  <div className="h-2 bg-primary/20 rounded w-4/5" />
                  <div className="h-2 bg-primary/20 rounded w-3/5" />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
