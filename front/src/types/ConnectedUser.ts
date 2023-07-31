import type { JsonRpcSigner } from 'ethers'
export interface AccessRights {
    canAddPeople: boolean
    canAddMovie: boolean
    canAddCompetition: boolean
    isJury: boolean
}
export interface ConnectedUser {
    signer?: JsonRpcSigner
    address: string
    accessRights: AccessRights
}
