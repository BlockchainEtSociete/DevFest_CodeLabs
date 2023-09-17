import type { JsonRpcSigner } from 'ethers'
export interface AccessRights {
    canAddPeople: boolean
    canAddMovie: boolean
    canAddCompetition: boolean
    canAddJury: boolean
    isJury: boolean
}
export interface ConnectedUser {
    signer?: JsonRpcSigner
    address: string
    accessRights: AccessRights
}

export const isUserAdmin = (connectedUser: ConnectedUser): boolean => {
    const { canAddPeople, canAddMovie, canAddCompetition } = connectedUser.accessRights
    return canAddPeople || canAddMovie || canAddCompetition
}
