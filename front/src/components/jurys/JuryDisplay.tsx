import {useEffect, useState} from "react";
import {ipfsGetContent} from "../common/ipfs.ts";
import {toString as uint8ArrayToString} from "uint8arrays/to-string";

interface JuryDisplayProps {
    tokenURI: string
}
const JuryDisplay = ({tokenURI}: JuryDisplayProps) => {
    const [juryImage, setJuryImage] = useState('');

    useEffect(() => {
        if (tokenURI ) {
            (async () => {
                const metadataString = await ipfsGetContent(tokenURI)
                const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'))

                if (data.image) {
                    const imageContent = await ipfsGetContent(data.attributes[0].value)
                    setJuryImage(uint8ArrayToString(imageContent, 'base64'))
                }
            })()
        }
    }, [juryImage, setJuryImage, tokenURI])

    return (
        <div style={{margin: 'auto', width: 200}}>
            {tokenURI && juryImage &&
                <div>
                    <h3>Apercu :</h3>
                    <img src={`data:image/*;base64,${juryImage}`} alt="card" style={{height: '200px'}}/>
                </div>
            }
        </div>
    )
}
export default JuryDisplay;
