# Duunify

**Duunify** on suomalaisille työnhakijoille suunnattu moderni työhakemusten hallinta- ja tekoälyavustuspalvelu. Se korvaa hajanaiset Excel-taulukot ja muistiot yhdellä helppokäyttöisellä alustalla, josta näkee koko hakuprosessin: mitä on haettu, missä vaiheessa kukin hakemus on, milloin haastattelut ja hakuajat ovat, ja miten hakeminen edistyy ajan myötä.

Duunify ei ainoastaan seuraa työn hakemista, vaan auttaa myös **tekemään sitä** — automatisoimalla toistuvia työvaiheita, tuottamalla kohdennettuja saatekirjeitä tekoälyn avulla ja muistuttamalla tärkeistä määräajoista.

---

## Ominaisuudet

- **Automaattinen tietojen täyttö** — Liitä työpaikkailmoituksen linkki (Duunitori, Työmarkkinatori, Jobly jne.), ja järjestelmä poimii yrityksen, tehtävänimikkeen, palkan, sijainnin ja kuvaustiedot automaattisesti JSON-LD- ja HTML-jäsennyksen avulla.
- **Tekoälypohjainen Työnhakuavustaja (AI Cover Letters)** — Generoi hakemaasi tehtävään ja omalle taustallesi räätälöityjä saatekirjeitä Google Gemini -tekoälymallilla.
- **AI-kreditjärjestelmä & Onboarding** — Uusille käyttäjille tarjotaan **5 ilmaisilmaista tekoälykredittiä** heti rekisteröitymisen yhteydessä (`WelcomeModal`). Lisäkrediittejä voi ostaa helposti integroidun maksunäkymän kautta.
- **Tietosuoja & Anonymisointi** — Ennen tekoälykäsittelyä teksteistä suodatetaan automaattisesti pois henkilötunnukset, sähköpostit, puhelinnumerot ja katuosoitteet (`lib/anonymize.ts`).
- **Hakemusten hallinta** — Koko hakuprosessin tilaseuranta (Haettu / Haastattelu / Tarjous / Hylätty / Tallennettu), muistiinpanot, hakemushistoria ja CV/liitetiedostot.
- **Älykäs kalenteri** — Haastattelut, hakuaikojen päättymiset ja omat muistutukset samassa näkymässä. Tapahtumia voi selata kuukausi- tai viikkonäkymällä sekä kompaktilla minikalenterilla.
- **Dashboard ja analytiikka** — Hakemustrendit, statusjakaumat, karttanäkymä sijainneista, GitHub-tyylinen aktiivisuusruudukko sekä tulkitsevat mittarit työnhaun edistymisestä.
- **Toimintaloki (History)** — Automaattinen aikajana kaikista tapahtumista (hakemuksen luonti, tilamuutokset, kalenterimerkinnät jne.), suodatettavissa ja vietävissä CSV-muodossa.
- **Suosikit** — Mielenkiintoisten työpaikkojen tallentaminen myöhempää hakemista ja analysointia varten.
- **Suojattu yhteydenottolomake** — Yhteydenotot tallentuvat tietokantaan ja reitittyvät sähköpostitse varmennetulta `duunify.com`-domainilta. Lomailevat bottiverkot estetään **Upstash Rate Limiting** -suojauksella ja piilotetulla honeypot-kentällä.
- **Admin-paneeli & Bännijärjestelmä** — Hallintanäkymä käyttäjien, lokien ja hakemusten valvontaan, roolipohjaisella pääsynhallinnalla (RBAC) sekä käyttäjien estotoiminnoilla (`proxy.ts`).
- **Demo-tila** — Kirjautumista vaatimaton esikatselu mock-datalla ja suomalaisten yritysten logoilla.

---

## Teknologiat

