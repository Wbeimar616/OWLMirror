import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Play, StopCircle, ScreenShare, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

type ShareControlsProps = {
  isSharing: boolean;
  onStartSharing: () => void;
  onStopSharing: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
};

export function ShareControls({
  isSharing,
  onStartSharing,
  onStopSharing,
  videoRef,
}: ShareControlsProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ScreenShare className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-bold">Screen Sharing</CardTitle>
            <CardDescription>
              Share your screen or a specific application with other devices.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={cn(
            "aspect-video bg-muted/50 rounded-lg overflow-hidden transition-all duration-300",
            isSharing ? "border" : "border-dashed"
          )}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            className={cn("w-full h-full object-contain", { hidden: !isSharing })}
          />
          {!isSharing && (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
              <Tv className="w-16 h-16" />
              <p className="mt-2 text-sm">Your screen share preview will appear here.</p>
            </div>
          )}
        </div>
        <RadioGroup defaultValue="entire-screen" className="grid grid-cols-2 gap-4">
          <div>
            <RadioGroupItem value="entire-screen" id="entire-screen" className="peer sr-only" />
            <Label
              htmlFor="entire-screen"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <ScreenShare className="mb-3 h-6 w-6" />
              Entire Screen
            </Label>
          </div>
          <div>
            <RadioGroupItem value="application" id="application" className="peer sr-only" />
            <Label
              htmlFor="application"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3 h-6 w-6"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h4"/><path d="M6 12h4"/></svg>
              Application Window
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter>
        {!isSharing ? (
          <Button
            size="lg"
            className="w-full text-base font-semibold"
            onClick={onStartSharing}
          >
            <Play className="mr-2 h-5 w-5" />
            Start Sharing
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="lg"
            className="w-full text-base font-semibold"
            onClick={onStopSharing}
          >
            <StopCircle className="mr-2 h-5 w-5" />
            Stop Sharing
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
