"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { Wand2, Zap, AlertCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { generatePrompts, streamGenerateImages, getSamplePrompts, APIError } from "@/lib/api-client";
import { GeneratedImage } from "@/lib/types";
import { useEffect } from "react";

export default function DesignPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Create new abort controller for this generation
    const controller = new AbortController();
    setAbortController(controller);
    
    setIsGenerating(true);
    setShowResults(true);
    setError(null);
    setGeneratedImages([]);
    setGenerationProgress(0);
    setCurrentImageIndex(0);
    
    try {
      // Step 1: Generate artistic prompts
      setGenerationProgress(10);
      const artisticPrompts = await generatePrompts(prompt.trim(), controller.signal);
      
      // Check if generation was aborted
      if (controller.signal.aborted) {
        throw new Error('Generation cancelled');
      }
      
      // Step 2: Generate images with streaming
      setGenerationProgress(20);
      
      const streamImages: GeneratedImage[] = [];
      let completedCount = 0;
      
      for await (const event of streamGenerateImages(artisticPrompts, controller.signal)) {
        // Check if generation was aborted
        if (controller.signal.aborted) {
          throw new Error('Generation cancelled');
        }
        
        switch (event.type) {
          case "image_start":
            console.log(`Starting image ${event.index! + 1}: ${event.prompt}`);
            break;
            
          case "image_partial":
            // Update the image with partial data
            if (event.index !== undefined && event.imageUrl) {
              console.log(`Received partial image for index ${event.index}`);
              const existingIndex = streamImages.findIndex(img => img.index === event.index);
              if (existingIndex >= 0) {
                streamImages[existingIndex] = {
                  ...streamImages[existingIndex],
                  imageUrl: event.imageUrl,
                };
              } else {
                streamImages.push({
                  imageUrl: event.imageUrl,
                  prompt: event.prompt!,
                  index: event.index,
                });
              }
              // Update UI with current images
              setGeneratedImages([...streamImages]);
              console.log(`Updated images array, now has ${streamImages.length} images`);
            }
            break;
            
          case "image_complete":
            // Update the image with final data
            if (event.index !== undefined && event.imageUrl) {
              console.log(`Received complete image for index ${event.index}`);
              const existingIndex = streamImages.findIndex(img => img.index === event.index);
              if (existingIndex >= 0) {
                streamImages[existingIndex] = {
                  ...streamImages[existingIndex],
                  imageUrl: event.imageUrl,
                };
              } else {
                streamImages.push({
                  imageUrl: event.imageUrl,
                  prompt: event.prompt!,
                  index: event.index,
                });
              }
              completedCount++;
              // Update progress
              const progress = 20 + (completedCount / artisticPrompts.length) * 70;
              setGenerationProgress(Math.min(90, progress));
              // Update UI with current images
              setGeneratedImages([...streamImages]);
              console.log(`Updated images array, now has ${streamImages.length} images`);
            }
            break;
            
          case "image_error":
            console.error(`Error generating image ${event.index! + 1}:`, event.error);
            completedCount++;
            const errorProgress = 20 + (completedCount / artisticPrompts.length) * 70;
            setGenerationProgress(Math.min(90, errorProgress));
            break;
            
          case "generation_complete":
            console.log("All images generated");
            break;
            
          case "generation_error":
            throw new Error(event.error || "Generation failed");
        }
      }
      
      setGenerationProgress(100);
    } catch (err) {
      console.error('Generation error:', err);
      if (controller.signal.aborted) {
        // Don't show error for user-initiated cancellation
        console.log('Generation was cancelled by user');
      } else if (err instanceof APIError) {
        setError(err.message);
      } else if (err instanceof Error && err.message === 'Generation cancelled') {
        setError('Generation was cancelled');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      // Don't set error message for user-initiated stops
      console.log('Generation stopped by user');
    }
  };

  // Load AI-generated sample prompts on component mount
  useEffect(() => {
    const loadSamplePrompts = async () => {
      try {
        const aiPrompts = await getSamplePrompts();
        setPromptSuggestions(aiPrompts);
      } catch (error) {
        console.error('Failed to load AI sample prompts:', error);
        // Set fallback prompts if AI fails
        setPromptSuggestions([
          "A majestic lion with geometric patterns",
          "Abstract watercolor sunset",
          "Minimalist mountain landscape",
          "Retro 80s neon cityscape",
          "Hand-drawn botanical illustration",
          "Space galaxy with stars",
          "Vintage coffee cup sketch",
          "Mandala with sacred geometry",
          "Cyberpunk city silhouette",
        ]);
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    loadSamplePrompts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {!showResults ? (
        // Initial centered layout
        <div className="container mx-auto px-6 py-16 max-w-4xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            {/* Centered Prompt Input */}
            <div className="w-full max-w-2xl">
              <Textarea
                id="prompt"
                placeholder="Describe your t-shirt design..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={1}
                className="min-h-[60px] max-h-[480px] text-lg resize-none border-2 focus:border-primary transition-all duration-200 overflow-y-auto"
                style={{
                  height: 'auto',
                  minHeight: '60px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  const scrollHeight = Math.min(target.scrollHeight, 480);
                  target.style.height = scrollHeight + 'px';
                }}
              />
            </div>
            
                      {/* Prompt Suggestions */}
          <div className="w-full max-w-3xl">
            <div className="flex flex-wrap gap-3 justify-center">
              {isLoadingPrompts ? (
                // Loading skeleton - using predefined widths to avoid hydration mismatch
                Array.from({ length: 9 }).map((_, index) => {
                  const widths = [100, 120, 90, 110, 130, 95, 115, 105, 125]; // Predefined widths
                  return (
                    <div
                      key={index}
                      className="h-8 bg-muted rounded-full animate-pulse px-4 py-2"
                      style={{
                        width: `${widths[index]}px`,
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                  );
                })
              ) : (
                // Actual prompts
                promptSuggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors px-4 py-2 animate-in fade-in-0 slide-in-from-bottom-2"
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                    onClick={() => setPrompt(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))
              )}
            </div>
          </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              size="lg"
              className="px-12 py-3 text-lg"
            >
              {isGenerating ? (
                <>
                  <Zap className="w-5 h-5 mr-2 animate-spin" />
                  Generating Design...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Design
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        // Results layout with images grid and bottom input
        <div className="min-h-screen flex flex-col">
          {/* Error message */}
          {error && (
            <div className="container mx-auto px-6 pt-4 max-w-7xl">
              <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4 flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          {isGenerating && (
            <div className="container mx-auto px-6 pt-4 max-w-7xl">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {generationProgress < 20 ? 'Creating artistic prompts...' : 
                     generationProgress < 90 ? `Generating images... (${Math.floor((generationProgress - 20) / 70 * 12) + 1}/12)` : 
                     'Finalizing...'}
                  </span>
                  <span className="text-sm text-muted-foreground">{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleStop}
                    className="px-6"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Stop Generation
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main content area with images grid */}
          <div className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in-0 duration-700">
              {Array.from({ length: 12 }).map((_, index) => {
                // Check if we have an image for this slot
                const image = generatedImages.find(img => img.index === index);
                
                if (image) {
                  // Show the generated image
                  return (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <div
                          className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 animate-in fade-in-0 slide-in-from-bottom-4 group relative"
                          style={{
                            animationDelay: `${index * 100}ms`
                          }}
                          title={image.prompt}
                        >
                          <img
                            src={image.imageUrl}
                            alt={`Generated design: ${image.prompt}`}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/api/placeholder/400/400';
                            }}
                          />
                          {/* Hover overlay with prompt */}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2">
                            <p className="text-white text-xs text-center line-clamp-3">
                              {image.prompt}
                            </p>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                        <div className="relative">
                          <img
                            src={image.imageUrl}
                            alt={`Generated design: ${image.prompt}`}
                            className="w-full h-auto max-h-[80vh] object-contain"
                          />
                          <div className="p-6">
                            <h3 className="text-lg font-semibold mb-2">T-Shirt Design</h3>
                            <p className="text-muted-foreground">{image.prompt}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                } else if (isGenerating) {
                  // Show loading placeholder
                  return (
                    <div
                      key={index}
                      className="aspect-square bg-muted rounded-lg flex items-center justify-center animate-pulse"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <Zap className="w-8 h-8 text-muted-foreground animate-spin" />
                    </div>
                  );
                } else {
                  // Show empty placeholder when not generating
                  return (
                    <div
                      key={index}
                      className="aspect-square bg-muted rounded-lg flex items-center justify-center"
                    >
                      <div className="text-muted-foreground text-xs">No image</div>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Fixed bottom input bar */}
          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky bottom-0">
            <div className="container mx-auto px-6 py-4 max-w-4xl">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Textarea
                    placeholder="Describe your t-shirt design..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={1}
                    className="min-h-[50px] max-h-[200px] resize-none border-2 focus:border-primary transition-all duration-200 overflow-y-auto"
                    style={{
                      height: 'auto',
                      minHeight: '50px'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      const scrollHeight = Math.min(target.scrollHeight, 200);
                      target.style.height = scrollHeight + 'px';
                    }}
                  />
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={!prompt.trim() || isGenerating}
                  size="lg"
                >
                  {isGenerating ? (
                    <Zap className="w-5 h-5 animate-spin" />
                  ) : (
                    <Wand2 className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
