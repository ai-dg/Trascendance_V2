

export function getCookieJSONValue(field: string):Array<string>
{
    let cookies: string[] = document.cookie.split("; ");
    for (let cookie of cookies)
    {
        if (!cookie.includes("="))
            continue;
        let parts :string[]=  cookie.split("=");
        if (parts.length > 2)
            continue
        let [key, value] = parts;
        if (key === field)
            return JSON.parse(decodeURIComponent(value));
    }
    return [];
}

export function setCookieJSONValue(field:string, value:string, filter:any={})
{
    let values: Array<string> = getCookieJSONValue(field);
    if (typeof(values) === 'string')
        values = [values]
    if (!Array.isArray(values))
        values = []
    if (!values.includes(value))
    {
        values.unshift(value);
        if (typeof filter.length === "number" && filter.length > 0)        
            if (values.length > filter.length)
                values.pop();
    }
    document.cookie = `${field}=${encodeURIComponent(JSON.stringify(values))}; samesite=strict; path=/; max-age=31536000`;
}


export function getCookieValue(field:string):string | null
{
    let cookies = document.cookie.split("; ");
    for (let cookie of cookies)
    {
        if (!cookie.includes("="))
            continue;
        let parts =  cookie.split("=");
        if (parts.length > 2)
            continue
        let [key, value] = parts;
        if (key === field)
            return decodeURIComponent(value);
    }
    return null;
}

export function setCookieValue(field:string, value:string):void
{
    document.cookie = `${field}=${encodeURIComponent(value)}; samesite=strict; path=/; max-age=31536000`;
}