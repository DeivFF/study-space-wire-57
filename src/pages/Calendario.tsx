import { useState, useEffect } from 'react';
import { ExportToolbar } from '../components/Calendar/export-toolbar';
import { SubjectsPanel } from '../components/Calendar/subjects-panel';
import { TasksPanel } from '../components/Calendar/tasks-panel';
import { AvailabilityPanel } from '../components/Calendar/availability-panel';
import { StatsPanel } from '../components/Calendar/stats-panel';
import { CalendarGrid } from '../components/Calendar/calendar-grid';
import { AgendaPanel } from '../components/Calendar/agenda-panel';
import { SessionModal } from '../components/Calendar/session-modal';
import { TimerWidget } from '../components/Calendar/timer-widget';
import { useStudyStore, Session, initializeSampleData } from '../lib/calendar-store';

export default function Calendario() {
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [timerSession, setTimerSession] = useState<Session | null>(null);

  useEffect(() => {
    initializeSampleData();
  }, []);

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionModalOpen(true);
  };

  const handleStartTimer = (session: Session) => {
    setTimerSession(session);
  };

  const handleSessionSaved = () => {
    setEditingSession(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <ExportToolbar />
      
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar */}
          <aside className="space-y-4">
            <SubjectsPanel />
            <TasksPanel />
            <AvailabilityPanel />
            <StatsPanel />
          </aside>

          {/* Main Content */}
          <div className="space-y-4">
            <CalendarGrid />
            <AgendaPanel 
              onEditSession={handleEditSession}
              onStartTimer={handleStartTimer}
            />
          </div>
        </div>
      </main>

      <SessionModal
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        session={editingSession}
        onSessionSaved={handleSessionSaved}
      />

      <TimerWidget
        session={timerSession}
        onClose={() => setTimerSession(null)}
      />
    </div>
  );
}