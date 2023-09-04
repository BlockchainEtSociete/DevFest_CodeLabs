import PeopleCard from "../components/peoples/PeopleCard.tsx";
import {useEffect, useState} from "react";
import contractsInterface from "../contracts/contracts.ts";
import {fetchPeople, listenToNewPeople} from "../services/PeopleService.service.ts";

const Realisateur = () => {
    const [directors, setDirectors]: any = useState([]);
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        const addToDirectors = async (people: any) => {
            directors.push(people);
        }

        fetchPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, setLoading, addToDirectors);
        listenToNewPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, addToDirectors);
    }, [directors]);

    /*const realisateurs = [
        {
            id: 1,
            name: 'Nolan',
            lastname: 'Christopher',
            url: 'Christopher_nolan.png',
        },
        {
            id: 2,
            name: 'Eastwood',
            lastname: 'Clint',
            url: 'clint_eastwood.png',
        },
        {
            id: 3,
            name: 'Fincher',
            lastname: 'David',
            url: 'david_fincher.png',
        },
        {
            id: 4,
            name: 'Lynch',
            lastname: 'David',
            url: 'david_lynch.png',
        },
        {
            id: 5,
            name: 'Cameron',
            lastname: 'James',
            url: 'james_cameron.png'
        },
        {
            id: 6,
            name: 'Besson',
            lastname: 'Luc',
            url: 'luc_besson.png'
        },
        {
            id: 7,
            name: 'Jackson',
            lastname: 'Peter',
            url: 'peter_jackson.png'
        },
        {
            id: 8,
            name: 'Tarantino',
            lastname: 'Quentin',
            url: 'Quentin_tarantino.png'
        },
        {
            id: 9,
            name: 'Polanski',
            lastname: 'Roman',
            url: 'roman_polanski.png'
        },
        {
            id: 10,
            name: 'Spielberg',
            lastname: 'Steven',
            url: 'steven_spielberg.png'
        },
        {
            id: 11,
            name: 'Burton',
            lastname: 'Tim',
            url: 'tim_burton.png'
        }
    ];*/

    return (
        <article>
            <h2>Les Réalisateurs en compétition du devfest 2023</h2>
            <section style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
                {!isLoading && directors && directors.length > 0 && directors.map((director: any, index: number) => (
                    <PeopleCard
                        key={`${director.id}-${index}`}
                        Firstname={director.Firstname}
                        Lastname={director.Lastname}
                        Picture={director.Picture}
                    />
                ))}
            </section>
        </article>
    )
}
export default Realisateur;
