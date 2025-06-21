export const locale : string = navigator.language || "fr-FR";

export function formatDate(date : string): string
{
    let d : Date = new Date(date)
    let d_date : string = d.toLocaleDateString(locale)
    let d_hour : string = d.toLocaleTimeString(locale, {hour:"2-digit", minute:"2-digit"})
    if (d_date === today())
        return d_hour
    else
        return `${d_date} ${d_hour}`    
}

export function today():string
{
    let date : Date = new Date()
    return date.toLocaleDateString(locale)    
}

export function extractHour(date : string):string{
    let index = date.indexOf(" ")
    if (index > 0)
        return date.slice(index)
    return date
}