export function getUrl(endpoint:string):string
{
    if (endpoint[0] != '/')
        endpoint = '/' + endpoint
   return window.location.protocol + '//' + window.location.host + endpoint
}