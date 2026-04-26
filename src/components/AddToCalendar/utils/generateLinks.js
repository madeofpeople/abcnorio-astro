import { saveAs } from 'file-saver';
import { createEvent } from 'ics';

const isMobile = () => {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

const asText = (value) => {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value).split(',').join('');
};

const normalizeEvent = (event = {}) => {
    const title = asText(event.title);
    const description = asText(event.description);
    const start = asText(event.start ?? event.event_start_date);
    const end = asText(event.end ?? event.event_end_date ?? start);
    const location = asText(event.location ?? event.event_venue_name);
    const timeZone = asText(event.timeZone ?? event.event_timezone);
    const details = description
        ? [description, location ? `Location: ${location}` : ''].filter(Boolean).join(' — ')
        : '';

    return { title, description, start, end, location, timeZone, details };
};

const parseEventDate = (value) => {
    const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatCalendarDate = (value) => {
    const date = parseEventDate(value);

    if (!date) {
        return asText(value);
    }

    const pad = (part) => String(part).padStart(2, '0');

    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const toIcsDateArray = (value) => {
    const date = parseEventDate(value);

    return date
        ? [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]
        : null;
};

const pushParam = (parts, key, value) => {
    if (value) {
        parts.push(`${key}=${encodeURIComponent(value)}`);
    }
};

export const downloadICS = async (rawEvent) => {
    const event = normalizeEvent(rawEvent);

    await new Promise((resolve, reject) => {
        createEvent(
            {
                title: event.title,
                description: event.description,
                location: event.location,
                start: toIcsDateArray(event.start),
                end: toIcsDateArray(event.end),
            },
            (error, value) => {
                if (error) {
                    reject(error);
                    return;
                }

                const blob = new Blob([value], { type: 'text/calendar' });
                saveAs(blob, `${event.title || 'event'}.ics`);
                resolve(value);
            }
        );
    });
};

export const generateGoogleLink = (rawEvent) => {
    const event = normalizeEvent(rawEvent);
    const link = [
        isMobile()
            ? 'https://calendar.google.com/calendar/render?action=TEMPLATE&'
            : 'https://calendar.google.com/calendar/r/eventedit?',
        `dates=${encodeURIComponent(formatCalendarDate(event.start))}%2F${encodeURIComponent(formatCalendarDate(event.end))}`,
    ];

    pushParam(link, 'ctz', event.timeZone);
    pushParam(link, 'location', event.location);
    pushParam(link, 'text', event.title);
    pushParam(link, 'details', event.details);
    return link.join('&');
};

export const generateOutlookLink = (rawEvent) => {
    const event = normalizeEvent(rawEvent);
    const calLink = [
        'https://outlook.office.com/calendar/0/deeplink/compose?',
        `startdt=${encodeURIComponent(formatCalendarDate(event.start))}`,
        `enddt=${encodeURIComponent(formatCalendarDate(event.end))}`,
    ];

    pushParam(calLink, 'ctz', event.timeZone);
    pushParam(calLink, 'location', event.location);
    pushParam(calLink, 'subject', event.title);
    pushParam(calLink, 'body', event.details);

    calLink.push('path=%2Fcalendar%2Faction%2Fcompose');
    calLink.push('rru=addevent');

    return calLink.join('&');
};
