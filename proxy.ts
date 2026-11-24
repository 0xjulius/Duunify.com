import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/middleware";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/applications",
  "/calendar",
  "/favorites",
  "/settings",
  "/history",
  "/logout",
  "/job-assistant"
];

const ADMIN_ONLY_PREFIXES = [
  "/admin"
];

export async function proxy(request: NextRequest) {
  // 🚀 KEHITYSYMPÄRISTÖN OHITUS:
  // Sallitaan kaikkien sivujen käyttö lokaalisti
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const {
    response: sessionResponse,
    user,
    supabase,
  } = await updateSession(request);

  let profile = null;

  // 1. Jos käyttäjä on kirjautunut,
  // haetaan rooli ja bännitiedot yhdellä kyselyllä
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("is_banned, role")
      .eq("id", user.id)
      .single();

    profile = data;

    // 2. Jos käyttäjä on bännätty,
    // ohjataan porttikieltosivulle
    if (
      profile?.is_banned &&
      request.nextUrl.pathname !== "/banned"
    ) {
      return NextResponse.redirect(
        new URL("/banned", request.url)
      );
    }
  }

  // 3. Tarkistetaan tavalliset suojatut reitit
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  // 4. Tarkistetaan admin-only-reitit
  const isAdminRoute = ADMIN_ONLY_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  // 5. Suojatut sivut vaativat kirjautumisen
  if ((isProtected || isAdminRoute) && !user) {
    const redirectUrl = new URL("/", request.url);

    redirectUrl.searchParams.set(
      "next",
      request.nextUrl.pathname
    );

    const redirectResponse = NextResponse.redirect(
      redirectUrl
    );

    
    // Säilytetään session evästeet
    sessionResponse.cookies.getAll().forEach((cookie) => {
      const { name, value, ...options } = cookie;

      redirectResponse.cookies.set(
        name,
        value,
        options
      );
    });

    return redirectResponse;
  }

  // 6. Admin-only-reitit vaativat admin-roolin
  //
  // Tämä koskee:
  // /admin
  // /admin/...
  // /job-assistant
  // /job-assistant/...
  if (isAdminRoute && user) {
    if (profile?.role !== "admin") {
      const dashboardRedirect = NextResponse.redirect(
        new URL("/dashboard", request.url)
      );

      // Säilytetään session evästeet
      sessionResponse.cookies.getAll().forEach((cookie) => {
        const { name, value, ...options } = cookie;

        dashboardRedirect.cookies.set(
          name,
          value,
          options
        );
      });

      return dashboardRedirect;
    }
  }

  // 7. Kaikki muut pyynnöt jatkavat normaalisti
  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};