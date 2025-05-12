import React, { useState, useRef, useEffect } from 'react';

interface DraggableLegendProps {
  className?: string;
  children: React.ReactNode;
  initialPosition?: { x: number, y: number };
}

const DraggableLegend: React.FC<DraggableLegendProps> = ({
  className,
  children,
  initialPosition = { x: 10, y: 10 } // Default position in top-right corner
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (elementRef.current) {
      setIsDragging(true);
      // Calculate offset from the div's corner to where mouse was clicked
      setDragOffset({
        x: e.clientX - elementRef.current.getBoundingClientRect().left,
        y: e.clientY - elementRef.current.getBoundingClientRect().top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !elementRef.current || !parentRef.current) return;

      // Get parent and element dimensions
      const parentRect = parentRef.current.getBoundingClientRect();
      const elementRect = elementRef.current.getBoundingClientRect();

      // Calculate new position relative to parent
      let newX = e.clientX - parentRect.left - dragOffset.x;
      let newY = e.clientY - parentRect.top - dragOffset.y;

      // Constrain position within parent boundaries
      newX = Math.max(0, Math.min(newX, parentRect.width - elementRect.width));
      newY = Math.max(0, Math.min(newY, parentRect.height - elementRect.height));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div ref={parentRef} className="absolute inset-0 pointer-events-none">
      <div
        ref={elementRef}
        style={{
          position: 'absolute',
          top: position.y,
          left: position.x,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          pointerEvents: 'auto' // Enable pointer events only for the legend
        }}
        className={`${className} shadow-lg`}
        onMouseDown={handleMouseDown}
      >
        <div className="handle w-full p-1 bg-gray-800 hover:bg-gray-700 cursor-grab active:cursor-grabbing rounded-lg">
          <div className="flex justify-center">
            <div className="w-20 h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DraggableLegend;