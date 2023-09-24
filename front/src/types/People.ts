export interface People {
    id: number;
    firstname: string;
    lastname: string;
    picture: string;
    address: string;
}

export interface Actor extends People {}

export interface Director extends People {}
