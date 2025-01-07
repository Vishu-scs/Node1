export function excelDateToJSDate(serial) {
    const daysOffset = 25567; // Days between 1900-01-01 and 1970-01-01
    const date = new Date((serial - daysOffset) * 86400000); // 86400000 = ms in a day
    return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
}