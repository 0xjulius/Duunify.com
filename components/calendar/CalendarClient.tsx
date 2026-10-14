"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import CalendarView from "@/components/calendar/CalendarView";
import QuickEvents from "@/components/calendar/QuickEvents";
import AddEventModal from "@/components/calendar/AddEventModal";
import EventDetailModal from "@/components/calendar/EventDetailModal";
import MiniCalendar from "@/components/calendar/MiniCalendar";
import {
  ApplicationLite,
  UnifiedEvent,
  buildUnifiedEvents,
  fetchCalendarEvents,
  deleteCalendarEvent,
  toggleCalendarEventCompleted,
} from "@/lib/calendar";

export default function CalendarClient({
  initialApplications,
}: {
  initialApplications: ApplicationLite[];
}) {
  const [applications] = useState<ApplicationLite[]>(initialApplications);
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  const [focusDate, setFocusDate] = useState<Date | null>(null);

  async function loadEvents() {
    const custom = await fetchCalendarEvents();
    setEvents(buildUnifiedEvents(applications, custom));
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    const { error } = await deleteCalendarEvent(id);
    if (error) {
      toast.error("Poisto epäonnistui.");
      return;
    }
    toast.success("Tapahtuma poistettu.");
    setSelectedEvent(null);
    loadEvents();
  }

  async function handleToggleCompleted(id: string, completed: boolean) {
    const { error } = await toggleCalendarEventCompleted(id, completed);
    if (error) {
      toast.error("Päivitys epäonnistui.");
      return;
    }
    toast.success(completed ? "Merkitty valmiiksi." : "Merkitty kesken.");
    loadEvents();

    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent({ ...selectedEvent, completed });
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      {/* Toimintopalkki */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-2xl transition-all shadow-sm shadow-indigo-600/25 cursor-pointer"
        >
          + Lisää tapahtuma
        </button>
      </div>

      {/* PÄÄASSETTELU */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* VASEN REUNA / YLÄOSA: Pääkalenteri */}
        <div className="w-full lg:flex-1 bg-white dark:bg-[#131622] p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors">
          <CalendarView
            events={events}
            onSelectEvent={(event: UnifiedEvent) => setSelectedEvent(event)}
            focusDate={focusDate}
          />
        </div>

        {/* OIKEA REUNA / ALAOSA: Tulevat tapahtumat & Apukalenterit */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Minikalenteri */}
          <div className="hidden lg:block bg-white dark:bg-[#131622] p-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
            <MiniCalendar
              events={events}
              onSelectDate={(date: Date) => setFocusDate(date)}
            />
          </div>

          {/* Tulevat tapahtumat -lista */}
          <div className="bg-white dark:bg-[#131622] p-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm w-full transition-colors">
            <QuickEvents
              events={events}
              onSelectEvent={(event: UnifiedEvent) => setSelectedEvent(event)}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      {/* MODALIKOMPONENTIT */}
      <AddEventModal
        open={showAdd}
        onOpenChange={setShowAdd}
        applications={applications}
        onSuccess={() => {
          loadEvents();
        }}
      />

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(open: boolean) => !open && setSelectedEvent(null)}
          onDelete={handleDelete}
          onToggleCompleted={handleToggleCompleted}
        />
      )}
    </div>
  );
}