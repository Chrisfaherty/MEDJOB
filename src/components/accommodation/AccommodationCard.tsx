'use client';

import { format } from 'date-fns';
import { MapPin, Home, Calendar, Euro } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AccommodationListing } from '@/types/database.types';
import { ROOM_TYPE_LABELS } from '@/types/database.types';

interface AccommodationCardProps {
  listing: AccommodationListing;
  isSelected?: boolean;
  onCardClick?: (listing: AccommodationListing) => void;
  index?: number;
}

export default function AccommodationCard({
  listing,
  isSelected = false,
  onCardClick,
  index = 0,
}: AccommodationCardProps) {
  const availableFrom = format(new Date(listing.available_from), 'MMM d');
  const hasPhoto = listing.photo_urls && listing.photo_urls.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.6), ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onCardClick?.(listing)}
      className={`
        relative cursor-pointer px-4 py-3.5
        transition-all duration-200 ease-out
        ${isSelected
          ? 'bg-teal-50/60 border-l-[3px] border-l-teal'
          : 'border-l-[3px] border-l-transparent hover:bg-slate-50/80'
        }
      `}
    >
      <div className="flex gap-3">
        {/* Photo thumbnail or placeholder */}
        <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
          {hasPhoto ? (
            <img
              src={listing.photo_urls[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-6 h-6 text-slate-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + Rent */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[13px] font-semibold text-apple-black truncate">
              {listing.title}
            </h3>
            <span className="text-[13px] font-bold text-teal whitespace-nowrap">
              &euro;{listing.rent_per_month}
            </span>
          </div>

          {/* Hospital + County */}
          <p className="text-[11px] text-slate-500 truncate mb-1.5">
            {listing.hospital_name}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className="inline-flex items-center px-2 py-[3px] text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full">
              {ROOM_TYPE_LABELS[listing.room_type]}
            </span>
            {listing.bills_included && (
              <span className="inline-flex items-center px-2 py-[3px] text-[10px] font-medium bg-green-50 text-green-600 rounded-full">
                Bills incl.
              </span>
            )}
          </div>

          {/* Footer: County + Available from */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-apple-secondary">
              <MapPin className="w-3 h-3" />
              <span>{listing.county}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-apple-secondary">
              <Calendar className="w-3 h-3" />
              <span>From {availableFrom}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
