'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Home, Plus, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AccommodationCard from './AccommodationCard';
import AccommodationDetail from './AccommodationDetail';
import CreateListingModal, { type ListingFormData } from './CreateListingModal';
import type { AccommodationListing, RoomType } from '@/types/database.types';
import { ROOM_TYPE_LABELS } from '@/types/database.types';
import { supabaseAccommodationAPI } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import hospitalsData from '@/data/hospitals.json';

const hospitals = hospitalsData.hospitals;
const COUNTIES = Array.from(new Set(hospitals.map(h => h.county))).sort();

export default function AccommodationSection() {
  const { user } = useAuth();
  const [listings, setListings] = useState<AccommodationListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<AccommodationListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    counties: string[];
    roomTypes: RoomType[];
    maxRent: number | null;
  }>({
    counties: [],
    roomTypes: [],
    maxRent: null,
  });

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await supabaseAccommodationAPI.getActiveListings();
      setListings(data);
      if (data.length > 0) {
        setSelectedListing(data[0]);
      }
    } catch (error) {
      console.error('Error loading accommodation listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (formData: ListingFormData) => {
    if (!user) return;

    // Upload photos first
    const photoUrls: string[] = [];
    for (const photo of formData.photos) {
      const url = await supabaseAccommodationAPI.uploadPhoto(photo);
      photoUrls.push(url);
    }

    // Create the listing
    await supabaseAccommodationAPI.createListing({
      user_id: user.id,
      title: formData.title,
      description: formData.description || undefined,
      room_type: formData.room_type,
      rent_per_month: formData.rent_per_month,
      bills_included: formData.bills_included,
      deposit: formData.deposit,
      address_line: formData.address_line,
      county: formData.county,
      eircode: formData.eircode,
      hospital_id: formData.hospital_id,
      hospital_name: formData.hospital_name,
      available_from: formData.available_from,
      available_to: formData.available_to,
      min_lease_months: formData.min_lease_months,
      photo_urls: photoUrls,
      amenities: formData.amenities,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone,
    });

    // Reload listings
    await loadListings();
  };

  const handleSendInquiry = async (listingId: string, message: string) => {
    await supabaseAccommodationAPI.sendInquiry(listingId, message);
  };

  const toggleFilter = (filterKey: 'counties' | 'roomTypes', value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterKey] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterKey]: newValues };
    });
  };

  const clearFilters = () => {
    setFilters({ counties: [], roomTypes: [], maxRent: null });
  };

  // Filter listings
  const filteredListings = listings.filter(listing => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        listing.title.toLowerCase().includes(q) ||
        listing.hospital_name.toLowerCase().includes(q) ||
        listing.county.toLowerCase().includes(q) ||
        listing.description?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filters.counties.length && !filters.counties.includes(listing.county)) return false;
    if (filters.roomTypes.length && !filters.roomTypes.includes(listing.room_type)) return false;
    if (filters.maxRent && listing.rent_per_month > filters.maxRent) return false;
    return true;
  });

  const activeFilterCount = filters.counties.length + filters.roomTypes.length + (filters.maxRent ? 1 : 0);

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`w-full lg:w-[380px] lg:min-w-[380px] flex flex-col border-r border-slate-200/60 bg-white/50 ${
          selectedListing ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Search & Filter Bar */}
          <div className="p-3 space-y-2 border-b border-slate-100/80">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search accommodation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-apple-gray/60 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* Filter Toggle + List Button */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-apple-secondary font-medium">
                {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-teal/10 text-teal'
                      : 'text-apple-secondary hover:bg-slate-100/80'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-teal text-white text-[9px] font-bold rounded-full leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  List
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 border-t border-slate-100/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-apple-black">Active Filters</p>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-[10px] text-teal hover:underline font-medium">
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Room Type */}
                    <FilterSection label="Room Type">
                      {(Object.entries(ROOM_TYPE_LABELS) as [RoomType, string][]).map(([value, label]) => (
                        <FilterChip
                          key={value}
                          label={label}
                          active={filters.roomTypes.includes(value)}
                          onClick={() => toggleFilter('roomTypes', value)}
                        />
                      ))}
                    </FilterSection>

                    {/* County */}
                    <FilterSection label="County">
                      {COUNTIES.map(c => (
                        <FilterChip
                          key={c}
                          label={c}
                          active={filters.counties.includes(c)}
                          onClick={() => toggleFilter('counties', c)}
                        />
                      ))}
                    </FilterSection>

                    {/* Max Rent */}
                    <div>
                      <p className="text-[10px] font-semibold text-apple-secondary uppercase tracking-wider mb-1.5">Max Rent</p>
                      <div className="flex gap-1.5">
                        {[500, 750, 1000, 1500].map(amount => (
                          <FilterChip
                            key={amount}
                            label={`\u20AC${amount}`}
                            active={filters.maxRent === amount}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              maxRent: prev.maxRent === amount ? null : amount,
                            }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Listings List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-teal"></div>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <Home className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">
                  {listings.length === 0 ? 'No accommodation listed yet' : 'No listings match your criteria'}
                </p>
                <p className="text-[11px] text-apple-secondary mt-1">
                  {listings.length === 0 ? 'Be the first to list your place!' : 'Try adjusting your filters'}
                </p>
                {listings.length === 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold bg-teal text-white rounded-xl hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    List Your Place
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {filteredListings.map((listing, index) => (
                  <AccommodationCard
                    key={listing.id}
                    listing={listing}
                    isSelected={selectedListing?.id === listing.id}
                    onCardClick={setSelectedListing}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Pane: Detail View */}
        <main className={`flex-1 flex flex-col bg-white ${
          selectedListing ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedListing ? (
            <>
              {/* Mobile Back Button */}
              <button
                onClick={() => setSelectedListing(null)}
                className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 text-[13px] text-teal font-semibold border-b border-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Listings
              </button>

              <AccommodationDetail
                listing={selectedListing}
                onSendInquiry={handleSendInquiry}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-apple-gray flex items-center justify-center mx-auto mb-4">
                  <Home className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-apple-black text-lg font-semibold">Select a listing</p>
                <p className="text-[13px] text-apple-secondary mt-1">Click any listing to view details</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold bg-teal text-white rounded-xl hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  List Your Place
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Listing Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateListingModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateListing}
            userEmail={user?.email}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// --- Sub-components ---

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-apple-secondary uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        {children}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all duration-150 ${
        active
          ? 'bg-teal text-white shadow-sm'
          : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
      }`}
    >
      {label}
    </button>
  );
}
