/**
 * retourne le timestamp de la date selectionné
 * @param date
 */
export const getTimestamp = (date: any) => {
    const timestamp = Date.parse(date.toString());
    return Number(timestamp.toString().substring(0, 10));
}