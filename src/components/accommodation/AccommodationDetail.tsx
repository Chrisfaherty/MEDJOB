'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Home,
  MapPin,
  Calendar,
  Euro,
  Building2,
  Mail,
  Phone,
  Copy,
  Check,
  Send,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Car,
  Sofa,
  Droplets,
  Trees,
  ShieldCheck,
} from 'lucide-react';
import type { AccommodationListing } from '@/types/database.types';
import { ROOM_TYPE_LABELS } from '@/types/database.types';

interface AccommodationDetailProps {
  listing: AccommodationListing;
  onSendInquiry?: (listingId: string, message: string) => Promise<void>;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  parking: <Car className="w-3.5 h-3.5" />,
  furnished: <Sofa className="w-3.5 h-3.5" />,
  washer: <Droplets className="w-3.5 h-3.5" />,
  dryer: <Droplets className="w-3.5 h-3.5" />,
  garden: <Trees className="w-3.5 h-3.5" />,
  ensuite: <ShieldCheck className="w-3.5 h-3.5" />,
};

const AMENITY_LABELS: Record<string, string> = {
  furnished: 'Furnished',
  parking: 'Parking',
  wifi: 'WiFi',
  washer: 'Washer',
  dryer: 'Dryer',
  dishwasher: 'Dishwasher',
  garden: 'Garden',
  balcony: 'Balcony',
  ensuite: 'Ensuite',
  bills_included: 'Bills Included',
};

