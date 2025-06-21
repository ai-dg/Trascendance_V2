export interface Message_archive{
    message : string,
    date : string,
    author__username: string,
    read_at : string,
    id : number,
    modified : boolean,
    deleted : boolean,
    users: any
}