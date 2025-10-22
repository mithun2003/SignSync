import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';

@Component({
  selector: 'app-gesture-detection',
  templateUrl: './gesture-detection.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class GestureDetectionComponent implements OnInit {
  @ViewChild('videoElement', { static: false })
  videoElement!: ElementRef<HTMLVideoElement>;

  predictionLabel: string | null = null;
  confidence = 0;
  feedbackText = '';
  isRecording = signal(false);
  private intervalId: any;

  ngOnInit() {
    // this.initCamera();
  }



   private mediaStream: MediaStream | null = null; // 👈 Store stream reference

  async startRecording() {
    try {
      console.log(this.isRecording);
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = this.mediaStream;
      this.isRecording.set(true);
      this.feedbackText = 'Camera active. Show hand gestures...';
      console.log(this.isRecording);

      // Start your ML model inference here (if any)
      // this.startGestureDetection();

    } catch (err) {
      console.error('Error accessing camera:', err);
      this.feedbackText = 'Failed to access camera. Please allow permissions.';
    }
  }

  stopRecording() {
    if (this.mediaStream) {
      // 👇 STOP ALL TRACKS — THIS IS THE KEY!
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }

    this.isRecording.set(false);
    this.predictionLabel = '';
    this.confidence = 0;
    this.feedbackText = 'Camera stopped. Click Start to begin again.';
  }


  private captureAndPredict() {
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (blob) {
        const formData = new FormData();
        formData.append('file', blob, 'frame.png');

        try {
          const res = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            body: formData,
          });
          const result = await res.json();

          this.predictionLabel = result.class_idx ?? 'Unknown';
          this.confidence = parseFloat((result.confidence * 100).toFixed(2));
          this.updateFeedback(this.confidence);
        } catch (err) {
          console.error('Prediction error:', err);
        }
      }
    }, 'image/png');
  }

  private updateFeedback(confidence: number) {
    if (confidence > 85) this.feedbackText = 'High confidence recognition!';
    else if (confidence > 60) this.feedbackText = 'Moderate confidence result.';
    else
      this.feedbackText =
        'Low confidence — try adjusting lighting or hand position.';
  }
}
