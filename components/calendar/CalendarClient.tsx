"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import CalendarView from "@/components/calendar/CalendarView";
import QuickEvents from "@/components/calendar/QuickEvents";
import AddEventModal from "@/components/calendar/AddEventModal";
import ApplicationDialog from "@/app/applications/ApplicationDialog";
import MiniCalendar from "@/components/calendar/MiniCalendar";
import {
  ApplicationLite,
  UnifiedEvent,
  buildUnifiedEvents,
  fetchCalendarEvents,
  deleteCalendarEvent,
} from "@/lib/calendar";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";

function findMatchingApplication(
  event: UnifiedEvent,
  applications: ApplicationLite[],
): ApplicationLite | null {
  const anyEvent = event as any;
  const linkedId = anyEvent.applicationId ?? anyEvent.application_id;

  if (linkedId) {
    const byId = applications.find((a) => a.id === linkedId);
    if (byId) return byId;
  }

  if (event.id.startsWith("deadline-")) {
    const appId = event.id.replace(/^deadline-/, "");
    const byDeadlineId = applications.find((a) => a.id === appId);
    if (byDeadlineId) return byDeadlineId;
  }

  if (event.subtitle) {
    const normalizedSubtitle = event.subtitle.toLowerCase();
    const byTitleOrCompany = applications.find(
      (a) =>
        (a.company && normalizedSubtitle.includes(a.company.toLowerCase())) ||
        (a.job_title && normalizedSubtitle.includes(a.job_title.toLowerCase())),
    );
    if (byTitleOrCompany) return byTitleOrCompany;
  }

  return null;
}

export default function CalendarClient({
  initialApplications,
}: {
  initialApplications: ApplicationLite[];
}) {
  const [applications, setApplications] =
    useState<ApplicationLite[]>(initialApplications);
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingApp, setLoadingApp] = useState(false);
  const [focusDate, setFocusDate] = useState<Date | null>(null);

  async function loadEvents() {
    const custom = await fetchCalendarEvents();
    setEvents(buildUnifiedEvents(applications, custom));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function fetchFullApplication(appId: string) {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("id", appId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async function handleSelectEvent(event: UnifiedEvent) {
    if (loadingApp) return;

    const matchedApp = findMatchingApplication(event, applications);
    if (!matchedApp) {
      toast.info("Tähän kalenteritapahtumaan ei ole liitetty hakemusta.");
      return;
    }

    setLoadingApp(true);
    try {
      const fullApp = await fetchFullApplication(matchedApp.id);
      setSelectedApp(fullApp ?? matchedApp);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Virhe hakemuksen tietojen latauksessa:", error);
      setSelectedApp(matchedApp);
      setIsDialogOpen(true);
    } finally {
      setLoadingApp(false);
    }
  }

  async function handleDialogUpdate() {
    if (selectedApp?.id) {
      try {
        const refreshedApp = await fetchFullApplication(selectedApp.id);
        if (refreshedApp) {
          setSelectedApp(refreshedApp);
          setApplications((prev) =>
            prev.map((item) =>
              item.id === refreshedApp.id ? { ...item, ...refreshedApp } : item,
            ),
          );
        }
      } catch (error) {
        console.error("Virhe päivitetyn hakemuksen latauksessa:", error);
      }
    }
    await loadEvents();
  }

  async function handleDelete(id: string) {
    const { error } = await deleteCalendarEvent(id);
    if (error) {
      toast.error("Poisto epäonnistui.");
      return;
    }
    toast.success("Tapahtuma poistettu.");
    loadEvents();
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <CalendarToolbar events={events} onAdd={() => setShowAdd(true)} />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:flex-1 bg-white dark:bg-[#131622] p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors">
          <CalendarView
            events={events}
            onSelectEvent={handleSelectEvent}
            focusDate={focusDate}
          />
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="hidden lg:block bg-white dark:bg-[#131622] p-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
            <MiniCalendar
              events={events}
              onSelectDate={(date: Date) => setFocusDate(date)}
            />
          </div>

          <div className="bg-white dark:bg-[#131622] p-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm w-full transition-colors">
            <QuickEvents
              events={events}
              onSelectEvent={handleSelectEvent}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      <AddEventModal
        open={showAdd}
        onOpenChange={setShowAdd}
        applications={applications}
        onSuccess={() => {
          loadEvents();
        }}
      />

      <ApplicationDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedApp(null);
        }}
        app={selectedApp}
        onUpdate={handleDialogUpdate}
      />
    </div>
  );
}