'use client';

import { useState, useEffect } from 'react';
import { Mail, Home, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AccommodationListing, AccommodationInquiry } from '@/types/database.types';
import { supabaseAccommodationAPI } from '@/lib/supabase';

interface MyListingsInboxProps {
  listing: AccommodationListing;
  onDeactivated: () => void;
}

export default function MyListingsInbox({ listing, onDeactivated }: MyListingsInboxProps) {
  const [inquiries, setInquiries] = useState<AccommodationInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, [listing.id]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await supabaseAccommodationAPI.getInquiriesForListing(listing.id);
      setInquiries(data);
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this listing? It will no longer appear in search results.')) return;
    try {
      setDeactivating(true);
      await supabaseAccommodationAPI.deleteListing(listing.id);
      onDeactivated();
    } catch {
      setDeactivating(false);
    }
  };

  const availableFrom = listing.available_from
    ? new Date(listing.available_from).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Immediately';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Listing Summary */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-bold text-apple-black">{listing.title}</h2>
            <p className="text-[13px] text-apple-secondary mt-0.5">{listing.county} · Available {availableFrom}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[14px] font-bold text-teal">€{listing.rent_per_month.toLocaleString()}/mo</span>
              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                listing.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {listing.is_active ? 'Active' : 'Inactive'}
              </span>
              {inquiries.length > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-teal/10 text-teal">
                  {inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'}
                </span>
              )}
            </div>
          </div>
          {listing.is_active && (
            <button
              onClick={handleDeactivate}
              disabled={deactivating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {deactivating ? 'Deactivating…' : 'Deactivate'}
            </button>
          )}
        </div>
      </div>

      {/* Inquiries */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <h3 className="text-[12px] font-semibold text-apple-secondary uppercase tracking-wider mb-3">
          Inquiries ({inquiries.length})
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-teal"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[13px] font-medium text-slate-500">No inquiries yet</p>
            <p className="text-[11px] text-apple-secondary mt-0.5">Messages from interested renters will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map(inquiry => {
              const senderName = (inquiry as any).user_profiles?.name ?? 'Anonymous';
              const senderEmail = (inquiry as any).user_profiles?.email ?? '';
              const timeAgo = formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true });

              return (
                <div key={inquiry.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-[13px] font-semibold text-apple-black">{senderName}</p>
                      <p className="text-[11px] text-apple-secondary">{timeAgo}</p>
                    </div>
                    {senderEmail && (
                      <a
                        href={`mailto:${senderEmail}?subject=Re: ${encodeURIComponent(listing.title)}`}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        Reply
                      </a>
                    )}
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{inquiry.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
