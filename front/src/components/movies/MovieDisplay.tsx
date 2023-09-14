import { useEffect, useState } from "react"
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import {ethers} from "ethers";
import contractsInterface from "../../contracts/contracts.ts";
import {provider} from "../../provider/providers.ts";
import {ipfsGetContent} from "../common/ipfs.ts";

interface MovieDisplayProps {
    tokenId: number
}

const MovieDisplay = ({tokenId}: MovieDisplayProps  ) => {
    const [movieImage, setMovieImage] = useState('');
    const [metadata, setMetadata]: any = useState();

    useEffect(() => {
        if (tokenId ) {
            (async () => {
                let tokenUri: string = '';
                let contract = new ethers.Contract(contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, provider);
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
                        setMovieImage(uint8ArrayToString(imageContent, 'base64'))
                    }
                    setTimeout(function() {
                        setMetadata('');
                        setMovieImage('')
                    }, 10000);
                }
            })()
        }
    }, [movieImage, setMovieImage, tokenId])

    return (
        <div style={{margin: 'auto', width: 200}}>
            {tokenId > 0 && movieImage &&
                <div>
                    <h3>Apercu :</h3>
                    <img src={`data:image/*;base64,${movieImage}`} alt="card" style={{height: '200px'}}/>
                    <p>{metadata.attributes[0].value}</p>
                </div>
            }
        </div>
    )
}
export default MovieDisplay