| Osa-alue | Teknologia |
|---|---|
| **Framework** | Next.js (App Router) |
| **Kieli** | TypeScript |
| **Tyylit & Animaatiot** | Tailwind CSS, Framer Motion |
| **Tietokanta & Auth** | Supabase (Postgres, Row Level Security, Auth, Storage) |
| **Tekoäly (AI)** | Google Gemini API |
| **Maksut** | Stripe |
| **Sähköposti** | Resend (Verifioitu `duunify.com` domain) |
| **Rate Limiting** | Upstash Redis |
| **Kaaviot** | Recharts |
| **Kalenteri** | react-big-calendar |
| **Ilmoitukset (Toast)** | Sonner |
| **Web-scraping** | Cheerio |
| **Deployment** | Vercel |

## Projektin rakenne

```
duunify/
├── .env.local
├── .gitignore
├── app
│   ├── admin
│   │   ├── applications
│   │   ├── layout.tsx
│   │   ├── logs
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   └── users
│   │       └── page.tsx
│   ├── api
│   │   ├── admin
│   │   │   └── users
│   │   │       └── [id]
│   │   │           ├── ban
│   │   │           │   └── route.ts
│   │   │           ├── confirm
│   │   │           │   └── route.ts
│   │   │           └── route.ts
│   │   ├── contact
│   │   │   └── route.ts
│   │   ├── cron
│   │   │   └── route.ts
│   │   ├── generate-cover-letter
│   │   │   └── route.ts
│   │   ├── parse-job
│   │   │   └── route.ts
│   │   ├── ping
│   │   │   └── route.ts
│   │   └── webhooks
│   │       └── new-user
│   │           └── route.ts
│   ├── applications
│   │   ├── AddApplicationForm.tsx
│   │   ├── ApplicationCard.tsx
│   │   ├── ApplicationDialog.tsx
│   │   ├── page.tsx
│   │   └── [id]
│   ├── auth
│   │   └── callback
│   │       └── route.ts
│   ├── banned
│   │   └── page.tsx
│   ├── calendar
│   │   └── page.tsx
│   ├── changelog
│   │   └── page.tsx
│   ├── contact
│   │   └── page.tsx
│   ├── dashboard
│   │   └── page.tsx
│   ├── demo
│   │   ├── applications
│   │   │   └── page.tsx
│   │   ├── calendar
│   │   │   └── page.tsx
│   │   ├── demosettings
│   │   │   └── page.tsx
│   │   ├── favorites
│   │   │   └── page.tsx
│   │   ├── history
│   │   │   └── page.tsx
│   │   ├── job-assistant
│   │   │   ├── page.tsx
│   │   │   └── [id]
│   │   │       ├── page.tsx
│   │   │       └── result
│   │   │           └── page.tsx
│   │   └── page.tsx
│   ├── error.tsx
│   ├── favicon.ico
│   ├── favorites
│   │   └── page.tsx
│   ├── globals.css
│   ├── history
│   │   └── page.tsx
│   ├── job-assistant
│   │   ├── cover-letters
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   └── [id]
│   │       ├── generate
│   │       │   └── page.tsx
│   │       ├── page.tsx
│   │       └── result
│   │           └── page.tsx
│   ├── layout.tsx
│   ├── login
│   │   ├── actions.ts
│   │   └── page.tsx
│   ├── logout
│   │   └── page.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   ├── privacy
│   │   └── page.tsx
│   ├── settings
│   │   └── page.tsx
│   └── tos
│       └── page.tsx
├── components
│   ├── Admin
│   │   ├── AdminSidebar.tsx
│   │   ├── LogDetailModal.tsx
│   │   ├── UserDetailsModal.tsx
│   │   └── UsersTable.tsx
│   ├── AdminCard.tsx
│   ├── AiCreditsBadge.tsx
│   ├── applications
│   │   ├── AddAttachment.tsx
│   │   ├── ApplicationHistory.tsx
│   │   ├── ApplicationRow.tsx
│   │   ├── ApplicationStats.tsx
│   │   ├── CompanyLogo.tsx
│   │   └── QuickAddApplication.tsx
│   ├── calendar
│   │   ├── AddEventModal.tsx
│   │   ├── CalendarClient.tsx
│   │   ├── CalendarView.tsx
│   │   ├── EventDetailModal.tsx
│   │   ├── MiniCalendar.tsx
│   │   └── QuickEvents.tsx
│   ├── dashboard
│   │   ├── ActivityHeatmap.tsx
│   │   ├── ApplicationChart.tsx
│   │   ├── ApplicationTrendChart.tsx
│   │   ├── ConsistencyCard.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── GhostedCard.tsx
│   │   ├── ImpactRatingCard.tsx
│   │   ├── LocationsChart.tsx
│   │   ├── MapComponent.tsx
│   │   ├── RecentApplications.tsx
│   │   ├── StatsCard.tsx
│   │   └── UpcomingDeadlines.tsx
│   ├── demo
│   │   ├── DemoBanner.tsx
│   │   ├── DemoCompanyLogo.tsx
│   │   ├── DemoHeader.tsx
│   │   ├── DemoNotificationsDropdown.tsx
│   │   └── DemoSidebar.tsx
│   ├── DownloadButton.tsx
│   ├── favorites
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── history
│   │   └── HistoryClient.tsx
│   ├── job-assistant
│   │   ├── id
│   │   │   ├── DocumentItem.tsx
│   │   │   ├── InfoSidebar.tsx
│   │   │   ├── JobDescriptionCard.tsx
│   │   │   ├── JobHeader.tsx
│   │   │   ├── result
│   │   │   │   ├── CoverLetterCard.tsx
│   │   │   │   ├── CoverLetterSkeleton.tsx
│   │   │   │   ├── DocumentHeader.tsx
│   │   │   │   ├── ResultHeader.tsx
│   │   │   │   └── ResultSidebar.tsx
│   │   │   └── UserDocumentsCard.tsx
│   │   ├── JobAssistantHeader.tsx
│   │   ├── JobCard.tsx
│   │   ├── JobList.tsx
│   │   └── StepIndicator.tsx
│   ├── LandingIndexCard.tsx
│   ├── local-date.tsx
│   ├── LoginModal.tsx
│   ├── logout
│   │   ├── LogoutConfirmModal.tsx
│   │   └── ModalProvider.tsx
│   ├── NavBar.tsx
│   ├── NavBarWait.tsx
│   ├── NotificationsDropdown.tsx
│   ├── PageHeader.tsx
│   ├── settings
│   │   ├── AvatarUpload.tsx
│   │   ├── PasswordChangeForm.tsx
│   │   ├── ProfileDetailsForm.tsx
│   │   └── SettingsClient.tsx
│   ├── Sidebar.tsx
│   ├── SimpleNav.tsx
│   ├── theme-provider.tsx
│   ├── ui
│   │   ├── AppToaster.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── chart.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── skeletons.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── TimerComponent.tsx
│   │   └── tooltip.tsx
│   ├── WaitlistSignup.tsx
│   └── WelcomeModal.tsx
├── components.json
├── eslint.config.mjs
├── lib
│   ├── anonymize.ts
│   ├── applications.tsx
│   ├── auth-errors.ts
│   ├── calendar.ts
│   ├── changelog.ts
│   ├── demo-data.ts
│   ├── export-csv.ts
│   ├── history.ts
│   ├── logger.ts
│   ├── middleware.ts
│   ├── ratelimit.ts
│   ├── supabase-admin.ts
│   ├── supabase-server.ts
│   ├── supabase.ts
│   └── utils.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── proxy.ts
├── public
│   ├── demo-logos
│   │   ├── dna.png
│   │   ├── elisa.png
│   │   ├── fiskars.png
│   │   ├── fortum.png
│   │   ├── futurice.webp
│   │   ├── gofore.webp
│   │   ├── kone.png
│   │   ├── kone.webp
│   │   ├── neste.png
│   │   ├── nixu.webp
│   │   ├── nordea.png
│   │   ├── opryhma.png
│   │   ├── reaktor.png
│   │   ├── relex.png
│   │   ├── relex.webp
│   │   ├── relexsolutions.png
│   │   ├── sok.png
│   │   ├── supercell.jpg
│   │   ├── supercell.png
│   │   ├── telia.png
│   │   ├── varma.png
│   │   ├── vincit.png
│   │   ├── vr.jpg
│   │   └── wolt.png
│   ├── fi.svg
│   ├── file.svg
│   ├── globe.svg
│   ├── login-bg.png
│   ├── next.svg
│   ├── og-image.png
│   ├── vercel.svg
│   └── window.svg
├── README.md
├── tsconfig.json
└── vercel.json
```

