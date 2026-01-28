import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StopCircle, ScreenShare, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

type ShareControlsProps = {
  isSharing: boolean;
  onStopSharing: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
};

export function ShareControls({
  isSharing,
  onStopSharing,
  videoRef,
}: ShareControlsProps) {

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ScreenShare className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-bold">Previsualización</CardTitle>
            <CardDescription>
              {isSharing ? "Estás compartiendo tu pantalla." : "Selecciona un dispositivo para empezar a compartir."}
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
              <p className="mt-2 text-sm">La previsualización de tu pantalla aparecerá aquí.</p>
            </div>
          )}
        </div>
      </CardContent>
      {isSharing && (
        <CardFooter>
          <Button
            variant="destructive"
            size="lg"
            className="w-full text-base font-semibold"
            onClick={onStopSharing}
          >
            <StopCircle className="mr-2 h-5 w-5" />
            Dejar de Compartir
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
