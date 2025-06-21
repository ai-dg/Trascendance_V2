
export interface Message_data
{
    id: number,
    type: string,
    room_id: string,
    message: string,
    sender: string,
    date: string,
    [key: string]: any,
    modified:boolean
}