### Arkkitehtuuriratkaisut ja tekniset valinnat

- **Row Level Security kaikissa tauluissa** — jokainen taulu (`applications`, `calendar_events`, `application_history`, `profiles`, `deleted_applications_log`, `contact_messages`) rajaa datan käyttäjäkohtaisesti tietokantatasolla, ei vain sovelluslogiikassa.
- **AI-kreditjärjestelmän tietokantatuki** — käyttäjien tekoälykreditit (esim. ilmaiset 5 kredittiä rekisteröitymisen yhteydessä) ja niiden kulutus on integroitu tietokantatasolle, ja maksutapahtumat välittyvät turvallisesti Stripe-integraation kautta.
- **Tietosuojan esikäsittely (Anonymisointi)** — ennen kuin käyttäjän tekstejä lähetetään Google Gemini -tekoälylle saatekirjeiden generointia varten, `lib/anonymize.ts` suodattaa automaattisesti pois henkilötunnukset, sähköpostit, puhelinnumerot ja osoitteet.
- **Julkisen profiilin bännisynkronointi** — käyttäjän porttikielto (`is_banned`, `banned_until`) tallennetaan suoraan `profiles`-tauluun, jotta tieto on helposti luettavissa käyttöliittymän taulukoissa ja sivunvaihdon yhteydessä.
- **Vankka sovellustason porttikieltosuojaus** — `proxy.ts` (middleware) tarkistaa jokaisen pyynnön yhteydessä tietokannasta, onko kirjautunut käyttäjä estetty. Jos bänni on voimassa, käyttäjä ohjataan välittömästi `/banned`-porttikieltosivulle eikä sivun latausta tai API-kutsuja suoriteta.
- **Turvallinen kirjautumisvirta** — `loginAction` suorittaa bännitarkistuksen välittömästi onnistuneen kirjautumisen jälkeen. Jos käyttäjän profiili on estetty, istunto tyhjennetään heti (`signOut`) ja hänet ohjataan bännisivulle ilman, että ulkopuolisille paljastetaan bännin olemassaoloa ennen oikean salasanan syöttämistä.
- **Erillinen poistoloki** — koska `application_history` on sidottu `applications`-tauluun `cascade`-relaatiolla, poistotapahtumat eivät voisi säilyä samassa taulussa. `deleted_applications_log` on tarkoituksella irrallinen taulu, joka säilyy vaikka itse hakemus poistetaan.
- **Yhteydenottolomakkeen tietoturva** — yhteydenotot suojataan Upstash Rate Limiting -spämminestolla, piilotetulla honeypot-kentällä sekä kahden kerroksen varmistuksella (tallennus Supabaseen ja sähköpostin lähetys verifioidulta `duunify.com`-domainilta Resendin kautta).
- **Server- ja client-Supabase-clientit eriytetty** — `lib/supabase.ts` selaimelle (cookie-pohjainen istunto), `lib/supabase-server.ts` palvelinkomponenteille, `lib/supabase-admin.ts` service role -operaatioille (esim. käyttäjän poisto), jota ei koskaan altisteta selaimelle.
- **Middleware suojaa reitit ennen renderöintiä** — sekä tavalliset suojatut reitit että admin-reitit tarkistetaan `middleware.ts`-tiedostossa, jolloin kirjautumaton tai oikeudeton käyttäjä ei koskaan näe edes vilaustakaan suojatusta sisällöstä.
- **Propseihin perustuva demo/tuotanto-jako** — dashboard-komponentit (esim. `LocationsCard`, `ApplicationsChart`) ottavat valinnaisen `demoData`-propin: jos se annetaan, komponentti käyttää sitä eikä kutsu Supabasea ollenkaan. Sama komponentti palvelee sekä oikeaa sovellusta että kirjautumatonta demoa.

### Kieli
Käyttöliittymä on kokonaan suomeksi, kohdeyleisönä suomalaiset työnhakijat ja suomalaiset työpaikkailmoitussivustot.
