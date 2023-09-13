import { provider } from "../provider/providers.ts"
import { ethers } from "ethers"
import contractsInterface from "../contracts/contracts.ts"
import { AccessRights } from "../types/ConnectedUser"

export async function computeAccessRights(address: string): Promise<AccessRights> {
    const directorsContract = new ethers.Contract(contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, provider)
    const actorsContract = new ethers.Contract(contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, provider)
    const moviesContract = new ethers.Contract(contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, provider)
    const competitionsContract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, provider)
    const jurysContract = new ethers.Contract(contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, provider)

    let canAddPeople = false
    let canAddMovie = false
    let canAddCompetition = false
    let canAddJury = false
    let isJury = false

    try {
        const directorsContractOwnerAddress = await directorsContract.owner()
        canAddPeople = directorsContractOwnerAddress === address
    } catch (e) {
        console.error("Erreur récupération du owner du contrat Directors", e)
    }

    try {
        const actorsContractOwnerAddress = await actorsContract.owner()
        canAddPeople = canAddPeople || actorsContractOwnerAddress === address
    } catch (e) {
        console.error("Erreur récupération du owner du contrat People", e)
    }

    try {
        const moviesContractOwnerAddress = await moviesContract.owner()
        canAddMovie = moviesContractOwnerAddress === address
    } catch (e) {
        console.error("Erreur récupération du owner du contrat Movies", e)
    }

    try {
        const competitionsContractOwnerAddress = await competitionsContract.owner()
        canAddCompetition = competitionsContractOwnerAddress === address
    } catch (e) {
        console.error("Erreur récupération du owner du contrat Competitions", e)
    }

    try {
        const jurysContractOwnerAddress = await jurysContract.owner()
        canAddJury = jurysContractOwnerAddress === address
    } catch (e) {
        console.error("Erreur récupération du owner du contrat Jurys", e)
    }

    try {
        await jurysContract.getJuryId(address)
        isJury = true
    } catch (e) {
        isJury = false
        console.error("Erreur appel getJuryId sur le contrat Jurys", e)
    }

    return { canAddPeople, canAddMovie, canAddCompetition, canAddJury, isJury }
}

export function hasAccessToApp(accessRights: AccessRights): boolean {
    const { canAddPeople, canAddMovie, canAddCompetition, isJury } = accessRights
    return canAddPeople || canAddMovie || canAddCompetition || isJury
}