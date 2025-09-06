import { Calendar, Braces, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudyStore } from '@/lib/calendar-store';
import { downloadFile, addMinutes } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function ExportToolbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { subjects, sessions } = useStudyStore();

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const exportJSON = () => {
    const data = { subjects, sessions, exportedAt: new Date().toISOString() };
    downloadFile('calendario-estudos.json', JSON.stringify(data, null, 2), 'application/json');
  };

  const exportCSV = () => {
    const headers = ['id', 'subject', 'title', 'date', 'start', 'durationMin', 'status', 'pomos', 'tags'];
    const rows = sessions.map(s => {
      const subject = subjects.find(subj => subj.id === s.subjectId)?.name || '';
      return [
        s.id,
        `"${subject.replace(/"/g, '""')}"`,
        `"${(s.title || '').replace(/"/g, '""')}"`,
        s.date,
        s.start,
        s.durationMin,
        s.status,
        s.pomos || 0,
        (s.tags || []).join(' ')
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile('calendario-estudos.csv', csv, 'text/csv;charset=utf-8');
  };

  const exportICS = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudyCalendar//pt-BR//'
    ];

    sessions.forEach(s => {
      const startDateTime = s.date.replace(/-/g, '') + 'T' + s.start.replace(':', '') + '00';
      const endTime = addMinutes(s.start, s.durationMin).replace(':', '') + '00';
      const endDateTime = s.date.replace(/-/g, '') + 'T' + endTime;
      const subject = subjects.find(subj => subj.id === s.subjectId)?.name || 'Estudo';

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${s.id}`);
      lines.push(`DTSTAMP:${startDateTime}Z`);
      lines.push(`DTSTART:${startDateTime}Z`);
      lines.push(`DTEND:${endDateTime}Z`);
      lines.push(`SUMMARY:${subject}: ${s.title}`);
      if (s.tags?.length) {
        lines.push(`CATEGORIES:${s.tags.map(t => t.replace('#', '')).join(',')}`);
      }
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    downloadFile('calendario-estudos.ics', lines.join('\n'), 'text/calendar');
  };

  return (
    <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between p-3">

        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={exportICS}>
            <Calendar className="h-4 w-4 mr-2" />
            Exportar .ics
          </Button>
          <Button variant="outline" size="sm" onClick={exportJSON}>
            <Braces className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>
    </header>
  );
}