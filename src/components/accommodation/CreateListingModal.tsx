'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, Home, Camera } from 'lucide-react';
import type { RoomType } from '@/types/database.types';
import { ROOM_TYPE_LABELS, AMENITY_OPTIONS } from '@/types/database.types';
import hospitalsData from '@/data/hospitals.json';

const hospitals = hospitalsData.hospitals;
const COUNTIES = Array.from(new Set(hospitals.map(h => h.county))).sort();

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
  bills_included: 'Bills Incl.',
};

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ListingFormData) => Promise<void>;
  userEmail?: string;
}

export interface ListingFormData {
  title: string;
  description: string;
  room_type: RoomType;
  rent_per_month: number;
  deposit?: number;
  bills_included: boolean;
  county: string;
  hospital_id: string;
  hospital_name: string;
  address_line?: string;
  eircode?: string;
  available_from: string;
  available_to?: string;
  min_lease_months: number;
  amenities: string[];
  photos: File[];
  contact_email: string;
  contact_phone?: string;
}

/**
 * Compress an image file using Canvas API
 */
async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

export default function CreateListingModal({
  isOpen,
  onClose,
  onSubmit,
  userEmail = '',
}: CreateListingModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ListingFormData>({
    title: '',
    description: '',
    room_type: 'private_room',
    rent_per_month: 0,
    bills_included: false,
    county: '',
    hospital_id: '',
    hospital_name: '',
    available_from: '',
    min_lease_months: 6,
    amenities: [],
    photos: [],
    contact_email: userEmail,
  });

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const filteredHospitals = form.county
    ? hospitals.filter(h => h.county === form.county)
    : hospitals;

  const updateForm = (updates: Partial<ListingFormData>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleCountyChange = (county: string) => {
    const hospitalsInCounty = hospitals.filter(h => h.county === county);
    const firstHospital = hospitalsInCounty[0];
    updateForm({
      county,
      hospital_id: firstHospital?.id || '',
      hospital_name: firstHospital?.name || '',
    });
  };

  const handleHospitalChange = (hospitalId: string) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (hospital) {
      updateForm({
        hospital_id: hospital.id,
        hospital_name: hospital.name,
      });
    }
  };

  const handlePhotoAdd = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 6 - form.photos.length;
    const newFiles = Array.from(files).slice(0, remaining);

    const compressed = await Promise.all(newFiles.map(f => compressImage(f)));
    const previews = compressed.map(f => URL.createObjectURL(f));

    setForm(prev => ({ ...prev, photos: [...prev.photos, ...compressed] }));
    setPhotoPreviews(prev => [...prev, ...previews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.rent_per_month || !form.county || !form.hospital_id || !form.available_from || !form.contact_email) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-float overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal/10 rounded-xl flex items-center justify-center">
              <Home className="w-4 h-4 text-teal" />
            </div>
            <h2 className="text-[15px] font-bold text-apple-black">List Your Place</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              placeholder="e.g. Bright double room near UHL"
              className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              placeholder="Describe the accommodation, nearby amenities, transport links..."
              rows={3}
              className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 resize-none transition-all"
            />
          </div>

          {/* Room Type */}
          <div>
            <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Room Type *</label>
            <div className="flex gap-2 mt-1">
              {(Object.entries(ROOM_TYPE_LABELS) as [RoomType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateForm({ room_type: value })}
                  className={`flex-1 px-3 py-2 text-[12px] font-medium rounded-xl transition-all ${
                    form.room_type === value
                      ? 'bg-teal text-white shadow-sm'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rent + Deposit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Rent/month *</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">&euro;</span>
                <input
                  type="number"
                  min="0"
                  value={form.rent_per_month || ''}
                  onChange={(e) => updateForm({ rent_per_month: parseInt(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Deposit</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">&euro;</span>
                <input
                  type="number"
                  min="0"
                  value={form.deposit || ''}
                  onChange={(e) => updateForm({ deposit: parseInt(e.target.value) || undefined })}
                  className="w-full pl-7 pr-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bills Included Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] font-medium text-slate-600">Bills included</span>
            <button
              type="button"
              onClick={() => updateForm({ bills_included: !form.bills_included })}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.bills_included ? 'bg-teal' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  form.bills_included ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </div>

          {/* County + Hospital */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">County *</label>
              <select
                value={form.county}
                onChange={(e) => handleCountyChange(e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all appearance-none"
              >
                <option value="">Select county</option>
                {COUNTIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Hospital *</label>
              <select
                value={form.hospital_id}
                onChange={(e) => handleHospitalChange(e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all appearance-none"
              >
                <option value="">Select hospital</option>
                {filteredHospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.shortName || h.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address + Eircode */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Address</label>
              <input
                type="text"
                value={form.address_line || ''}
                onChange={(e) => updateForm({ address_line: e.target.value })}
                placeholder="Street address"
                className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Eircode</label>
              <input
                type="text"
                value={form.eircode || ''}
                onChange={(e) => updateForm({ eircode: e.target.value })}
                placeholder="V94 XXX"
                className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Available from *</label>
              <input
                type="date"
                value={form.available_from}
                onChange={(e) => updateForm({ available_from: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Available until</label>
              <input
                type="date"
                value={form.available_to || ''}
                onChange={(e) => updateForm({ available_to: e.target.value || undefined })}
                className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all"
              />
            </div>
          </div>

          {/* Min Lease */}
          <div>
            <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Minimum lease (months)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={form.min_lease_months}
              onChange={(e) => updateForm({ min_lease_months: parseInt(e.target.value) || 6 })}
              className="mt-1 w-24 px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all"
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Amenities</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {AMENITY_OPTIONS.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all duration-150 ${
                    form.amenities.includes(amenity)
                      ? 'bg-teal text-white shadow-sm'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {AMENITY_LABELS[amenity] || amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Photos (max 6)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {photoPreviews.map((preview, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                  <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {form.photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-teal/40 hover:text-teal transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-medium">Add</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePhotoAdd(e.target.files)}
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Contact email *</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => updateForm({ contact_email: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-apple-secondary uppercase tracking-wider">Phone</label>
              <input
                type="tel"
                value={form.contact_phone || ''}
                onChange={(e) => updateForm({ contact_phone: e.target.value })}
                placeholder="Optional"
                className="mt-1 w-full px-3.5 py-2.5 text-[13px] bg-apple-gray/50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[12px] text-red-500 font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </form>

        {/* Submit Button */}
        <div className="px-6 py-4 border-t border-slate-100">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 text-[14px] font-semibold bg-teal text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating listing...' : 'Publish Listing'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