export default function AccommodationDetail({
  listing,
  onSendInquiry,
}: AccommodationDetailProps) {
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  // Reset photo index when listing changes to prevent out-of-bounds access
  useEffect(() => {
    setActivePhoto(0);
    setSent(false);
    setInquiryError('');
    setInquiryMessage('');
  }, [listing.id]);

  const hasPhotos = listing.photo_urls && listing.photo_urls.length > 0;
  const availableFrom = format(new Date(listing.available_from), 'MMMM d, yyyy');
  const availableTo = listing.available_to ? format(new Date(listing.available_to), 'MMMM d, yyyy') : null;

  const handleSendInquiry = async () => {
    if (!inquiryMessage.trim() || !onSendInquiry) return;
    setSending(true);
    setInquiryError('');
    try {
      await onSendInquiry(listing.id, inquiryMessage);
      setSent(true);
      setInquiryMessage('');
      setTimeout(() => setSent(false), 3000);
    } catch {
      setInquiryError('Failed to send enquiry. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(listing.contact_email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hero Section */}
      <motion.div
        key={listing.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 pt-6 pb-4 border-b border-slate-100"
      >
        {/* Photo Gallery */}
        {hasPhotos && (
          <div className="relative mb-4 rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={listing.photo_urls[activePhoto]}
              alt={`${listing.title} photo ${activePhoto + 1}`}
              className="w-full h-56 object-cover"
            />
            {listing.photo_urls.length > 1 && (
              <>
                <button
                  onClick={() => setActivePhoto(p => Math.max(0, p - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  disabled={activePhoto === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActivePhoto(p => Math.min(listing.photo_urls.length - 1, p + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  disabled={activePhoto === listing.photo_urls.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {listing.photo_urls.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === activePhoto ? 'bg-white w-4' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Title + Rent */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-apple-black leading-tight mb-1">
              {listing.title}
            </h2>
            <div className="flex items-center gap-2 text-[13px] text-apple-secondary">
              <MapPin className="w-3.5 h-3.5" />
              <span>{listing.county}</span>
              {listing.address_line && (
                <>
                  <span className="text-slate-300">|</span>
                  <span>{listing.address_line}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-teal">&euro;{listing.rent_per_month}</p>
            <p className="text-[11px] text-apple-secondary">per month</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-full">
            <Home className="w-3 h-3" />
            {ROOM_TYPE_LABELS[listing.room_type]}
          </span>
          {listing.bills_included && (
            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium bg-green-50 text-green-600 rounded-full">
              Bills included
            </span>
          )}
          {listing.deposit && (
            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium bg-amber-50 text-amber-600 rounded-full">
              &euro;{listing.deposit} deposit
            </span>
          )}
        </div>
      </motion.div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-5">
        {/* Description */}
        {listing.description && (
          <div>
            <h3 className="text-[13px] font-semibold text-apple-black mb-2">About this place</h3>
            <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <DetailCell
            icon={<Calendar className="w-4 h-4 text-teal" />}
            label="Available from"
            value={availableFrom}
          />
          {availableTo && (
            <DetailCell
              icon={<Calendar className="w-4 h-4 text-slate-400" />}
              label="Available until"
              value={availableTo}
            />
          )}
          {listing.min_lease_months && (
            <DetailCell
              icon={<Calendar className="w-4 h-4 text-slate-400" />}
              label="Min. lease"
              value={`${listing.min_lease_months} months`}
            />
          )}
          {listing.eircode && (
            <DetailCell
              icon={<MapPin className="w-4 h-4 text-slate-400" />}
              label="Eircode"
              value={listing.eircode}
            />
          )}
        </div>

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div>
            <h3 className="text-[13px] font-semibold text-apple-black mb-2">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map(amenity => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium bg-apple-gray/60 text-slate-600 rounded-xl"
                >
                  {AMENITY_ICONS[amenity] || <Check className="w-3.5 h-3.5" />}
                  {AMENITY_LABELS[amenity] || amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hospital Link */}
        <div className="bg-apple-gray/60 rounded-2xl p-4">
          <h3 className="text-[13px] font-semibold text-apple-black mb-2">Near Hospital</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-apple-black">{listing.hospital_name}</p>
              <p className="text-[11px] text-apple-secondary">{listing.county}</p>
            </div>
          </div>
        </div>

        {/* Map */}
        {listing.latitude && listing.longitude && (
          <div>
            <h3 className="text-[13px] font-semibold text-apple-black mb-2">Location</h3>
            <div className="rounded-2xl overflow-hidden border border-slate-200/60">
              <iframe
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - 0.01},${listing.latitude - 0.008},${listing.longitude + 0.01},${listing.latitude + 0.008}&layer=mapnik&marker=${listing.latitude},${listing.longitude}`}
              />
            </div>
          </div>
        )}

        {/* Posted by */}
        {listing.poster_name && (
          <div className="text-[11px] text-apple-secondary">
            Listed by <span className="font-medium text-slate-600">{listing.poster_name}</span>
            {' '}&middot;{' '}
            {format(new Date(listing.created_at), 'MMM d, yyyy')}
          </div>
        )}

        {/* Inquiry Form */}
        <div className="bg-apple-gray/60 rounded-2xl p-4">
          <h3 className="text-[13px] font-semibold text-apple-black mb-2">Send an enquiry</h3>
          <textarea
            value={inquiryMessage}
            onChange={(e) => setInquiryMessage(e.target.value)}
            placeholder="Hi, I'm interested in this accommodation. I'm rotating to this hospital and looking for a place from..."
            className="w-full h-20 text-[13px] bg-white border border-slate-200/60 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 resize-none transition-all"
          />
          <div className="flex items-center justify-between mt-2">
            <p className={`text-[10px] ${inquiryError ? 'text-red-500 font-medium' : 'text-apple-secondary'}`}>
              {inquiryError || (sent ? 'Enquiry sent!' : 'Your message will be sent to the listing owner')}
            </p>
            <button
              onClick={handleSendInquiry}
              disabled={!inquiryMessage.trim() || sending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-teal text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3 h-3" />
              {sending ? 'Sending...' : sent ? 'Sent!' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="flex-shrink-0 px-4 py-3 glass border-t border-slate-200/50">
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${listing.contact_email}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-teal text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email Owner
          </a>
          <button
            onClick={copyEmail}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium bg-apple-gray border border-slate-200/60 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {listing.contact_phone && (
            <a
              href={`tel:${listing.contact_phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium bg-apple-gray border border-slate-200/60 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 bg-apple-gray/40 rounded-xl p-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] text-apple-secondary uppercase tracking-wider font-medium">{label}</p>
        <p className="text-[13px] font-semibold text-apple-black mt-0.5">{value}</p>
      </div>
    </div>
  );
}
