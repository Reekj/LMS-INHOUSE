function dateDifferenceInDays(startDate, endDate) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((end - start) / 86400000);
}

export function eventsForDate(events, dateKey) {
  return events.flatMap((event) => {
    const startDate = String(event.date || "").split("T")[0];
    const endDate = String(event.recurrenceEndDate || "").split("T")[0];
    const dayDifference = dateDifferenceInDays(startDate, dateKey);
    const withinRange = dayDifference >= 0 &&
      (event.frequency === "once" || dateKey <= (endDate || startDate));
    const occurs = event.frequency === "weekly"
      ? withinRange && dayDifference % 7 === 0
      : event.frequency === "monthly"
        ? withinRange && Number(dateKey.slice(-2)) === Number(startDate.slice(-2))
        : withinRange && dayDifference === 0;

    return occurs
      ? [{
          ...event,
          id: `${event.id}-${dateKey}`,
          eventId: event.id,
          seriesStartDate: startDate,
          date: dateKey,
        }]
      : [];
  });
}
