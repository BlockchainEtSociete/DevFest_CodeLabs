import {ChangeEvent, useState} from "react";
import {AlertColor} from "@mui/material";
import contractsInterface from "../../contracts/contracts.ts";
import CardCompetitionSelect from "./CardCompetitionSelect.tsx";
import {ethers} from "ethers";
import SnackbarAlert from "../common/SnackbarAlert.tsx";
import ipfs from "../common/ipfs.ts";
import {CompetitionMetadata} from "../../types/Metadata.ts";
import {provider} from "../../provider/providers.ts";
import CompetitionDisplay from "./CompetitionDisplay.tsx";

const CompetitionGenerator = () => {
    const [mitting, setMitting] = useState(false);

    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')

    const [directors, setDirectors]: any = useState([]);
    const [actors, setActors]: any = useState([]);
    const [movies, setMovies]: any = useState([]);

    const [title, setTitle]: any = useState('');
    let idsJurys: number[] = [];
    let idsOption: number[] = [];
    const [Picture, setPicture]: any = useState('');
    const [typeCompetition, setTypeCompetition]: any = useState(0);
    const [startDate, setStartDate]: any = useState(0);
    const [endDate, setEndDate]: any = useState(0);

    const [, setFile] = useState(null);
    const [tokenId, setTokenId]: any = useState(0);

    // à récuperer sur la blockchain
    const jurysBlock: any = [
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

    /**
     * Verification des données avant sauvegarde dans la blockchain
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
        idsOption.map((id: number) => {
            if(!Number.isInteger(id)){
                setMitting(false);
                setMessage(`Invalide id`)
                setSeverity('error')
                setOpen(true)
                return false;
            }
        })
        idsJurys.map((id: number) => {
            if(!Number.isInteger(id)){
                setMitting(false);
                setMessage(`Invalide id`)
                setSeverity('error')
                setOpen(true)
                return false;
            }
        })

        // Upload de l'image sur ipfs
        const PictureFile = await dataUrlToFile(`data:image/*;${Picture}`)
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
     * Fonction qui appel le smart contract afin de creer le token
     * @param tokenURI
     */
    async function createCompetition(tokenURI: string) {
        setMitting(true);
        const signer = await provider?.getSigner();

        // création de l'appel du mint
        const contract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );
        const transaction = await contract.addCompetition(idsJurys, tokenURI, idsOption, typeCompetition, startDate, endDate);

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
                setTitle('');
                setPicture('');
                idsJurys = [];
                idsOption = [];
                setTypeCompetition(0);
                setStartDate(0);
                setEndDate(0);
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

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    /**
     * Permet en fonction du type de compétition de récupérer les données ipfs des nfts correspondant
     * @param type
     */
    function getTypeCompetition(type: any){
        setTypeCompetition(type)
        setTitle("");
        idsOption = [];
        setActors([]);
        setDirectors([]);
        setMovies([]);

       /* if(type == 1){
            setTitle("Les Acteurs en compétition pour le chevrons d'argent");
            fetchPeople("ActorMinted", contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, setLoading)
                .then((peoples) => {
                    setActors(peoples);
                });
        } else if(type == 2){
            setTitle("Les Réalisateurs en compétition pour la parenthèse de cristal");
            fetchPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, setLoading)
                .then((peoples) => {
                    setDirectors(peoples);
                });
        } else {
            setTitle("Les Films en compétition pour l'accolade d'or");
            fetchMovie("MovieMinted", contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, setLoading)
                .then((films) => {
                    setMovies(films);
                });
        }*/
    }

    /**
     * retourne le timestamp de la date selectionné
     * @param date
     */
    function getTimestamp(date: any){
        const timestamp = Date.parse(date.toString());
        return Number(timestamp.toString().substring(0, 10));
    }

    /**
     * Permet de verifier les ids ajouter à la liste et d'ajouter de nouveau selectionné ou de supprimé un existant
     * @param number
     */
    function addTokenIdOption(number: number){
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
     * permet de verifier les addresses des jurys et de les ajouter ou supprimer a la liste
     * @param idJury
     */
    function addJuryId(idJury: number){
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
    const selectedPhoto = (event: ChangeEvent<HTMLInputElement>) => {
        const filesUploaded = event.currentTarget.files;
        if (filesUploaded && filesUploaded.length > 0) {
            setPictureBase64(filesUploaded[0]);
        }
    };

    /**
     * Set l'url de la photo
     * @param file
     */
    const setPictureBase64 = (file: any) => {
        setFile(file);
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            setPicture(reader.result as string);
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    };

    /**
     * création d'un fichier a partir d'une url base 64
     * @param src
     */
    const dataUrlToFile = async (src: string) => {
        return (fetch(src)
            .then(function (res) {
                return res.arrayBuffer();
            }))
            .then(function (buf) {
                return new File([buf], 'people.jpg', {type: 'image/*'});
            })
    };


    return (
        <div>
            <h2>Création d'une nouvelle compétition</h2>
            <div className="form-ligne">
                <p>Titre de la compétition : <b>{title}</b></p>
                <label> Type de compétition :
                    <select name="type" onChange={e => getTypeCompetition(parseInt(e.target.value))}>
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

            <section style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
                {actors && actors.length > 0 && actors.map((actor: any, index: number) => (
                        <div  key={`${actor.id}-${index}`}
                              onClick={() => addTokenIdOption(actor.id)}>
                            <CardCompetitionSelect
                                Info={actor.Firstname + " " + actor.Lastname}
                                Picture={actor.Picture}
                            />
                        </div>
                    ))
                }
                {directors && directors.length > 0 && directors.map((director: any, index: number) => (
                    <div  key={`${director.id}-${index}`}
                          onClick={() => addTokenIdOption(director.id)}>
                        <CardCompetitionSelect
                            Info={director.Firstname + " " + director.Lastname}
                            Picture={director.Picture}
                        />
                    </div>
                ))
                }
                {movies && movies.length > 0 && movies.map((movie: any, index: number) => (
                    <div  key={`${movie.id}-${index}`}
                          onClick={() => addTokenIdOption(movie.id)}>
                        <CardCompetitionSelect
                            Info={movie.Title}
                            Picture={movie.Picture}
                        />
                    </div>
                ))
                }
            </section>
            <div  className="form-ligne">
                <h5>Les Jurys : </h5>
                {
                    jurysBlock && jurysBlock.length > 0 && jurysBlock.map((juryB: any, index: number) => {
                        const fullName = juryB.Lastname + " " + juryB.Firstname;
                        return (
                            <label key={`id-${index}`}> {fullName} :
                                <input name="jury" type="checkbox" onChange={e => addJuryId(Number(e.target.value))}
                                       value={juryB.id}/>
                            </label>
                        )
                    })
                }
            </div>

            <button onClick={verifyForm} disabled={mitting}>Ajout d'une nouvelle compétition</button>

            <div>
                <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
                <CompetitionDisplay tokenId={tokenId} />
            </div>
        </div>
    )
}
export default CompetitionGenerator;
