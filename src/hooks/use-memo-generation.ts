// Custom hook for memo generation with OpenAI
import { useState, useCallback } from 'react';
import { generateInvestmentMemo, generatePresentationSlides, extractDocumentContent, type MemoData, type GeneratedMemo } from '@/services/openai';
import { useToast } from '@/hooks/use-toast';

interface UseMemoGenerationProps {
  companyName: string;
  country: string;
  files: File[];
}

interface MemoGenerationState {
  isLoading: boolean;
  memo: GeneratedMemo | null;
  slides: any | null;
  error: string | null;
  progress: {
    step: 'extracting' | 'generating' | 'slides' | 'complete';
    message: string;
  };
}

export function useMemoGeneration({ companyName, country, files }: UseMemoGenerationProps) {
  const [state, setState] = useState<MemoGenerationState>({
    isLoading: false,
    memo: null,
    slides: null,
    error: null,
    progress: {
      step: 'extracting',
      message: 'Preparing documents...'
    }
  });

  const { toast } = useToast();

  const generateMemo = useCallback(async () => {
    if (!companyName || !country || files.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide company name, country, and upload documents",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: { step: 'extracting', message: 'Extracting document content...' }
    }));

    try {
      // Step 1: Extract content from uploaded files
      const documents = await Promise.all(
        files.map(async (file) => {
          const content = await extractDocumentContent(file);
          return {
            name: file.name,
            type: file.name.includes('financial') || file.name.includes('xls') || file.name.includes('csv') 
              ? 'financial' as const 
              : 'profile' as const,
            content
          };
        })
      );

      setState(prev => ({
        ...prev,
        progress: { step: 'generating', message: 'Generating investment memo...' }
      }));

      // Step 2: Generate memo
      const memoData: MemoData = {
        companyName,
        country,
        documents
      };

      const memo = await generateInvestmentMemo(memoData);

      setState(prev => ({
        ...prev,
        memo,
        progress: { step: 'slides', message: 'Creating presentation slides...' }
      }));

      // Step 3: Generate slides
      const slides = await generatePresentationSlides(memo);

      setState(prev => ({
        ...prev,
        slides,
        isLoading: false,
        progress: { step: 'complete', message: 'Analysis complete!' }
      }));

      toast({
        title: "Analysis Complete",
        description: "Investment memo and slides have been generated successfully",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate memo';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: { step: 'extracting', message: 'Error occurred' }
      }));

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [companyName, country, files, toast]);

  const resetGeneration = useCallback(() => {
    setState({
      isLoading: false,
      memo: null,
      slides: null,
      error: null,
      progress: {
        step: 'extracting',
        message: 'Preparing documents...'
      }
    });
  }, []);

  return {
    ...state,
    generateMemo,
    resetGeneration,
    isReady: !!(companyName && country && files.length > 0)
  };
}
