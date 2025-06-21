export function getCSRFToken():string
{
    const csrfToken: string = (document.querySelector("input[name='csrfmiddlewaretoken']") as HTMLInputElement).value 
    return csrfToken;
}