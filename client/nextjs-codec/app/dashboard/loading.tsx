'use client';

export default function LoadingAnimation() {
  return (
    <div className="flex justify-center items-center p-8">
      <style jsx>{`
        .loading-text {
          color: #e1e1e1;
          font-size: 1rem;
          font-weight: 500;
          opacity: 0.8;
        }
      `}</style>
      <span className="loading-text">Loading...</span>
    </div>
  );
}