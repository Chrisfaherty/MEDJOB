'use client';

import { useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import type { DeadlineAlert } from '@/lib/deadlineNotifications';
import { sendBrowserNotification } from '@/lib/deadlineNotifications';
import type { Job } from '@/types/database.types';

interface DeadlineNotifPanelProps {
  alerts: DeadlineAlert[];
  onClose: () => void;
  onJobSelect: (job: Job) => void;
}

function formatTimeRemaining(hours: number): string {
  if (hours < 2) return `${Math.floor(hours * 60)}m left`;
  if (hours < 24) return `${Math.floor(hours)}h left`;
  return `${Math.ceil(hours / 24)}d left`;
}

export default function DeadlineNotifPanel({ alerts, onClose, onJobSelect }: DeadlineNotifPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const criticalAlerts = alerts.filter(a => a.urgency === 'critical');
  const warningAlerts = alerts.filter(a => a.urgency === 'warning');

  const handleEnableNotifications = async () => {
    for (const alert of criticalAlerts.length ? criticalAlerts : alerts.slice(0, 3)) {
      await sendBrowserNotification(alert);
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal" />
          <span className="text-[13px] font-semibold text-apple-black">Deadline Alerts</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-2">
              <Bell className="w-5 h-5 text-teal" />
            </div>
            <p className="text-[13px] font-medium text-apple-black">{"You're on top of it"}</p>
            <p className="text-[11px] text-apple-secondary mt-0.5">No urgent deadlines right now</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {criticalAlerts.length > 0 && (
              <div className="px-4 py-2">
                <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1.5">
                  Closing soon ({'< 48h'})
                </p>
                {criticalAlerts.map(alert => (
                  <AlertRow key={alert.job.id} alert={alert} onJobSelect={onJobSelect} onClose={onClose} />
                ))}
              </div>
            )}
            {warningAlerts.length > 0 && (
              <div className="px-4 py-2">
                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1.5">This week</p>
                {warningAlerts.map(alert => (
                  <AlertRow key={alert.job.id} alert={alert} onJobSelect={onJobSelect} onClose={onClose} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100">
        <button
          onClick={handleEnableNotifications}
          className="w-full py-2 text-[12px] font-semibold text-teal bg-teal/10 rounded-xl hover:bg-teal/20 transition-colors"
        >
          Enable browser notifications
        </button>
      </div>
    </div>
  );
}

function AlertRow({
  alert,
  onJobSelect,
  onClose,
}: {
  alert: DeadlineAlert;
  onJobSelect: (job: Job) => void;
  onClose: () => void;
}) {
  const isCritical = alert.urgency === 'critical';
  const timeText = formatTimeRemaining(alert.hoursRemaining);

  return (
    <button
      onClick={() => { onJobSelect(alert.job); onClose(); }}
      className="w-full text-left py-2 hover:bg-slate-50 rounded-lg transition-colors px-1"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-apple-black truncate">{alert.job.title}</p>
          <p className="text-[11px] text-apple-secondary truncate">{alert.job.hospital_name}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${
          isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
        }`}>
          {timeText}
        </span>
      </div>
    </button>
  );
}
