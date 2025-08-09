'use client';

import { useState, useEffect } from 'react';

interface CountdownClockProps {
  deadline: string;
  className?: string;
  variant?: 'default' | 'compact';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownClock: React.FC<CountdownClockProps> = ({ deadline, className = '', variant = 'default' }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const difference = deadlineDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  // Check if time is running low (less than 24 hours)
  const isTimeRunningLow = timeLeft.days === 0 && timeLeft.hours < 24;
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 6;

  if (isExpired) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 font-semibold">Registration Deadline Passed</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`border rounded-lg p-4 ${
        isUrgent 
          ? 'bg-red-50 border-red-200 animate-pulse' 
          : isTimeRunningLow 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      } ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className={`w-5 h-5 ${
              isUrgent ? 'text-red-600' : isTimeRunningLow ? 'text-orange-600' : 'text-blue-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm font-semibold ${
              isUrgent ? 'text-red-900' : isTimeRunningLow ? 'text-orange-900' : 'text-gray-900'
            }`}>
              {isUrgent ? 'URGENT: Registration closes in:' : isTimeRunningLow ? 'Registration closes soon:' : 'Registration closes in:'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft.days > 0 && (
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  isUrgent ? 'text-red-600' : isTimeRunningLow ? 'text-orange-600' : 'text-blue-600'
                }`}>{timeLeft.days}</div>
                <div className="text-xs text-gray-500">d</div>
              </div>
            )}
            <div className="text-center">
              <div className={`text-lg font-bold ${
                isUrgent ? 'text-red-600' : isTimeRunningLow ? 'text-orange-600' : 'text-blue-600'
              }`}>{timeLeft.hours.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500">h</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                isUrgent ? 'text-red-600' : isTimeRunningLow ? 'text-orange-600' : 'text-blue-600'
              }`}>{timeLeft.minutes.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500">m</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                isUrgent ? 'text-red-600' : isTimeRunningLow ? 'text-orange-600' : 'text-blue-600'
              }`}>{timeLeft.seconds.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500">s</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-6 ${
      isUrgent 
        ? 'bg-red-50 border-red-200' 
        : isTimeRunningLow 
          ? 'bg-orange-50 border-orange-200' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
    } ${className}`}>
      <div className="text-center mb-4">
        <h3 className={`text-lg font-bold mb-1 ${
          isUrgent ? 'text-red-900' : isTimeRunningLow ? 'text-orange-900' : 'text-gray-900'
        }`}>
          {isUrgent ? '⚠️ URGENT: Registration Deadline' : isTimeRunningLow ? '⏰ Registration Deadline' : 'Registration Deadline'}
        </h3>
        <p className="text-sm text-gray-600">Time remaining to register</p>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className={`text-2xl font-bold ${
              isUrgent ? 'text-red-600' : isTimeRunningLow ? 'text-orange-600' : 'text-blue-600'
            }`}>{timeLeft.days}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Days</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className={`text-2xl font-bold ${
              isUrgent ? 'text-red-600' : isTimeRunningLow ? 'text-orange-600' : 'text-blue-600'
            }`}>{timeLeft.hours.toString().padStart(2, '0')}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Hours</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className={`text-2xl font-bold ${
              isUrgent ? 'text-red-600' : isTimeRunningLow ? 'text-orange-600' : 'text-blue-600'
            }`}>{timeLeft.minutes.toString().padStart(2, '0')}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Minutes</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className={`text-2xl font-bold ${
              isUrgent ? 'text-red-600' : isTimeRunningLow ? 'text-orange-600' : 'text-blue-600'
            }`}>{timeLeft.seconds.toString().padStart(2, '0')}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Seconds</div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          Deadline: {new Date(deadline).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};

export default CountdownClock;
