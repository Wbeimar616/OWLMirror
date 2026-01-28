"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getOptimizedParameters } from "@/app/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, Bot, Signal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { OptimizeSharingParametersOutput } from "@/ai/flows/optimize-sharing-parameters";

const optimizationSchema = z.object({
  compression: z.number().min(0).max(100),
  framerate: z.number().min(1).max(60),
});

type OptimizationFormValues = z.infer<typeof optimizationSchema>;

export function OptimizationControls() {
  const { toast } = useToast();
  const [bandwidth, setBandwidth] = useState(50);
  const [deviceCharacteristics, setDeviceCharacteristics] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<OptimizeSharingParametersOutput | null>(null);

  const form = useForm<OptimizationFormValues>({
    resolver: zodResolver(optimizationSchema),
    defaultValues: {
      compression: 70,
      framerate: 30,
    },
  });
  const { handleSubmit, watch, setValue, formState: { isSubmitting } } = form;

  const compressionValue = watch("compression");
  const framerateValue = watch("framerate");

  useEffect(() => {
    const interval = setInterval(() => {
      setBandwidth(Math.floor(Math.random() * (100 - 5 + 1)) + 5);
    }, 5000);

    const characteristics = {
      userAgent: navigator.userAgent,
      cpuCores: navigator.hardwareConcurrency,
      memory: (navigator as any).deviceMemory || 'N/A',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
    setDeviceCharacteristics(JSON.stringify(characteristics, null, 2));

    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: OptimizationFormValues) => {
    setAiSuggestion(null);
    const input = {
      bandwidth,
      deviceCharacteristics,
      currentCompression: data.compression,
      currentFramerate: data.framerate,
    };

    const { data: result, error } = await getOptimizedParameters(input);

    if (error) {
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: error,
      });
    } else if (result) {
      setAiSuggestion(result);
      setValue("compression", result.optimizedCompression, { shouldValidate: true });
      setValue("framerate", result.optimizedFramerate, { shouldValidate: true });
      toast({
        title: "Optimization Complete!",
        description: "New sharing parameters have been suggested.",
      });
    }
  };
  
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-bold">AI Optimization</CardTitle>
            <CardDescription>
              Let AI fine-tune your streaming quality in real-time.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                  <Signal />
                  <span>Network Bandwidth</span>
              </div>
              <span className="font-semibold text-lg">{bandwidth} Mbps</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="compression">Compression</Label>
              <span className="text-sm font-medium text-foreground">{compressionValue}%</span>
            </div>
            <Slider
              id="compression"
              min={0}
              max={100}
              step={1}
              value={[compressionValue]}
              onValueChange={(value) => setValue("compression", value[0])}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="framerate">Framerate</Label>
              <span className="text-sm font-medium text-foreground">{framerateValue} FPS</span>
            </div>
            <Slider
              id="framerate"
              min={1}
              max={60}
              step={1}
              value={[framerateValue]}
              onValueChange={(value) => setValue("framerate", value[0])}
              disabled={isSubmitting}
            />
          </div>
          
          {aiSuggestion && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
              <Bot className="h-4 w-4 stroke-current" />
              <AlertTitle className="text-blue-900 dark:text-blue-200 font-semibold">AI Suggestion</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">{aiSuggestion.reason}</AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full text-base font-semibold" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Optimizing...
              </>
            ) : (
                <>
                <Bot className="mr-2 h-5 w-5" />
                Optimize with AI
                </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
