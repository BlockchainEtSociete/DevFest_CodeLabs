import { JsonRpcSigner } from 'ethers'
import { AccessRights, ConnectedUser } from '../types/ConnectedUser'
import { computeAccessRights } from "../services/AccessRights.service.ts";
let connectedUser: ConnectedUser = { accessRights: { canAddPeople: false, canAddMovie: false, canAddCompetition: false, canAddJury: false, isJury: false }, address: '' }
let listeners: (() => void)[] = []

export const connectedUserStore = {
    setConnectedUser(signer: JsonRpcSigner) {
        connectedUser.signer = signer
        connectedUser.address = signer.address
        emitChange()
    },
    setAccessRights(accessRights: AccessRights) {
        connectedUser.accessRights = accessRights
        emitChange()
    },
    setCanAddPeople(canAddPeople: boolean) {
        connectedUser.accessRights.canAddPeople = canAddPeople
        emitChange()
    },
    setCanAddMovie(canAddMovie: boolean) {
        connectedUser.accessRights.canAddMovie = canAddMovie
        emitChange()
    },
    setCanAddCompetition(canAddCompetition: boolean) {
        connectedUser.accessRights.canAddCompetition = canAddCompetition
        emitChange()
    },
    setIsJury(isJury: boolean) {
        connectedUser.accessRights.isJury = isJury
        emitChange()
    },
    isAdmin(): boolean {
        const { canAddPeople, canAddMovie, canAddCompetition } = connectedUser.accessRights
        return canAddPeople || canAddMovie || canAddCompetition
    },
    async updateConnectedUser(signer: JsonRpcSigner): Promise<void> {
        const accessRights = await computeAccessRights(signer.address)
        connectedUserStore.setConnectedUser(signer)
        connectedUserStore.setAccessRights(accessRights)
    },
    resetConnectedUser() {
        connectedUser = { accessRights: { canAddPeople: false, canAddMovie: false, canAddCompetition: false, canAddJury: false, isJury: false }, address: '' }
        emitChange()
    },
    subscribe(listener: () => void) {
        listeners = [...listeners, listener]
        return () => {
            listeners = listeners.filter((l) => l !== listener)
        }
    },
    getSnapshot() {
        return connectedUser
    },
}

function emitChange() {
    for (const listener of listeners) {
        listener()
    }
}
