import {useEffect, useState} from "react";
import {ethers} from "ethers";
import contractsInterface from "../../contracts/contracts.ts";
import {provider} from "../../provider/providers.ts";
import {ipfsGetContent} from "../common/ipfs.ts";
import {toString as uint8ArrayToString} from "uint8arrays/to-string";

interface JuryDisplayProps {
    tokenId: number
}
const JuryDisplay = ({tokenId}: JuryDisplayProps) => {
    const [juryImage, setJuryImage] = useState('');

    useEffect(() => {
        if (tokenId ) {
            (async () => {
                let tokenUri: string = '';
                const contract = new ethers.Contract(contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, provider);

                try {
                    tokenUri = await contract.tokenURI(tokenId);
                }
                catch (e) {
                    console.log(e);
                }

                if (tokenUri) {
                    const metadataString = await ipfsGetContent(tokenUri)
                    const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'))

                    if (data.image) {
                        const imageContent = await ipfsGetContent(data.attributes[0].value)
                        setJuryImage(uint8ArrayToString(imageContent, 'base64'))
                    }
                }
            })()
        }
    }, [juryImage, setJuryImage, tokenId])

    return (
        <div style={{margin: 'auto', width: 200}}>
            {tokenId > 0 && juryImage &&
                <div>
                    <h3>Apercu :</h3>
                    <img src={`data:image/*;base64,${juryImage}`} alt="card" style={{height: '200px'}}/>
                </div>
            }
        </div>
    )
}
export default JuryDisplay;
