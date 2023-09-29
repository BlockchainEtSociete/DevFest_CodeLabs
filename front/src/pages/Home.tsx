import useConnectedUserContext from '../context/ConnectedUserContextHook.tsx';
import Card from "../components/common/Card.tsx";

const Home = () => {
    const { state: { connectedUser } } = useConnectedUserContext();
    const { isJury } = connectedUser.accessRights
    const categories = [
        {
            id: 1,
            title: 'Les Films en compétition pour l\'accolade d\'or',
            type: 'Film',
            url: 'https://imgsrc.cineserie.com/2017/02/Filmandclapboard.jpg?ver=1'
        },
        {
            id: 2,
            title: 'Les Acteurs en compétition pour le chevrons d\'argent',
            type: 'Acteur',
            url: 'https://img-0.journaldunet.com/VMdAj3ruYZOCE70PjSNf30TEusw=/1500x/smart/cd49f961c3054ac39038002d7644449d/ccmcms-jdn/10694673.jpg'
        },
        {
            id: 3,
            title: 'Les Réalisateurs en compétition pour la parenthèse de cristal',
            type: 'Realisateur',
            url: 'https://devenir-realisateur.com/wp-content/uploads/2017/03/chaise-realisateur.jpg'
        }
    ];

    return (
        <article style={ { textAlign: 'center' } }>
            <h2>Bienvenue à l'incroyable Saga du DevFest { isJury && ", cher Jury" }</h2>
            { isJury &&
                <div style={ { fontStyle: "italic", color: "red" } }>En tant que Jury vous pouvez dès présent voter,
                    rendez-vous dans l'onglet "Voter"</div> }
            <div style={ {
                width: '70%',
                textAlign: 'justify',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                margin: 'auto'
            } }>
                <p>Ce festival fictif a entièrement été créer dans le but d'une démonstration d'un cas d'usage de la
                    blockchain,
                    Dans le cadre d'un atelier codeLabs du DevFest Nantes 2023. <br/>
                    Les films (titre, synopsy, affiche) ainsi que les images des acteurs et des réalisateurs ont été
                    réalisés par une IA. <br/>
                    Nous vous invitons à découvrire notre univers ainsi que les nominé de chaque compétitions de
                    l'édition 2023.</p>
                <h4>Présentation</h4>
                <p>Le Festival du Cinéma du DevFest a une renommée internationale et récompense les meilleures œuvres
                    cinématographiques de la communauté des développeurs.
                    Les organisateurs du festival ont émis le souhait de moderniser le processus de récompense en
                    utilisant la technologie des NFT. Votre mission,
                    si vous l'acceptez, est de réaliser cette application en permettant aux organisateurs de
                    sélectionner les films nominés,
                    de définir les membres du jury, d'organiser des votes par le jury et de remettre les prix aux
                    lauréats.</p>
            </div>

            <section style={ { display: 'flex', justifyContent: 'center', alignItems: 'center' } }>
                <h5>Une idée original de : </h5>
                <div style={ { margin: '25px' } }>
                    <img src="/logo_bs.png" alt="logo blockchain et société" height='auto' width='130'/>
                </div>
            </section>

            <section>
                <h3 className="h3">Les sélectionnés de l'édition 2023</h3>
                <div style={ { display: 'flex', justifyContent: 'center', flexWrap: 'wrap' } }>
                    { categories.map( ( category ) => (
                        <Card
                            key={ category.id }
                            type={ category.type }
                            url={ category.url }
                        />
                    ) ) }
                </div>
            </section>
        </article>
    )
}
export default Home;
