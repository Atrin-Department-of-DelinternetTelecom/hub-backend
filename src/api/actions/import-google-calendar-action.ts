'use strict';

import { DateTime } from 'luxon';
import { GoogleCalendar } from '@api/service/google/Calendar';
import assert from 'assert';
import { deferredIntranetRecordUpdate } from '@api/service/intranet/ScheduleService';
import { intranet } from '@lib/knex';
import { pluck } from '@api/utils/collections';

type GoogleCalendarEvent = {
  id: number;
  data: {
    displayFrom: string;
    displayUntil: string;
  };
};

const googleEvents = async (userId: number) => {
  //if calendar for this user is not available then skip
  const calendar = new GoogleCalendar(userId);
  if (!(await calendar.isAvailable())) {
    console.log(`Google calendar is not available for user [userId:${userId}]`);
    return [];
  }

  const items = await calendar.allEvents();
  assert(Array.isArray(items) && items.length, 'Calendar is empty');
  const records: GoogleCalendarEvent[] = items
    .filter(({ summary, start }) => summary && start && summary?.match(/^\d+/))
    .map(({ summary, start, end, ...original }) => ({
      id: Number((summary?.match(/^\d+/) ?? [])[0]),
      data: {
        displayFrom: DateTime.fromJSDate(new Date(start.dateTime)).toSQL({
          includeOffset: false,
        }),
        displayUntil: DateTime.fromJSDate(new Date(end.dateTime)).toSQL({
          includeOffset: false,
        }),
      },
      original: { summary, start, end, ...original },
    }));
  // keep latest events
  const uniqueEventsMap = new Map<string, GoogleCalendarEvent>();

  records.forEach((event) => {
    const id = event.id.toString();
    const existingEvent = uniqueEventsMap.get(id);
    // if no existing event, add it
    if (!existingEvent) {
      uniqueEventsMap.set(id, event);
      return;
    }
    // compare displayUntil dates
    const googleEventDisplayUntil = DateTime.fromJSDate(
      new Date(event.data.displayUntil),
    );
    const evenDisplayUntil = DateTime.fromJSDate(
      new Date(existingEvent.data.displayUntil),
    ).toMillis();

    if (googleEventDisplayUntil.toMillis() > evenDisplayUntil) {
      uniqueEventsMap.set(id, event);
    }
  });

  return Array.from(uniqueEventsMap.values());
};

const intranetEvents = async (records: GoogleCalendarEvent[]) => {
  const events = await intranet
    .table('crm_tasks')
    .whereIn('id', pluck(records, 'id'))
    .where('status', 1)
    .select('displayFrom', 'displayUntil', 'id');

  return records.filter(({ id, data }) => {
    const event = events.find((event) => event.id === id);

    if (!event) {
      return false;
    }

    // fix wrong end-date
    return new Date(event.displayUntil) < new Date(data.displayUntil);
  });
};

export default async function importGoogleCalendar(params: { userId: number }) {
  console.log(`Import old calendar events for user [userId:${params.userId}]`);

  const records = await googleEvents(params.userId);
  const updates = await intranetEvents(records);

  if (updates.length) {
    await deferredIntranetRecordUpdate('crm_tasks', updates);
  } else {
    console.error('No calendar updates for user', params);
  }
}
