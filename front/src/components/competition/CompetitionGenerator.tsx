import {useEffect, useState} from "react";
import {AlertColor} from "@mui/material";
import {fetchMovie} from "../../services/MovieService.service";
import contractsInterface from "../../contracts/contracts";
import {fetchPeople} from "../../services/PeopleService.service";
import CardCompetitionSelect from "./CardCompetitionSelect";
import {ethers} from "ethers";
import SnackbarAlert from "../common/SnackbarAlert";
import ipfs from "../common/ipfs";
import {CompetitionMetadata} from "../../types/Metadata";
import {provider} from "../../provider/providers";
import CompetitionDisplay from "./CompetitionDisplay";
import {dataUrlToFile, selectedPhotoToken} from "../../services/IpfsService.service";
import {fetchJury, listenToNewJury} from "../services/JuryService.service.ts";

const CompetitionGenerator = () => {
    const [, setLoading] = useState(false);
    const [mitting, setMitting] = useState(false);

    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')

    // variables d'ouverture des blocks
    const [openOption, setOpenOption] = useState(false)
    const [openJury, setOpenJury] = useState(false)
    const [openCompetition, setOpenCompetition] = useState(true)

    // variables des listes des options
    const [directors, setDirectors]: any = useState([]);
    const [actors, setActors]: any = useState([]);
    const [movies, setMovies]: any = useState([]);
    const [jurys, ]: any = useState([]);

    // variables de la competitions
    const [title, setTitle]: any = useState('');
    let idsJurys: number[] = [];
    let idsOption: number[] = [];
    const [Picture, setPicture]: any = useState('');
    const [typeCompetition, setTypeCompetition]: any = useState(0);
    const [startDate, setStartDate]: any = useState(0);
    const [endDate, setEndDate]: any = useState(0);

    const [, setFile] = useState(null);
    const [tokenId, setTokenId]: any = useState(0);

    const addToActors = async (people: any) => {
        actors.push(people);
    }
    const addToDirectors = async (people: any) => {
        directors.push(people);
    }

   /* const jurysBlock: any = [
        {
            id: 1,
            Firstname: "Jean",
            Lastname: "Dupont",
            address: "0x9b4ba2d540c315080209cCa116480304B3BB14d0"
        },
        {
            id: 2,
            Firstname: "Florence",
            Lastname: "Juste",
            address: "0xdecdde28938EF97608369d29cee5F35Bcb084EAE"
        },
        {
            id: 3,
            Firstname: "Marc",
            Lastname: "Hardi",
            address: "0x2404C1f451B02c0760dC7C259a5EFc3210f872F9"
        }
    ]
    const titreBlock = [
        'Les Acteurs en compétition pour le chevrons d\'argent',
        'Les Réalisateurs en compétition pour la parenthèse de cristal',
        'Les Films en compétition pour l\'accolade d\'or'
    ]*/

    useEffect(() => {
        const addToJurys = async (jury: any) => {
            jurys.push(jury);
        }

        fetchJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, setLoading, addToJurys).then();
        listenToNewJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, addToJurys).then();

    }, [jurys])

    /**
     * Verification des données de la compétition avant sauvegarde dans la blockchain
     */
    const verifyForm = async () => {
        // controle des champs
        if(!startDate || (new Date(startDate)).getTime() <= 0){
            setMitting(false);
            setMessage(`Invalide start date`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if(!endDate || (new Date(endDate)).getTime() <= 0 || endDate < startDate){
            setMitting(false);
            setMessage(`Invalide end date`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if(typeCompetition > 3 || typeCompetition <= 0){
            setMitting(false);
            setMessage(`Invalide type competition`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if(!Picture){
            setMitting(false);
            setMessage(`invalid Picture`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        if(!title || title.length == 0){
            setMitting(false);
            setMessage(`Invalide Title`)
            setSeverity('error')
            setOpen(true)
            return false;
        }

        // Upload de l'image sur ipfs
        const PictureFile = await dataUrlToFile(`data:image/*;${Picture}`, 'competition.jpg')
        const ipfsPictureUploadResult = await ipfs.add(PictureFile, {pin: true}).catch((err: Error) => {
            setMessage(`IPFS: ${err.message}`)
            setSeverity('error')
            setOpen(true)
            setMitting(false);
        });

        // création de l'uri - addresse de l'image uploadé
        if (ipfsPictureUploadResult) {
            const PictureUri = `ipfs://${ipfsPictureUploadResult.cid}`
            await generateNFTMetadataAndUploadToIpfs(PictureUri, title);
        }
    }

    /**
     * Verification des données des options de la competitions avant sauvegarde dans la blockchain
     */
    const verifyFormOption = async () => {
        idsOption.forEach((id: number) => {
            if(!Number.isInteger(id)){
                setMitting(false);
                setMessage(`Invalide id`)
                setSeverity('error')
                setOpen(true)
                return false;
            }
        })
        await addOptionsCompetition();
    }

    /**
     * Verification des données des jurys de la competitions avant sauvegarde dans la blockchain
     */
    const verifyFormJury = async () => {
        idsJurys.forEach((id: number) => {
            if(!Number.isInteger(id)){
                setMitting(false);
                setMessage(`Invalide id`)
                setSeverity('error')
                setOpen(true)
                return false;
            }
        })
        await addJurysCompetition();
    }

    /**
     * Génération des meta données avec enregistrement sur ipfs
     * @param PictureUri
     * @param Title
     */
    const generateNFTMetadataAndUploadToIpfs = async (PictureUri: string, Title: string) => {
        const NFTMetaData: CompetitionMetadata = {
            "description": "Movie generated NFT metadata",
            "external_url": "",
            "image": PictureUri,
            "name": "Movie DevFest",
            "attributes": [
                {
                    "trait_type": "Title",
                    "value": Title
                },
                {
                    "trait_type": "Picture",
                    "value": PictureUri
                }
            ]
        }
        const metadataString = JSON.stringify(NFTMetaData);

        // enregistrement des meta donné sur ipfs
        const ipfsResponse = await ipfs.add(metadataString, {pin: true}).catch((err: Error) => {
            setMessage(`IPFS: ${err.message}`)
            setSeverity('error')
            setOpen(true)
            setMitting(false);
        });
        // création de l'addresse des meta donnée
        if (ipfsResponse) {
            const tokenURI = 'ipfs://' + ipfsResponse.cid;
            await createCompetition(tokenURI);
        }
        setMitting(false);
    }

    /**
     * Fonction qui appel le smart contract afin de créer le token
     * @param tokenURI
     */
    const createCompetition = async (tokenURI: string) => {
        setMitting(true);
        const signer = await provider?.getSigner();

        // création de l'appel du mint
        const contract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );
        let transaction;

        try {
            transaction = await contract.addCompetition(tokenURI, typeCompetition, startDate, endDate);
        }catch (e) {
            setMitting(false);
            setMessage(`Minting in error`)
            setSeverity('error')
            setOpen(true)
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        }

        // récupération de l'id du token minté
        await contract.on('*', (event) => {
            if (event.eventName == 'CompetitionSessionRegistered') {
                const id = ethers.toNumber(event.args[0]);
                setTokenId(id);
            }
        });

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
                setMitting(false);
                setMessage(`Minting in error`)
                setSeverity('error')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
            }
        })

        setOpenOption(true);
        setOpenCompetition(false);

        getTypeCompetition(typeCompetition);

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    /**
     * Fonction qui appel le smart contract afin d'ajouter les options de la compétition
     */
    const addOptionsCompetition = async () => {
        setMitting(true);
        const signer = await provider?.getSigner();

        // création de l'appel du mint
        const contract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );
        let transaction;

        try {
            transaction = await contract.addOptionsCompetition(tokenId, idsOption);
        }catch (e) {
            setMitting(false);
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
                setMitting(false);
                setMessage(`Minting in error`)
                setSeverity('error')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
            }
        })

        setOpenOption(false);
        setOpenJury(true);

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    /**
     * Fonction qui appel le smart contract afin d'ajouter les jurys de la compétition
     */
    const addJurysCompetition = async () => {
        setMitting(true);
        const signer = await provider?.getSigner();

        // création de l'appel du mint
        const contract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );
        let transaction;

        try {
            transaction = await contract.addJurysCompetition(tokenId, idsJurys);
        }catch (e) {
            setMitting(false);
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
                setMitting(false);
                setMessage(`Minting in error`)
                setSeverity('error')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
            }
        })

        setTitle('');
        setPicture('');
        idsJurys = [];
        idsOption = [];
        setTypeCompetition(0);
        setStartDate(0);
        setEndDate(0);
        setOpenJury(false);
        setOpenOption(false);
        setOpenCompetition(true);

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    /**
     * Permet en fonction du type de compétition de récupérer les données ipfs des nfts correspondant
     * @param type
     */
    const getTypeCompetition = (type: any) => {
        idsOption = [];
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

    // à récuperer sur la blockchain
    const getJury = () => {}

    /**
     * retourne le timestamp de la date selectionné
     * @param date
     */
    const getTimestamp = (date: any) => {
        const timestamp = Date.parse(date.toString());
        return Number(timestamp.toString().substring(0, 10));
    }

    /**
     * Permet de verifier les ids ajouter à la liste et d'ajouter de nouveau selectionné ou de supprimé un existant
     * @param number
     */
    const addTokenIdOption = (number: number) => {
        let contain = false;
        if(!Number.isInteger(number)){
            setMitting(false);
            setMessage(`Invalide id`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        idsOption?.map((id: number) => {
            if(id == number){
                contain = true;
            }
        })
        if(!contain){
            idsOption.push(number);
        }else{
            idsOption.splice(idsOption.indexOf(number),1);
        }
    }

    /**
     * permet d'ajouter les ids des jurys et ou les supprimer de la liste
     * @param idJury
     */
    const addJuryId = (idJury: number) => {
        let contain = false;
        if(!Number.isInteger(idJury)){
            setMitting(false);
            setMessage(`Invalide id`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        idsJurys?.map((id: number) => {
            if(id == idJury){
                contain = true;
            }
        })
        if(!contain){
            idsJurys.push(idJury);
        }else{
            idsJurys.splice(idsJurys.indexOf(idJury),1);
        }
    }

    /**
     * Choix de la photo
     * @param event
     */
    const selectedPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
        selectedPhotoToken(event, setFile, setPicture);
    };

    return (
        <div>
            <h2>Création d'une nouvelle compétition</h2>
            <section className={(!openCompetition ? 'openBlockCompetition' : '')}>
                <div className="form-ligne">
                    <label> Titre de la compétition :
                        <input name="title" type="text" onChange={e => setTitle(e.target.value)} />
                    </label>
                </div>
                <div className="form-ligne">
                    <label> Type de compétition :
                        <select name="type" onChange={e => setTypeCompetition(parseInt(e.target.value))}>
                            <option>Selectionnez le type de compétition</option>
                            <option value={1}>Acteur</option>
                            <option value={2}>Réalisateur</option>
                            <option value={3}>Film</option>
                        </select>
                    </label>
                </div>
                <div className="form-ligne">
                    <label> Debut de la compétition :
                        <input name="startDate" type="datetime-local" onChange={e => setStartDate(getTimestamp(e.target.value))} />
                    </label>
                </div>
                <div className="form-ligne">
                    <label> Fin de la competition :
                        <input name="endDate" type="datetime-local" onChange={e => setEndDate(getTimestamp(e.target.value))} />
                    </label>
                </div>
                <div className="form-ligne">
                    <label>
                        Photo :
                        <div>
                            <img src={Picture} style={{width: '200px'}}/>
                        </div>
                        <input name="Picture" type="file" onChange={selectedPhoto} />
                    </label>
                </div>

                <button onClick={verifyForm} disabled={mitting}>Ajout d'une nouvelle compétition</button>
            </section>

            <section className={(!openOption ? 'openBlockCompetition' : '')} >
                <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
                    {actors && actors.length > 0 && actors.map((actor: any, index: number) => (
                            <div key={`${actor.id}-${index}`}
                                  onClick={() => addTokenIdOption(actor.id)}>
                                <CardCompetitionSelect
                                    Info={actor.Firstname + " " + actor.Lastname}
                                    Picture={actor.Picture}
                                />
                            </div>
                        ))
                    }
                    {directors && directors.length > 0 && directors.map((director: any, index: number) => (
                            <div key={`${director.id}-${index}`}
                                  onClick={() => addTokenIdOption(director.id)}>
                                <CardCompetitionSelect
                                    Info={director.Firstname + " " + director.Lastname}
                                    Picture={director.Picture}
                                />
                            </div>
                        ))
                    }
                    {movies && movies.length > 0 && movies.map((movie: any, index: number) => (
                            <div key={`${movie.id}-${index}`}
                                  onClick={() => addTokenIdOption(movie.id)}>
                                <CardCompetitionSelect
                                    Info={movie.Title}
                                    Picture={movie.Picture}
                                />
                            </div>
                        ))
                    }
                </div>
                <button onClick={verifyFormOption} >Ajout des options de la compétition</button>
            </section>

            <section className={(!openJury ? 'openBlockCompetition' : '')}>
                <div  className="form-ligne">
                    <h5>Les Jurys : </h5>
                    <div>
                        {
                            jurys && jurys.length > 0 && jurys.map((jury: any, index: number) => {
                                const fullName = jury.Lastname + " " + jury.Firstname;
                                return (
                                    <label key={`id-${index}`}> {fullName} :
                                        <input name="jury" type="checkbox" onChange={e => addJuryId(Number(e.target.value))}
                                               value={jury.id}/>
                                    </label>
                                )
                            })
                        }
                    </div>

                    <button onClick={verifyFormJury}>Ajout des Jurys de la compétition</button>
                </div>
            </section>

            <div>
                <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
                <CompetitionDisplay tokenId={tokenId} />
            </div>
        </div>
    )
}
export default CompetitionGenerator;
