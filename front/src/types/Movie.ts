import { Director } from './People'

export interface Movie {
    id: number
    title: string
    description: string
    picture: string
    director: Director
}
