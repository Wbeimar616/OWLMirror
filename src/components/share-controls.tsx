import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
              Share your screen with other devices on your network.
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
            playsInline
            className={cn("w-full h-full object-contain", { hidden: !isSharing })}
          />
          {!isSharing && (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
              <Tv className="w-16 h-16" />
              <p className="mt-2 text-sm">Your screen share preview will appear here.</p>
            </div>
          )}
        </div>
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
