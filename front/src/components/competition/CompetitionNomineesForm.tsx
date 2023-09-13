import CardCompetitionSelect from "./CardCompetitionSelect.tsx";
import { AlertColor } from "@mui/material";
import { fetchPeople } from "../../services/PeopleService.service.ts";
import contractsInterface from "../../contracts/contracts.ts";
import { fetchMovie } from "../../services/MovieService.service.ts";
import { useEffect, useState } from "react";
import { provider } from "../../provider/providers.ts";
import { ethers } from "ethers";

export interface CompetitionNomineesFormProps {
    reset: boolean,
    minting: boolean,
    typeCompetition: number,
    setMinting: (minting: boolean) => void,
    setLoading: (loading: boolean) => void,
    setOpenNominees: (openNominee: boolean) => void,
    setOpenJury: (openJury: boolean) => void,
    setOpen: (open: boolean) => void,
    setMessage: (message: string) => void,
    setSeverity: (severity: AlertColor | undefined) => void,
}
export const CompetitionNomineesForm = ({reset, minting, typeCompetition, setMinting, setLoading, setOpenNominees, setOpenJury, setOpen, setMessage, setSeverity}: CompetitionNomineesFormProps) => {

    // variables des listes des options
    let idsNominees: number[] = [];
    const [directors, setDirectors]: any = useState([]);
    const [actors, setActors]: any = useState([]);
    const [movies, setMovies]: any = useState([]);

    useEffect(() => {
        if(reset){
            setDirectors([]);
            setActors([]);
            setMovies([]);
        }
        else {
            getTypeCompetition(typeCompetition);
        }
    }, [reset, typeCompetition]);

    const addToActors = async (people: any) => {
        actors.push(people);
    }
    const addToDirectors = async (people: any) => {
        directors.push(people);
    }

    /**
     * Permet en fonction du type de compétition de récupérer les données ipfs des nfts correspondant
     * @param type
     */
    const getTypeCompetition = (type: any) => {
        idsNominees = [];
        setActors([]);
        setDirectors([]);
        setMovies([]);

        if(type == 1){
            fetchPeople("ActorMinted", contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, setLoading, addToActors).then();
        } else if(type == 2){
            fetchPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, setLoading, addToDirectors).then();
        } else {
            fetchMovie("MovieMinted", contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, setLoading)
                .then((films) => {
                    setMovies(films);
                });
        }
    }

    /**
     * Permet de verifier les ids ajouter à la liste et d'ajouter de nouveau selectionné ou de supprimé un existant
     * @param number
     */
    const addTokenIdNominee = (number: number) => {
        let contain = false;
        if(!Number.isInteger(number)){
            setMessage(`Invalide id`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        idsNominees?.map((id: number) => {
            if(id == number){
                contain = true;
            }
        })
        if(!contain){
            idsNominees.push(number);
        }else{
            idsNominees.splice(idsNominees.indexOf(number),1);
        }
    }

    /**
     * Fonction qui appel le smart contract afin d'ajouter les options de la compétition
     */
    const addNomineesCompetition = async () => {
        setMinting(true);
        const signer = await provider?.getSigner();

        // création de l'appel du mint
        const contract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );
        let transaction;

        try {
            transaction = await contract.addNomineesCompetition(tokenId, idsOption);
        }catch (e) {
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
            if(receipt && receipt.status == 1){
                setMessage(`Minting in success`)
                setSeverity('success')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
            }
        }).catch((err: any )=> {
            if(err){
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
            if(!Number.isInteger(id)){
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
                {actors && actors.length > 0 && actors.map((actor: any, index: number) => (
                    <div key={`${actor.id}-${index}`}
                         onClick={() => addTokenIdNominee(actor.id)}>
                        <CardCompetitionSelect
                            Info={actor.Firstname + " " + actor.Lastname}
                            Picture={actor.Picture}
                        />
                    </div>
                ))
                }
                {directors && directors.length > 0 && directors.map((director: any, index: number) => (
                    <div key={`${director.id}-${index}`}
                         onClick={() => addTokenIdNominee(director.id)}>
                        <CardCompetitionSelect
                            Info={director.Firstname + " " + director.Lastname}
                            Picture={director.Picture}
                        />
                    </div>
                ))
                }
                {movies && movies.length > 0 && movies.map((movie: any, index: number) => (
                    <div key={`${movie.id}-${index}`}
                         onClick={() => addTokenIdNominee(movie.id)}>
                        <CardCompetitionSelect
                            Info={movie.Title}
                            Picture={movie.Picture}
                        />
                    </div>
                ))
                }
            </div>
            <button onClick={verifyFormNominees} disabled={minting}>Ajout des nominées de la compétition</button>
        </div>
    )
}