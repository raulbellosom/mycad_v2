import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { env } from "../appwrite/env";
import { getFileViewUrl, getFileDownloadUrl } from "../utils/storage";

export function ImageViewerModal({
  isOpen,
  onClose,
  currentImageId,
  images = [],
  bucketId = env.bucketVehiclesId,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTweaking, setIsTweaking] = useState(false);

  const containerRef = useRef(null);
  const [touchStartDist, setTouchStartDist] = useState(null);

  // Sync index when currentImageId changes
  useEffect(() => {
    if (currentImageId && images.length > 0) {
      const idx = images.indexOf(currentImageId);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [currentImageId, images]);

  const activeFileId = images[currentIndex];

  // Reset scale/rotation when changing image
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setIsTweaking(false);
    setLoading(true);
  }, [currentIndex]);

  const nextImage = (e) => {
    e?.stopPropagation();
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Handle Wheel Zoom
  const handleWheel = (e) => {
    e.stopPropagation();
    const delta = -e.deltaY * 0.001;
    setScale((s) => Math.min(5, Math.max(0.1, s + delta)));
    setIsTweaking(true);
  };

  // Handle Pinch Zoom (Mobile)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - touchStartDist;

      setScale((s) => Math.min(5, Math.max(0.1, s + delta * 0.01)));
      setTouchStartDist(dist);
      setIsTweaking(true);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDist(null);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!activeFileId) return;
    try {
      const downloadUrl = getFileDownloadUrl(bucketId, activeFileId);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `image-${activeFileId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error downloading file", e);
    }
  };

  const resetView = () => {
    setScale(1);
    setRotation(0);
    setIsTweaking(false);
  };

  const imageUrl = activeFileId ? getFileViewUrl(bucketId, activeFileId) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Controls Layer */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-50 text-white">
            {/* Top Bar */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="flex justify-between items-center pointer-events-auto"
            >
              <div className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                {currentIndex + 1} / {images.length}
              </div>
              <button
                onClick={onClose}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10"
              >
                <X size={24} />
              </button>
            </motion.div>

            {/* Middle (Nav Buttons) */}
            <div className="flex-1 flex items-center justify-between">
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="pointer-events-auto p-3 bg-black/20 hover:bg-black/40 rounded-full transition-all border border-white/5 disabled:opacity-30 ml-[-10px] sm:ml-0"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="pointer-events-auto p-3 bg-black/20 hover:bg-black/40 rounded-full transition-all border border-white/5 mr-[-10px] sm:mr-0"
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Toolbar */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="flex justify-center pointer-events-auto"
            >
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full p-2 shadow-2xl">
                <ToolButton
                  icon={ZoomOut}
                  onClick={() => {
                    setScale((s) => Math.max(0.1, s - 0.2));
                    setIsTweaking(true);
                  }}
                  label="Zoom Out"
                />
                <div className="px-3 min-w-[60px] text-center font-mono text-sm font-medium text-white/90">
                  {Math.round(scale * 100)}%
                </div>
                <ToolButton
                  icon={ZoomIn}
                  onClick={() => {
                    setScale((s) => Math.min(5, s + 0.2));
                    setIsTweaking(true);
                  }}
                  label="Zoom In"
                />
                <div className="w-px h-6 bg-white/10 mx-2" />
                <ToolButton
                  icon={RotateCw}
                  onClick={() => {
                    setRotation((r) => r + 90);
                    setIsTweaking(true);
                  }}
                  label="Rotate"
                />
                <ToolButton
                  icon={Maximize2}
                  onClick={resetView}
                  label="Reset"
                  active={isTweaking}
                  className={clsx(
                    isTweaking ? "text-(--brand)" : "text-zinc-400"
                  )}
                />
                <div className="w-px h-6 bg-white/10 mx-2" />
                <ToolButton
                  icon={Download}
                  onClick={handleDownload}
                  label="Download"
                  className="bg-white/15 hover:bg-white/25 text-white"
                />
              </div>
            </motion.div>
          </div>

          {/* Image Layer */}
          <motion.div
            ref={containerRef}
            className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-12 pointer-events-auto touch-none"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-white/30">
                <Loader2 size={48} className="animate-spin" />
              </div>
            )}

            {imageUrl && (
              <motion.img
                key={activeFileId}
                src={imageUrl}
                alt="Quick View"
                onLoad={() => setLoading(false)}
                animate={{ scale, rotate: rotation }}
                transition={{ type: "spring", stiffness: 250, damping: 25 }}
                drag
                dragConstraints={containerRef}
                dragElastic={0.05}
                className={clsx(
                  "max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing shadow-2xl rounded-sm",
                  loading ? "opacity-0" : "opacity-100"
                )}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ToolButton({ icon: Icon, onClick, label, className, active }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "p-2.5 rounded-full transition-all duration-200 group active:scale-95",
        className || "text-zinc-300 hover:text-white hover:bg-white/10"
      )}
      title={label}
    >
      <Icon size={20} className="transition-transform group-hover:scale-110" />
    </button>
  );
}
