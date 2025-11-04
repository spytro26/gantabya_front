import { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';

interface BusImage {
  id: string;
  imageUrl: string;
  createdAt: string;
}

interface BusImageCarouselProps {
  images: BusImage[];
  busName?: string;
}

export function BusImageCarousel({ images, busName }: BusImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  if (!images || images.length === 0) {
    // Show placeholder if no images
    return (
      <div className="relative w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <FaImage className="text-4xl mx-auto mb-2" />
          <p className="text-sm">No images available</p>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setImageError(false);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setImageError(false);
  };

  const handleImageLoad = () => {
    setLoadedImages((prev) => new Set(prev).add(currentIndex));
    setImageError(false);
  };

  const handleImageError = () => {
    console.error('Failed to load image:', images[currentIndex].imageUrl);
    setImageError(true);
  };

  return (
    <div className="relative w-full h-48 group">
      {/* Main Image */}
      <div className="relative w-full h-full overflow-hidden rounded-lg bg-white">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center text-gray-400">
              <FaImage className="text-4xl mx-auto mb-2" />
              <p className="text-xs">Failed to load image</p>
            </div>
          </div>
        ) : (
          <>
            {!loadedImages.has(currentIndex) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-yellow-500"></div>
              </div>
            )}
            <img
              src={images[currentIndex].imageUrl}
              alt={`${busName || 'Bus'} - Image ${currentIndex + 1}`}
              className="w-full h-full object-contain bg-white"
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="eager"
              style={{ display: 'block', backgroundColor: 'white' }}
            />
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Navigation Buttons - Show on hover or always on mobile */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <FaChevronLeft />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <FaChevronRight />
          </button>
        </>
      )}

      {/* Thumbnail Dots */}
      {images.length > 1 && images.length <= 5 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-4'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
