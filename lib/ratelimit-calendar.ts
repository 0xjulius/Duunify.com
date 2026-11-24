import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// HUOM: jos nykyinen lib/ratelimit.ts luo Redis-yhteyden eri ympäristömuuttujilla
// (esim. KV_REST_API_URL / KV_REST_API_TOKEN), kopioi sama Redis-alustus tähän.
const redis = Redis.fromEnv();

/**
 * Rajoitus IP-osoitteen mukaan. Ajetaan ennen tietokantakyselyjä,
 * joten tokenien arvailu ja pyyntötulvat pysähtyvät ennen Supabasea.
 */
export const ipLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "10 m"),
  prefix: "ratelimit:calendar-feed:ip",
});

/**
 * Rajoitus tokenin mukaan (vain kelvollisille tokeneille).
 * Normaali iPhone hakee kalenterin korkeintaan muutaman kerran tunnissa.
 */
export const tokenLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 m"),
  prefix: "ratelimit:calendar-feed:token",
});