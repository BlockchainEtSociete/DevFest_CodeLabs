import CardCompetitionSelect from "./CardCompetitionSelect";
import { AlertColor } from "@mui/material";
import { fetchPeople } from "../../services/PeopleService.service";
import contractsInterface from "../../contracts/contracts";
import { fetchMovie } from "../../services/MovieService.service";
import { useEffect, useState } from "react";
import { provider } from "../../provider/providers";
import { ethers } from "ethers";
import { People } from "../../types/People";

export interface CompetitionNomineesFormProps {
    reset: boolean,
    minting: boolean,
    typeCompetition: number,
    tokenId: number,
    setMinting: (minting: boolean) => void,
    setOpenNominees: (openNominee: boolean) => void,
    setOpenJury: (openJury: boolean) => void,
    setOpen: (open: boolean) => void,
    setMessage: (message: string) => void,
    setSeverity: (severity: AlertColor | undefined) => void,
}
export const CompetitionNomineesForm = ({reset, minting, typeCompetition, tokenId, setMinting, setOpenNominees, setOpenJury, setOpen, setMessage, setSeverity}: CompetitionNomineesFormProps) => {
    // variables for options lists
    const [directors, setDirectors]: any = useState({});
    const [actors, setActors]: any = useState({});
    const [movies, setMovies]: any = useState({});
    const [idsNominees, setIdsNominees]: any[] = useState([]);

    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        if (reset) {
            setDirectors({});
            setActors({});
            setMovies({});
        } else {
            (async () => {
                await getTypeCompetition(typeCompetition);
            })();
        }
    }, [setDirectors, setActors, setMovies, typeCompetition, reset]);

    const addToActors = async (people: any) => {
        actors[people.id] = people;
        setActors(actors);
    }
    const addToDirectors = async (people: any) => {
        directors[people.id] = people;
        setDirectors(directors);
    }
    const addToMovies = async (movie: any) => {
        movies[movie.id] = movie;
        setMovies(movies);
    }

    /**
     * Permet en fonction du type de compétition de récupérer les données ipfs des nfts correspondant
     * @param type
     */
    const getTypeCompetition = async (type: number) => {
        setLoading(true)
        setIdsNominees([]);
        setActors({});
        setDirectors({});
        setMovies({});

        if (type == 0) {
            const listActors = await fetchPeople("ActorMinted", contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi);
            listActors?.forEach((actor: People) => addToActors(actor));
        } else if (type == 1) {
            const listDirectors = await fetchPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi);
            listDirectors?.forEach((actor: People) => addToDirectors(actor));
        } else {
            await fetchMovie("MovieMinted", contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, addToMovies);
        }
        setLoading(false)
    }

    /**
     * Permet de verifier les ids ajouter à la liste et d'ajouter de nouveau selectionné ou de supprimé un existant
     * @param number
     */
    const addTokenIdNominee = (number: number) => {
        let contain = false;
        if (!Number.isInteger(number)) {
            setMessage(`Invalide id`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        idsNominees?.map((id: number) => id == number ? contain = true : '');
        !contain ? idsNominees.push(number) : idsNominees.splice(idsNominees.indexOf(number),1);
    }

    /**
     * Fonction qui appel le smart contract afin d'ajouter les options de la compétition
     */
    const addNomineesCompetition = async () => {
        setMinting(true);
        const signer = await provider?.getSigner();

        // création de l'appel du mint
        const contract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );

        for(const idNominee of idsNominees) {
            let transaction;
            try {
                transaction = await contract.addNomineeCompetition(tokenId, idNominee);
            } catch (e) {
                setMinting(false);
                setMessage(`Minting in error`)
                setSeverity('error')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
            }

            // vérification que la transaction c'est bien passé
            await transaction.wait().then(async (receipt: any) => {
                if (receipt && receipt.status == 1) {
                    setMessage(`Minting in success`)
                    setSeverity('success')
                    setOpen(true)
                    setTimeout(
                        function () {
                            setOpen(false)
                        }, 5000);
                }
            }).catch((err: any) => {
                if (err) {
                    setMinting(false);
                    setMessage(`Minting in error`)
                    setSeverity('error')
                    setOpen(true)
                    setTimeout(
                        function () {
                            setOpen(false)
                        }, 5000);
                }
            })
        }

        setOpenNominees(false);
        setOpenJury(true);

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    /**
     * Verification des données des options de la competitions avant sauvegarde dans la blockchain
     */
    const verifyFormNominees = async () => {
        idsNominees.forEach((id: number) => {
            if (!Number.isInteger(id)) {
                setMessage(`Invalide id`)
                setSeverity('error')
                setOpen(true)
                return false;
            }
        })
        await addNomineesCompetition();
    }

    return (
        <div>
            <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
                {!isLoading && actors && Object.keys(actors).length > 0 && Object.keys(actors).map((actorId: any) => (
                    <div key={actors[actorId].id}
                         onClick={() => addTokenIdNominee(actors[actorId].id)}>
                        <CardCompetitionSelect
                            info={actors[actorId].firstname + " " + actors[actorId].lastname}
                            picture={actors[actorId].picture}
                        />
                    </div>
                ))}
                {!isLoading && directors && Object.keys(directors).length > 0 && Object.keys(directors).map((directorId: any) => (
                    <div key={directors[directorId].id}
                         onClick={() => addTokenIdNominee(directors[directorId].id)}>
                        <CardCompetitionSelect
                            info={directors[directorId].firstname + " " + directors[directorId].lastname}
                            picture={directors[directorId].picture}
                        />
                    </div>
                ))}
                {!isLoading && movies && Object.keys(movies).length > 0 && Object.keys(movies).map((movieId: any) => (
                    <div key={movies[movieId].id}
                         onClick={() => addTokenIdNominee(movies[movieId].id)}>
                        <CardCompetitionSelect
                            info={movies[movieId].Title}
                            picture={movies[movieId].Picture}
                        />
                    </div>
                ))}
            </div>
            <button onClick={verifyFormNominees} disabled={minting}>Ajout des nominées de la compétition</button>
        </div>
    )
}
