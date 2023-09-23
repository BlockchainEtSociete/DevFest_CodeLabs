import PeopleCard from "../components/peoples/PeopleCard";
import {useEffect, useState} from "react";
import contractsInterface from "../contracts/contracts";
import {fetchPeople, listenToNewPeople} from "../services/PeopleService.service";
import { People } from "../types/People";

const Director = () => {
    const [directors, setDirectors]: any = useState({});
    const [isLoading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const addToDirectors = async (people: People) => {
            if (!directors[people.id]) {
                directors[people.id] = people;
                setDirectors(directors);
            }
        }

       (async () => {
            setLoading(true)
            const listDirectors = await fetchPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi);
            listDirectors?.forEach((actor: People) => addToDirectors(actor));
            await listenToNewPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, addToDirectors);
            setLoading(false)
        })();
    }, [directors, setDirectors]);

    return (
        <article>
            <h2>Les Réalisateurs en compétition du devfest 2023</h2>
            <section style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
                {!isLoading && directors && Object.keys(directors).length > 0 && Object.keys(directors).map((director: any) => (
                    <PeopleCard
                        key={directors[director].id}
                        firstname={directors[director].firstname}
                        lastname={directors[director].lastname}
                        picture={directors[director].picture}
                    />
                ))}
            </section>
        </article>
    )
}
export default Director;
