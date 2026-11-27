import {
  Sparkles,
  Wrench,
  Bug,
  ShieldCheck,
  Zap,
} from "lucide-react";

export type ChangelogType =
  | "feature"
  | "improvement"
  | "fix"
  | "security"
  | "performance";

export interface ChangelogEntry {
  version: string;
  date: string;
  type: ChangelogType;
  title: string;
  description: string;
}

export const changelog: ChangelogEntry[] = [
  {
    version: "v1.9.0",
    date: "27.11.2026",
    type: "improvement",
    title: "Sujuva yläpalkki ja tallennettujen paikkojen hallinta",
    description:
      "Yläpalkin piilotus selatessa keskitettiin yhteen komponenttiin, tallennettujen työpaikkojen arkistointiin lisättiin animoitu vahvistusikkuna sekä selkeät toast-ilmoitukset arkistoinnista ja palautuksesta.",
  },
  {
    version: "v1.8.0",
    date: "14.11.2026",
    type: "feature",
    title: "Reaaliaikaiset ilmoitukset yläpalkissa",
    description:
      "Lisättiin yläpalkin ilmoitusvalikko ja erillinen tarkastelumodaali, jotka päivittyvät reaaliaikaisesti ilman sivun uudelleenlatausta ja tukevat lukemattomien ilmoitusten hallintaa.",
  },
  {
    version: "v1.7.0",
    date: "28.10.2026",
    type: "feature",
    title: "Kalenteritilaus suoraan puhelimeen (ICS-syöte)",
    description:
      "Voit nyt tilata työhaastattelut, umpeutuvat hakuajat ja muistutukset automaattisesti päivittyvänä ICS-kalenterisyötteenä suoraan Apple-, Google- tai Outlook-kalenteriisi.",
  },
  {
    version: "v1.6.0",
    date: "10.10.2026",
    type: "security",
    title: "Henkilötietojen automaattinen anonymisointi tekoälylle",
    description:
      "Tekoälyavustaja poistaa nyt tekstistä tunnistettavat henkilötiedot, kuten sähköpostin, puhelinnumeron, osoitteen ja henkilötunnuksen, ennen saatekirjeen muodostamista.",
  },
  {
    version: "v1.5.0",
    date: "20.9.2026",
    type: "feature",
    title: "Tekoälypohjainen työnhakuavustaja",
    description:
      "Luo kohdennettuja saatekirjeitä tallennettujen työpaikkailmoitusten ja oman pohjasaatekirjeesi perusteella säilyttäen todellisen työkokemuksesi ja vahvuutesi.",
  },
  {
    version: "v1.4.2",
    date: "2.9.2026",
    type: "performance",
    title: "Nopeampi työpaikkailmoitusten tuonti ja hakukoneoptimointi",
    description:
      "Parannettiin URL-tuonnin rakenteistetun datan (JSON-LD) tunnistusta sekä lisättiin dynaaminen sivukartta, robots-ohjaus ja hakukoneiden metatiedot.",
  },
  {
    version: "v1.4.0",
    date: "15.8.2026",
    type: "feature",
    title: "Kirjautumaton demo-ympäristö",
    description:
      "Palvelun ominaisuuksiin voi nyt tutustua suoraan ilman rekisteröitymistä valmiilla esimerkkidatalla toimivassa demo-tilassa.",
  },
  {
    version: "v1.3.5",
    date: "29.7.2026",
    type: "security",
    title: "Ylläpitonäkymät ja tietoturvaparannukset",
    description:
      "Lisättiin roolipohjainen pääsynhallinta, toimintalokit sekä tilapäisen ja pysyvän käyttäjäeston hallinta palvelinpuolen suojauksilla.",
  },
  {
    version: "v1.3.0",
    date: "13.7.2026",
    type: "feature",
    title: "Työnhakuindeksi",
    description:
      "Lisättiin uusi työnhakuindeksi, joka kertoo työnhakusi tehokkuuden vertaamalla aktiivisia hakemuksia hylkäyksiin.",
  },
  {
    version: "v1.2.0",
    date: "12.7.2026",
    type: "improvement",
    title: "Parempi mobiilikokemus",
    description:
      "Info-painikkeet toimivat nyt dialogina mobiilissa ja käyttöliittymää parannettiin pienillä näytöillä.",
  },
  {
    version: "v1.1.0",
    date: "10.7.2026",
    type: "fix",
    title: "Dashboard-korjaukset",
    description:
      "Korjattiin aktiivisuusmittari sekä useita käyttöliittymävirheitä.",
  },
];

export const changelogBadges = {
  feature: {
    icon: Sparkles,
    text: "Uusi ominaisuus",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  improvement: {
    icon: Wrench,
    text: "Parannus",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  fix: {
    icon: Bug,
    text: "Bugikorjaus",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  security: {
    icon: ShieldCheck,
    text: "Tietoturva",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  performance: {
    icon: Zap,
    text: "Suorituskyky",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
};