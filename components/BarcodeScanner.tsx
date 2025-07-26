"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Zap, ZapOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize camera when scanner opens
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

      setStream(mediaStream)

      // Check if device has flash
      const track = mediaStream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()
      setHasFlash("torch" in capabilities)

      setIsScanning(true)
      startScanning()

      toast({
        title: "Camera Ready",
        description: "Point your camera at a barcode to scan",
      })
    } catch (error) {
      console.error("Camera access error:", error)
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    setIsScanning(false)
    setFlashEnabled(false)
  }

  const toggleFlash = async () => {
    if (!stream) return

    const track = stream.getVideoTracks()[0]
    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashEnabled }],
      })
      setFlashEnabled(!flashEnabled)
    } catch (error) {
      console.error("Flash toggle error:", error)
      toast({
        title: "Flash Error",
        description: "Unable to control flash",
        variant: "destructive",
      })
    }
  }

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return

    // Import the barcode detection library dynamically
    import("@zxing/library")
      .then(({ BrowserMultiFormatReader }) => {
        const codeReader = new BrowserMultiFormatReader()

        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || !canvasRef.current || !isScanning) return

          const canvas = canvasRef.current
          const video = videoRef.current
          const context = canvas.getContext("2d")

          if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

          // Set canvas size to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw current video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          try {
            // Try to decode barcode from canvas
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            const result = await codeReader.decodeFromImageData(imageData)

            if (result) {
              // Success! Found a barcode
              onScan(result.getText())
              stopCamera()
              onClose()

              toast({
                title: "Barcode Scanned!",
                description: `Found: ${result.getText()}`,
              })
            }
          } catch (error) {
            // No barcode found in this frame, continue scanning
          }
        }, 100) // Scan every 100ms
      })
      .catch((error) => {
        console.error("Barcode library loading error:", error)
        toast({
          title: "Scanner Error",
          description: "Unable to load barcode scanner",
          variant: "destructive",
        })
      })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-lg font-semibold">Scan Barcode</h2>
          <div className="flex items-center gap-2">
            {hasFlash && (
              <Button variant="ghost" size="sm" onClick={toggleFlash} className="text-white hover:bg-white/20">
                {flashEnabled ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Scanning frame */}
            <div className="w-64 h-64 md:w-80 md:h-80 border-2 border-white rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>

              {/* Scanning line animation */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div className="w-full h-0.5 bg-green-400 animate-pulse absolute top-1/2 transform -translate-y-1/2"></div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-lg">Position barcode within the frame</p>
            </div>
          </div>
        </div>

        {/* Hidden canvas for barcode processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Manual input fallback */}
      <div className="absolute bottom-4 left-4 right-4">
        <Card className="bg-black/50 border-white/20">
          <CardContent className="p-4">
            <p className="text-white text-sm text-center mb-2">
              Having trouble? You can also enter the barcode manually in the form.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
