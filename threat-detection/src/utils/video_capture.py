"""
Video Input Pipeline
Handles webcam and video file input with real-time display.
"""
import cv2
import argparse
import sys
from pathlib import Path


class VideoCapture:
    """Handles video capture from webcam or file."""

    def __init__(self, source=0):
        """
        Initialize video capture.

        Args:
            source: Camera index (int) or video file path (str)
        """
        self.source = source
        self.cap = None
        self.frame_width = 0
        self.frame_height = 0
        self.fps = 0

    def open(self):
        """Open video source."""
        # Check if source is file path
        if isinstance(self.source, str):
            if not Path(self.source).exists():
                raise FileNotFoundError(f"Video file not found: {self.source}")

        self.cap = cv2.VideoCapture(self.source)

        if not self.cap.isOpened():
            raise RuntimeError(f"Failed to open video source: {self.source}")

        # Get video properties
        self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30

        print(f"[INFO] Video source opened: {self.source}")
        print(f"[INFO] Resolution: {self.frame_width}x{self.frame_height}")
        print(f"[INFO] FPS: {self.fps:.1f}")

        return self

    def read(self):
        """Read a frame from video source."""
        if self.cap is None:
            return False, None
        return self.cap.read()

    def release(self):
        """Release video source."""
        if self.cap is not None:
            self.cap.release()
            self.cap = None

    def __enter__(self):
        return self.open()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()


def run_video_pipeline(source=0, window_name="Threat Detection"):
    """
    Run the video capture and display pipeline.

    Args:
        source: Camera index or video file path
        window_name: Display window name
    """
    try:
        with VideoCapture(source) as video:
            print(f"[INFO] Press 'q' to quit")

            while True:
                ret, frame = video.read()

                if not ret:
                    # End of video file or camera error
                    if isinstance(source, str):
                        print("[INFO] End of video file")
                    else:
                        print("[ERROR] Failed to read frame")
                    break

                # Display frame
                cv2.imshow(window_name, frame)

                # Check for 'q' key press (1ms delay for real-time)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("[INFO] Quit requested")
                    break

    except FileNotFoundError as e:
        print(f"[ERROR] {e}")
        sys.exit(1)
    except RuntimeError as e:
        print(f"[ERROR] {e}")
        sys.exit(1)
    finally:
        cv2.destroyAllWindows()
        print("[INFO] Cleanup complete")


def main():
    parser = argparse.ArgumentParser(description="Video Input Pipeline")
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Video source: camera index (0,1,2...) or video file path"
    )
    args = parser.parse_args()

    # Convert to int if camera index
    source = int(args.source) if args.source.isdigit() else args.source

    run_video_pipeline(source)


if __name__ == "__main__":
    main()
