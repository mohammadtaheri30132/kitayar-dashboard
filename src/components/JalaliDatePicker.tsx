import React, { useState, useEffect } from 'react';

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

interface JalaliDatePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export default function JalaliDatePicker({ startDate, endDate, onStartDateChange, onEndDateChange }: JalaliDatePickerProps) {
  
  // Parse '1404-07-25' format
  const parseDate = (dateStr: string) => {
    if (!dateStr) return { y: 1404, m: 1, d: 1 };
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return { y: parseInt(parts[0]), m: parseInt(parts[1]), d: parseInt(parts[2]) };
    }
    return { y: 1404, m: 1, d: 1 };
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const getTodayJalali = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'numeric', day: 'numeric', numberingSystem: 'latn' });
    const parts = formatter.formatToParts(now);
    const y = parseInt(parts.find(p => p.type === 'year')?.value || '1404');
    const m = parseInt(parts.find(p => p.type === 'month')?.value || '1');
    const d = parseInt(parts.find(p => p.type === 'day')?.value || '1');
    return { y, m, d };
  };

  const formatStr = (y: number, m: number, d: number) => {
    return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  };

  // Quick Actions
  const setToday = () => {
    const today = getTodayJalali();
    const todayStr = formatStr(today.y, today.m, today.d);
    onStartDateChange(todayStr);
    onEndDateChange(todayStr);
  };

  const setThisWeek = () => {
    const today = getTodayJalali();
    // approximate end of week by adding 6 days (not exact without jalaali lib, but acceptable for UI quick action)
    let endD = today.d + 6;
    let endM = today.m;
    let endY = today.y;
    
    if (endD > 30) {
      endD = endD - 30;
      endM += 1;
      if (endM > 12) {
        endM = 1;
        endY += 1;
      }
    }
    
    onStartDateChange(formatStr(today.y, today.m, today.d));
    onEndDateChange(formatStr(endY, endM, endD));
  };

  const setThisMonth = () => {
    const today = getTodayJalali();
    const endOfMonthDay = today.m <= 6 ? 31 : (today.m === 12 ? 29 : 30);
    onStartDateChange(formatStr(today.y, today.m, today.d));
    onEndDateChange(formatStr(today.y, today.m, endOfMonthDay));
  };

  const setNextMonth = () => {
    const today = getTodayJalali();
    let nextM = today.m + 1;
    let nextY = today.y;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    const endOfMonthDay = nextM <= 6 ? 31 : (nextM === 12 ? 29 : 30);
    onStartDateChange(formatStr(today.y, today.m, today.d));
    onEndDateChange(formatStr(nextY, nextM, endOfMonthDay));
  };

  const updateStart = (y: number, m: number, d: number) => onStartDateChange(formatStr(y, m, d));
  const updateEnd = (y: number, m: number, d: number) => onEndDateChange(formatStr(y, m, d));

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 mb-4 md:col-span-2">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        {/* Start Date */}
        <div className="flex-1">
          <label className="block text-sm text-gray-300 mb-2">تاریخ شروع</label>
          <div className="flex gap-2">
            <select value={start.d} onChange={e => updateStart(start.y, start.m, parseInt(e.target.value))} className="bg-gray-800 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 outline-none">
              {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select value={start.m} onChange={e => updateStart(start.y, parseInt(e.target.value), start.d)} className="bg-gray-800 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 outline-none">
              {PERSIAN_MONTHS.map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <select value={start.y} onChange={e => updateStart(parseInt(e.target.value), start.m, start.d)} className="bg-gray-800 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 outline-none">
              {[1404, 1405, 1406, 1407, 1408, 1409].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* End Date */}
        <div className="flex-1">
          <label className="block text-sm text-gray-300 mb-2">تاریخ پایان</label>
          <div className="flex gap-2">
            <select value={end.d} onChange={e => updateEnd(end.y, end.m, parseInt(e.target.value))} className="bg-gray-800 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 outline-none">
              {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select value={end.m} onChange={e => updateEnd(end.y, parseInt(e.target.value), end.d)} className="bg-gray-800 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 outline-none">
              {PERSIAN_MONTHS.map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <select value={end.y} onChange={e => updateEnd(parseInt(e.target.value), end.m, end.d)} className="bg-gray-800 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 outline-none">
              {[1404, 1405, 1406, 1407, 1408, 1409].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mt-2">
        <button type="button" onClick={setToday} className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-3 py-1.5 rounded transition-colors border border-blue-600/30">
          امروز
        </button>
        <button type="button" onClick={setThisWeek} className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-3 py-1.5 rounded transition-colors border border-blue-600/30">
          تا هفته بعد
        </button>
        <button type="button" onClick={setThisMonth} className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-3 py-1.5 rounded transition-colors border border-blue-600/30">
          تا آخر ماه
        </button>
        <button type="button" onClick={setNextMonth} className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-3 py-1.5 rounded transition-colors border border-blue-600/30">
          تا ماه بعد
        </button>
      </div>
    </div>
  );
}
