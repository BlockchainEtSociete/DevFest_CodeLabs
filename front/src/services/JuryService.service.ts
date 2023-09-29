import ipfs, { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { provider } from "../provider/providers";
import contractsInterface from "../contracts/contracts";
import { ethers, EventLog } from "ethers";
import { Jury } from "../types/Jury";
import { JuryMetadata } from "../types/Metadata";
import { JuryInfos } from "../components/jurys/JuryImageGenerator";

const juryContract = new ethers.Contract( contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, provider );

/**
 * Evenements émits par le contrat Competition
 */
const JuryContractEvents = {
    NEW_JURY: "JuryMinted"
}

/**
 * Récuperation des données Jury dans IPFS
 * @param tokenId
 * @param tokenUri
 */
export const getJuryData = async ( tokenId: number, tokenUri: string ): Promise<Jury> => {
    const metadataString = await ipfsGetContent( tokenUri );
    const data = JSON.parse( uint8ArrayToString( metadataString, 'utf8' ) );

    return {
        id: tokenId,
        firstname: data.attributes[0].value,
        lastname: data.attributes[1].value,
        picture: ipfsGetUrl( data.image ),
        address: data.attributes[3].value
    };
}


/**
 * Récupération de la liste de tous les jurys
 * @returns tableau de Jurys
 */
export const fetchAllJuries = async (): Promise<Jury[]> => {
    const juries: Jury[] = [];

    const filter = juryContract.filters[JuryContractEvents.NEW_JURY];
    const events = await juryContract.queryFilter( filter, 0 ) as EventLog[];

    try {
        for ( const event of events ) {
            const id = ethers.toNumber( ( event as EventLog ).args[1] );
            const tokenUri: string = ( event as EventLog ).args[2];

            juries.push( await getJuryData( id, tokenUri ) );
        }
    } catch ( err ) {
        const message = "Erreur de lors récupération des jurys";
        console.log( message, err );
        throw message;
    }

    return juries;
}

/**
 * Ecoute les nouveaux jurys
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param onNewJury
 */
export const listenToNewJury = async ( onNewJury: ( Jury: Jury ) => void ) => {
    await juryContract.on( JuryContractEvents.NEW_JURY, async ( ...args: Array<unknown> ) => {
        const [ _, tokenId, tokenUri ] = args;
        onNewJury( await getJuryData( ethers.toNumber( tokenId as number ), tokenUri as string ) );
    } );
}

/**
 * Stoppe l'ecoute les nouveaux jurys
 */
export const stopListenToNewJury = async () => {
    await juryContract.removeAllListeners( JuryContractEvents.NEW_JURY );
}

/**
 * Génération des meta données du nft avec enregistrement sur ipfs
 * @param imageUri
 * @param pictureUri
 * @param newJury
 */
export const generateNFTMetadataJuryAndUploadToIpfs = async ( imageUri: string, pictureUri: string, newJury: JuryInfos ) => {
    const NFTMetaData: JuryMetadata = {
        "description": "Jury generated NFT metadata",
        "external_url": "",
        "image": imageUri,
        "name": "Jury DevFest",
        "attributes": [
            {
                "trait_type": "Firstname",
                "value": newJury.firstname
            },
            {
                "trait_type": "Lastname",
                "value": newJury.lastname
            },
            {
                "trait_type": "Picture",
                "value": pictureUri
            },
            {
                "trait_type": "Address",
                "value": newJury.address
            }
        ]
    }

    const metadataString = JSON.stringify( NFTMetaData );

    try {
        // enregistrement des meta donné sur ipfs
        const ipfsResponse = await ipfs.add( metadataString, { pin: true } );
        // création de l'addresse des meta donnée
        return 'ipfs://' + ipfsResponse.cid;
    } catch ( e ) {
        throw `Erreur lors de l'écriture des méta données de la compétition sur IPFS`;
    }
}

/**
 * Fonction qui va appeler le smart contract pour minter le Jury
 * @param address
 * @param tokenURI
 */
export const mintJury = async ( address: any, tokenURI: string ) => {
    const signer = await provider?.getSigner();
    // création de l'appel du mint
    const contract = new ethers.Contract( contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, signer );

    let receipt;
    try {
        const transaction = await contract.mint( address, tokenURI );
        receipt = await transaction.wait();
    } catch ( e ) {
        const error = JSON.parse( JSON.stringify( e ) );
        console.log( "Transaction", error );
        throw `Transaction : ${ error.reason }`;
    }

    if ( receipt && receipt.status == 1 ) {
        const juryMinted = ( receipt.logs as EventLog[] ).find( ( log ) => log.fragment && log.fragment.name === JuryContractEvents.NEW_JURY );
        if ( !juryMinted ) {
            console.log( "receipt", receipt )
            throw "Evenement de création attendu"
        }

        return ethers.toNumber( juryMinted.args[1] );
    } else {
        console.log( "receipt", receipt )
        throw "Une erreur c'est produit durant la transaction"
    }
}
