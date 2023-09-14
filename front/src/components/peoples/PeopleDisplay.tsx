import { useEffect, useState } from "react"
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import {ethers} from "ethers";
import contractsInterface from "../../contracts/contracts";
import {provider} from "../../provider/providers";
import {ipfsGetContent} from "../common/ipfs";

interface PeopleDisplayProps {
    tokenId: number,
    type: number
}

const PeopleDisplay = ({tokenId, type}: PeopleDisplayProps  ) => {
    const [peopleImage, setPeopleImage] = useState('');
    const [metadata, setMetadata]: any = useState();

    useEffect(() => {
        if (tokenId ) {
            (async () => {
                let tokenUri: string = '';
                let contract;
                if(type === 1){
                    contract = new ethers.Contract(contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, provider);
                }else {
                    contract = new ethers.Contract(contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, provider);
                }

                try {
                    tokenUri = await contract.tokenURI(tokenId);
                }
                catch (e) {
                    console.log(e);
                }

                if (tokenUri) {
                    const metadataString = await ipfsGetContent(tokenUri)
                    const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'))
                    setMetadata(data);

                    if (data.image) {
                        const imageContent = await ipfsGetContent(data.attributes[2].value)
                        setPeopleImage(uint8ArrayToString(imageContent, 'base64'))
                    }

                    setTimeout(function() {
                        setMetadata('');
                        setPeopleImage('')
                    }, 10000);
                }
            })()
        }
    }, [peopleImage, setPeopleImage, tokenId])

    return (
        <div style={{margin: 'auto', width: 200}}>
            {tokenId > 0 && peopleImage &&
                <div>
                    <h3>Apercu :</h3>
                    <img src={`data:image/*;base64,${peopleImage}`} alt="card" style={{height: '200px'}}/>
                    <p>{metadata.attributes[0].value} {metadata.attributes[1].value}</p>
                </div>
            }
        </div>
    )
}
export default PeopleDisplay
