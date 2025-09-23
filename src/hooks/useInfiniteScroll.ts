import { useCallback, useEffect, useRef } from 'react';

interface UseInfiniteScrollProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px'
}: UseInfiniteScrollProps) {
  const observerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver>();

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [loading, hasMore, onLoadMore]
  );

  useEffect(() => {
    const element = observerRef.current;

    if (element) {
      observer.current = new IntersectionObserver(handleObserver, {
        threshold,
        rootMargin
      });

      observer.current.observe(element);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserver, threshold, rootMargin]);

  return observerRef;
}