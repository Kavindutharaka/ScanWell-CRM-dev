import {
  Clock, FileText, Ship, TrendingUp, Newspaper,
  Trophy, XCircle, AlertTriangle, Bell, Package
} from 'lucide-react';

/**
 * NotificationPanel — Dropdown panel showing categorized notifications.
 * Rendered inside Header.jsx below the bell icon.
 */
export default function NotificationPanel({ notifications, isOpen, onClose }) {
  if (!isOpen || !notifications) return null;

  const {
    activityReminders = [],
    quoteExpirations = [],
    rfqExpirations = [],
    rateExpirations = [],
    newQuotes = [],
    newRfqs = [],
    newsFeedUpdates = [],
    quoteOutcomes = [],
    totalCount = 0
  } = notifications;

  // Helper: relative time string
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    // Future times (expiring)
    if (diffMs > 0) {
      if (diffMins < 60) return `${diffMins}m left`;
      if (diffHours < 24) return `${diffHours}h left`;
      return `${diffDays}d left`;
    }

    // Past times (created)
    const absMins = Math.abs(diffMins);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);
    if (absMins < 60) return `${absMins}m ago`;
    if (absHours < 24) return `${absHours}h ago`;
    if (absDays < 7) return `${absDays}d ago`;
    return date.toLocaleDateString();
  };

  // Helper: priority class based on urgency
  const getUrgencyClass = (dateStr) => {
    if (!dateStr) return 'text-slate-500';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (date - now) / 3600000;
    if (diffHours <= 2 && diffHours > 0) return 'text-red-600 font-semibold';
    if (diffHours <= 24 && diffHours > 0) return 'text-amber-600 font-medium';
    return 'text-slate-500';
  };

  const sections = [
    {
      key: 'activityReminders',
      title: 'Activity Reminders',
      icon: <Clock className="w-4 h-4 text-red-500" />,
      items: activityReminders,
      render: (item) => ({
        title: item.activityName || 'Activity',
        subtitle: `${item.activityType || 'Task'} - ${item.status || ''}`,
        time: getRelativeTime(item.endTime),
        urgencyClass: getUrgencyClass(item.endTime),
        dotColor: 'bg-red-500'
      })
    },
    {
      key: 'quoteExpirations',
      title: 'Quote Expiring',
      icon: <FileText className="w-4 h-4 text-amber-500" />,
      items: quoteExpirations,
      render: (item) => ({
        title: `${item.quoteNumber || 'Quote'}`,
        subtitle: item.customer || '',
        time: getRelativeTime(item.rateValidity),
        urgencyClass: getUrgencyClass(item.rateValidity),
        dotColor: 'bg-amber-500'
      })
    },
    {
      key: 'rfqExpirations',
      title: 'RFQ Expiring',
      icon: <Ship className="w-4 h-4 text-orange-500" />,
      items: rfqExpirations,
      render: (item) => ({
        title: `RFQ ${item.rfqNumber || ''}`,
        subtitle: item.customer || '',
        time: getRelativeTime(item.validDate),
        urgencyClass: getUrgencyClass(item.validDate),
        dotColor: 'bg-orange-500'
      })
    },
    {
      key: 'rateExpirations',
      title: 'Rates Expiring',
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
      items: rateExpirations,
      render: (item) => ({
        title: `${item.rateType || ''} Rate - ${item.freightType || ''}`,
        subtitle: `${item.origin || ''} → ${item.destination || ''}`.trim(),
        time: getRelativeTime(item.validateDate),
        urgencyClass: getUrgencyClass(item.validateDate),
        dotColor: 'bg-purple-500'
      })
    },
    {
      key: 'quoteOutcomes',
      title: 'Quote Results',
      icon: <Trophy className="w-4 h-4 text-green-500" />,
      items: quoteOutcomes,
      render: (item) => ({
        title: `${item.quoteNumber || 'Quote'} — ${item.outcomeStatus === 'won' ? 'Won' : 'Lost'}`,
        subtitle: item.customer || '',
        time: getRelativeTime(item.createdDate),
        urgencyClass: item.outcomeStatus === 'won' ? 'text-green-600 font-medium' : 'text-red-600 font-medium',
        dotColor: item.outcomeStatus === 'won' ? 'bg-green-500' : 'bg-red-500'
      })
    },
    {
      key: 'newQuotes',
      title: 'New Quotes',
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      items: newQuotes,
      render: (item) => ({
        title: `${item.quoteNumber || 'Quote'} - ${item.freightCategory || ''}`,
        subtitle: item.customer || '',
        time: getRelativeTime(item.createdDate),
        urgencyClass: 'text-blue-500',
        dotColor: 'bg-blue-500'
      })
    },
    {
      key: 'newRfqs',
      title: 'New RFQs',
      icon: <Package className="w-4 h-4 text-teal-500" />,
      items: newRfqs,
      render: (item) => ({
        title: `RFQ ${item.rfqNumber || ''}`,
        subtitle: item.customer || '',
        time: getRelativeTime(item.createdAt),
        urgencyClass: 'text-teal-500',
        dotColor: 'bg-teal-500'
      })
    },
    {
      key: 'newsFeedUpdates',
      title: 'News & Updates',
      icon: <Newspaper className="w-4 h-4 text-indigo-500" />,
      items: newsFeedUpdates,
      render: (item) => ({
        title: item.caption || 'New Update',
        subtitle: '',
        time: getRelativeTime(item.createdAt),
        urgencyClass: 'text-indigo-500',
        dotColor: 'bg-indigo-500'
      })
    }
  ];

  // Filter out sections with no items
  const activeSections = sections.filter(s => s.items.length > 0);

  return (
    <div className="absolute right-0 mt-2 w-[380px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
          {totalCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[420px] overflow-y-auto">
        {activeSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <Bell className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">No notifications</p>
            <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          activeSections.map((section) => (
            <div key={section.key}>
              {/* Section Header */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                {section.icon}
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {section.title}
                </span>
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold ml-auto">
                  {section.items.length}
                </span>
              </div>

              {/* Section Items */}
              {section.items.map((item, idx) => {
                const rendered = section.render(item);
                return (
                  <div
                    key={idx}
                    className="px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-b-0"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${rendered.dotColor} mt-1.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-medium truncate">
                          {rendered.title}
                        </p>
                        {rendered.subtitle && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {rendered.subtitle}
                          </p>
                        )}
                      </div>
                      {rendered.time && (
                        <span className={`text-[11px] whitespace-nowrap flex-shrink-0 ${rendered.urgencyClass}`}>
                          {rendered.time}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {activeSections.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
          <p className="text-xs text-slate-400 text-center">
            Showing {totalCount} notification{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
