import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const ProximityBannerSkeleton = () => {
  return (
    <div className="mb-4">
      <div className="bg-primary/90 text-primary-foreground rounded-2xl p-4 shadow-lg relative">
        {/* Icon and main content */}
        <div className="flex items-start gap-3 pr-8">
          <div className="flex-shrink-0 mt-1">
            <div className="bg-primary-foreground/20 rounded-full p-2">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <Skeleton className="h-4 w-64 bg-primary-foreground/20" />
              <Skeleton className="h-3 w-48 bg-primary-foreground/20 mt-1" />
            </div>

            {/* Location selection skeleton */}
            <div className="space-y-2">
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-32 bg-primary-foreground/20" />
                      <Skeleton className="h-3 w-20 bg-primary-foreground/20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-12 bg-primary-foreground/20 rounded-full" />
                </div>
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24 bg-primary-foreground/20 rounded-md" />
              <Skeleton className="h-8 w-28 bg-primary-foreground/20 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};