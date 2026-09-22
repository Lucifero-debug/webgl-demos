"use client";

import { useEffect, useState } from "react";

/*
  Live clock helpers, for local times and opening hours that are correct
  right now. No three imports.
*/

/**
 * The current time, ticking over on each minute. Null until the page is
 * running in the browser: rendering a time on the server would never match
 * the visitor's clock, and React would report the difference.
 */
export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let timer = 0;
    const tick = () => {
      setNow(new Date());
      timer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}

const clocks = new Map<string, Intl.DateTimeFormat>();

function clock(timeZone: string) {
  let format = clocks.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    clocks.set(timeZone, format);
  }
  return format;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The day (0 = Sunday) and "06:14" time in an IANA time zone. */
export function zonedTime(now: Date, timeZone: string) {
  const parts = clock(timeZone).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: WEEKDAYS.indexOf(get("weekday")), time: `${get("hour")}:${get("minute")}` };
}

/** "06:14", in an IANA time zone. */
export function localTime(now: Date, timeZone: string) {
  return zonedTime(now, timeZone).time;
}
