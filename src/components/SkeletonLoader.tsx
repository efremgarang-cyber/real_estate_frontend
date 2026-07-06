import React from 'react';
import { Skeleton } from './ui/skeleton';

// Skeleton for subscription tier card
export const SubscriptionTierSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 flex flex-col justify-between space-y-4">
      {/* Badge + Title */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Features List */}
      <div className="space-y-3 flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>

      {/* Button */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
};

// Skeleton for active subscription banner
export const ActiveSubscriptionSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-40" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-32" />
      </div>
    </div>
  );
};

// Loading state placeholder for the entire plans section
export const SubscriptionPlansLoader: React.FC = () => {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Active subscription skeleton */}
      <ActiveSubscriptionSkeleton />

      {/* Plans header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Pricing cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SubscriptionTierSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};
