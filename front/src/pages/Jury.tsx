import {useEffect, useState} from "react";
import contractsInterface from "../contracts/contracts";
import {fetchJury, listenToNewJury} from "../services/JuryService.service";

const Jury = () => {
    const [jurys, ]: any = useState({});
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        const addToJurys = async (jury: any) => {
            if(!jurys[jury.id]){
                jurys[jury.id] = jury;
            }
        }

        fetchJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, setLoading, addToJurys).then();
        listenToNewJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, addToJurys).then();
    }, [jurys])

    return (
        <div>
            <h2>Les Jurys des compétitions du devfest 2023</h2>

            <section style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
                {!isLoading && jurys && Object.keys(jurys).length > 0 && Object.keys(jurys).map((jury: any, index: number) => (
                    <div  key={`${jurys[jury].id}`} style={{width: '500px', height: '300px'}}>
                        <img src={jurys[jury].Picture} alt={jurys[jury].Firstname + ' ' + jurys[jury].Lastname} style={{width: '400px', height: '200px'}}/>
                    </div>
                ))}
            </section>
        </div>
    )
}
export default Jury;
