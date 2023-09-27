import { useEffect, useState } from "react"
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { getPeopleData } from "../../services/PeopleService.service";
import { People } from "../../types/People";
import { ipfsGetContent } from "../common/ipfs";

interface PeopleDisplayProps {
    tokenUri: string
}

const PeopleDisplay = ( { tokenUri }: PeopleDisplayProps ) => {
    const [ people, setPeople ] = useState<People>();

    useEffect( () => {
        if ( tokenUri ) {
            ( async () => {
                setPeople( await getPeopleData( 0, tokenUri ) );
            } )()
        }
    }, [ setPeople, tokenUri ] )

    return (
        <div style={ { margin: 'auto', width: 200 } }>
            { tokenUri && people &&
                <div>
                    <h3>Apercu :</h3>
                    <img src={ people.picture } alt="card" style={ { height: '200px' } }/>
                    <p>{ `${ people.firstname } ${ people.lastname }` }</p>
                </div>
            }
        </div>
    )
}
export default PeopleDisplay
