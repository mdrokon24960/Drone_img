'use client';

import React, { useMemo } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { Detection } from '@/types/detection';

interface BBoxOverlayProps {
  detections: Detection[];
  imageBounds: [number, number, number, number]; // [SW_lng, SW_lat, NE_lng, NE_lat]
  confidenceThreshold: number;
  hiddenClasses: Set<string>;
  imageWidth: number;
  imageHeight: number;
  onBBoxClick?: (id: number) => void;
  highlightedId?: number | null;
}

export default function BBoxOverlay({
  detections,
  imageBounds,
  confidenceThreshold,
  hiddenClasses,
  imageWidth,
  imageHeight,
  onBBoxClick,
  highlightedId,
}: BBoxOverlayProps) {
  const { current: map } = useMap();

  const filteredDetections = useMemo(() => {
    return detections
      .map((d, idx) => ({ ...d, originalIndex: idx }))
      .filter(d => 
        d.confidence >= confidenceThreshold && 
        !hiddenClasses.has(d.label)
      );
  }, [detections, confidenceThreshold, hiddenClasses]);

  if (!map) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="w-full h-full">
        {filteredDetections.map((d, i) => {
          // Pixel bbox: [x_min, y_min, x_max, y_max]
          const [x1, y1, x2, y2] = d.bbox;
          
          // Note: In a real app, we would need the image width/height to normalize.
          // For now, we assume d.bbox is normalized 0-1 or we use the image metadata.
          // Let's assume the backend returns absolute pixel coords and we have 
          // the image resolution from the detection result.
          
          // This is a simplified projection assuming linear mapping across bounds.
          const lng1 = imageBounds[0] + (x1 / imageWidth) * (imageBounds[2] - imageBounds[0]);
          const lng2 = imageBounds[0] + (x2 / imageWidth) * (imageBounds[2] - imageBounds[0]);
          const lat1 = imageBounds[3] - (y1 / imageHeight) * (imageBounds[3] - imageBounds[1]);
          const lat2 = imageBounds[3] - (y2 / imageHeight) * (imageBounds[3] - imageBounds[1]);

          const p1 = map.project([lng1, lat1]);
          const p2 = map.project([lng2, lat2]);

          const width = Math.abs(p2.x - p1.x);
          const height = Math.abs(p2.y - p1.y);
          const left = Math.min(p1.x, p2.x);
          const top = Math.min(p1.y, p2.y);

          const isHighlighted = highlightedId === d.originalIndex;

          return (
            <g 
              key={`${d.label}-${d.originalIndex}`} 
              className="pointer-events-auto cursor-pointer"
              onClick={() => onBBoxClick?.(d.originalIndex)}
            >
              <rect
                x={left}
                y={top}
                width={width}
                height={height}
                fill={isHighlighted ? `${d.color}20` : "none"}
                stroke={d.color}
                strokeWidth={isHighlighted ? "4" : "2"}
                className="transition-all duration-300"
                style={{ filter: `drop-shadow(0 0 4px ${d.color}${isHighlighted ? '80' : '40'})` }}
              />
              <foreignObject x={left} y={top - 24} width={width + 100} height={24}>
                <div 
                  className="px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap rounded-t-md uppercase tracking-wider w-fit"
                  style={{ backgroundColor: d.color, opacity: isHighlighted ? 1 : 0.8 }}
                >
                  {d.label} {Math.round(d.confidence * 100)}%
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
