import { saveAs } from 'file-saver';
import { createEvent} from 'ics';

const isMobile = async () => true;

export const downloadICS = async (event) => {
    // console.log('downloadICS', event)
    const file = await new Promise((resolve, reject) => {
        createEvent( event , (error, value) => {
            if (error) {
                reject(error)
            }
            const blob = new Blob([value], { type: 'text/calendar' });
            saveAs(blob, `${event.title}.ics`);
        });
    });
}

export const generateGoogleLink  = (event) => {

    let link = [];

    if (isMobile()) {
        link.push('https://calendar.google.com/calendar/render?action=TEMPLATE&');
    } else {
        link.push('https://calendar.google.com/calendar/r/eventedit?');
    }

    if (event.timeZone && event.timeZone !== '' && !/GMT[+|-]\d{1,2}|Etc\/U|Etc\/Zulu|CET|CST6CDT|EET|EST|MET|MST|PST8PDT|WET|PST|PDT|MDT|CST|CDT|EDT|EEST|CEST|HST|HDT|AKST|AKDT|AST|ADT|AEST|AEDT|NZST|NZDT|IST|IDT|WEST|ACST|ACDT|BST/i.test(date.timeZone) && !formattedDate.allday) {
        link.push('ctz=' + date.timeZone);
    }

    if ( event.start ) event.start = event.start.split(',').toString();
    if ( event.end ) event.end = event.end.split(',').toString();

    link.push(`dates=${encodeURIComponent(event.start+'00')}%2F${encodeURIComponent(event.end+'00')}`);

    if (event.location && event.location !== '') {
        link.push(`location=${ encodeURIComponent(event.location)}`);
    }

    if (event.title && event.title !== '') {
        link.push(`text=${ encodeURIComponent(event.title)}`);
    }

    if (event.description && event.description.length > 0) {
        const d = `${event.description}' &#128205;:${event.location}`;
        link.push(`details=${encodeURIComponent(d)}`);
    }

    return link.join('&');
}

export const generateOutlookLink = (event) => {   
    /* 
    https://outlook.office.com/calendar/0/deeplink/compose?
        subject=My Event
        &body=Event description text
        &startdt=2022-03-05T10:30:00+00:00
        &enddt=2022-03-05T18:45:00+00:00
        &location=New York City
        &path=%2Fcalendar%2Faction%2Fcompose
        &rru=addevent
    */

    let calLink = ['https://outlook.office.com/calendar/0/deeplink/compose?'];

    if (event.timeZone && event.timeZone !== '' && !/GMT[+|-]\d{1,2}|Etc\/U|Etc\/Zulu|CET|CST6CDT|EET|EST|MET|MST|PST8PDT|WET|PST|PDT|MDT|CST|CDT|EDT|EEST|CEST|HST|HDT|AKST|AKDT|AST|ADT|AEST|AEDT|NZST|NZDT|IST|IDT|WEST|ACST|ACDT|BST/i.test(date.timeZone) && !formattedDate.allday) {
        calLink.push('ctz=' + date.timeZone);
    }

    if ( event.start ) {
        event.start = event.start.split(',').join('-')
        
    }
    calLink.push(`startdt=${encodeURIComponent(event.start+'00')}%2F${encodeURIComponent(event.end+'00')}`);

    if (event.location && event.location !== '') {
        calLink.push(`location=${ encodeURIComponent(event.location)}`);
    }

    if (event.title && event.title !== '') {
        calLink.push(`text=${ encodeURIComponent(event.title)}`);
    }

    if (event.description && event.description.length > 0) {
        const d = `${event.description}' &#128205;:${event.location}`;
        calLink.push(`details=${encodeURIComponent(d)}`);
    }

    return new Date(event.start);
    // return calLink.join('&');
}