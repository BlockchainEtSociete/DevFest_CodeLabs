import PeopleCard from "../components/peoples/PeopleCard";
import {useEffect, useState} from "react";
import contractsInterface from "../contracts/contracts";
import {fetchPeople, listenToNewPeople} from "../services/PeopleService.service";

const Director = () => {
    const [directors, setDirectors]: any = useState({});
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        const addToDirectors = async (people: any) => {
            if (!directors[people.id]) {
                directors[people.id] = people;
                setDirectors(directors);
            }
        }

        (async () => {
            setLoading(true)
            await fetchPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, addToDirectors);
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
                        Firstname={directors[director].Firstname}
                        Lastname={directors[director].Lastname}
                        Picture={directors[director].Picture}
                    />
                ))}
            </section>
        </article>
    )
}
export default Director;