import {useEffect, useState} from "react";
import contractsInterface from "../contracts/contracts.ts";
import {fetchJury, listenToNewJury} from "../services/JuryService.service.ts";

const Jury = () => {

    const [jurys, ]: any = useState([]);
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        const addToJurys = async (jury: any) => {
            jurys.push(jury);
        }

        fetchJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, setLoading, addToJurys).then();
        listenToNewJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, addToJurys).then();

    }, [jurys])

    /*const jurys = [
        {
            id: 1,
            name: 'Dupont',
            lastname: 'Jean-Luc',
            url: 'default-profil.png',
        },
        {
            id: 2,
            name: 'Leclerc',
            lastname: 'Marie',
            url: 'default-profil.png',
        },
        {
            id: 3,
            name: 'Martin',
            lastname: 'Patrick',
            url: 'default-profil.png',
        },
        {
            id: 4,
            name: 'Dubois',
            lastname: 'Sophie',
            url: 'default-profil.png',
        },
        {
            id: 5,
            name: 'Lefevre',
            lastname: 'Pierre',
            url: 'default-profil.png',
        },
        {
            id: 6,
            name: 'Girard',
            lastname: 'Isabelle',
            url: 'default-profil.png',
        },
        {
            id: 7,
            name: 'Tremblay',
            lastname: 'Nicolas',
            url: 'default-profil.png',
        },
        {
            id: 8,
            name: 'Gagnon',
            lastname: 'Sandrine',
            url: 'default-profil.png',
        },
        {
            id: 9,
            name: 'Roy',
            lastname: 'Phillipe',
            url: 'default-profil.png',
        },
        {
            id: 10,
            name: 'Pelletier',
            lastname: 'Emilie',
            url: 'default-profil.png',
        }
    ]*/

    return (
        <div>
            <h2>Les Jurys des compétitions du devfest 2023</h2>

            <section style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
                {!isLoading && jurys && jurys.length > 0 && jurys.map((jury: any, index: number) => (
                    <div  key={`${jury.id}-${index}`}>
                        <img src={jury.Picture} alt={jury.Firstname + ' ' + jury.Lastname} />
                    </div>
                ))}
            </section>
        </div>
    )
}
export default Jury;
