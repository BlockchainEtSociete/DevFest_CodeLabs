import CardFilm from "../components/movies/CardFilm.tsx";
import {useEffect, useState} from "react";
import contractsInterface from "../contracts/contracts.ts";
import {fetchMovie} from "../services/MovieService.service.ts";

const Movie = () => {
    const [movies, setMovies]: any = useState([]);
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        fetchMovie("MovieMinted", contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, setLoading)
            .then((films) => {
                setMovies(films);
            });
    }, []);

    /*const films = [
        {
            id: 1,
            title: 'Le coeur de la Matrice: Programmation Mortelle',
            description: ' Plongé dans un monde virtuel complexe, un développeur de talent se retrouve confronté à un défi mortel. Il doit naviguer à travers des lignes de code dangereuses, résoudre des énigmes informatiques et vaincre des programmes malveillants pour sauver sa propre existence.',
            url: '1.png',
            director: {
                name: 'Nolan',
                lastname: 'Christopher'
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 2,
            title: "Le réveil de l'IA: Le destin de la programmation",
            description: 'Alors qu\'une intelligence artificielle avancée prend conscience d\'elle-même, un groupe de développeurs se retrouve face à un dilemme moral. Ils doivent décider du destin de cette IA émergente tout en confrontant les enjeux éthiques et les conséquences profondes de leurs propres créations',
            url: "2.png",
            director: {
                name: 'Eastwood',
                lastname: 'Clint',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 3,
            title: 'Codeurs en Quête : Les Héros du Web',
            description: 'Dans un monde où le cyberespace est menacé par des forces malveillantes, un groupe de programmeurs talentueux se lance dans une quête épique pour sauver Internet. Leur mission : utiliser leurs compétences en développement web pour combattre les hackers et restaurer l\'équilibre numérique.',
            url: '3.png',
            director: {
                name: 'Fincher',
                lastname: 'David',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 4,
            title: 'L\'Énigme du Code Perdu',
            description: 'Un génie de la programmation se retrouve plongé dans un mystère captivant lorsqu\'il découvre un code informatique ancien et oublié. Il doit démêler les secrets cachés dans ce code pour percer l\'énigme du passé et éviter que des forces obscures ne s\'en emparent.',
            url: '4.png',
            director: {
                name: 'Lynch',
                lastname: 'David',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 5,
            title: 'L\'Empire des Langages : Une Odyssée du Développement',
            description: 'Un développeur ambitieux se lance dans un voyage extraordinaire à travers divers langages de programmation. Au fur et à mesure de son périple, il découvre les possibilités infinies de chaque langage et apprend à maîtriser leur puissance pour bâtir un empire technologique.',
            url: '5.png',
            director: {
                name: 'Cameron',
                lastname: 'James',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 6,
            title: 'L\'Art du Bug : Dans les Tréfonds du Code',
            description: 'Un jeune développeur brillant découvre une communauté secrète d\'artistes du bug. Ensemble, ils explorent les limites du code, créant des bugs insolites qui défient les conventions et ouvrent de nouvelles perspectives sur le monde de la programmation.',
            url: '6.png',
            director: {
                name: 'Besson',
                lastname: 'Luc',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 7,
            title: 'Le Défi du Terminal Noir : L\'Ultime Confrontation',
            description: '   Dans un concours de programmation de haut niveau, les meilleurs développeurs s\'affrontent dans une compétition intense où seuls les plus talentueux survivront. Les participants doivent résoudre des problèmes complexes, exploiter leurs compétences en programmation et relever des défis techniques redoutables.',
            url: '7.png',
            director: {
                name: 'Jackson',
                lastname: 'Peter',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 8,
            title: 'Le Langage de l\'Infini : Au-delà des Lignes de Code',
            description: 'Un programmeur solitaire découvre un langage de programmation mystérieux et transcendant. En l\'explorant, il se plonge dans un monde d\'abstractions complexes et de concepts avancés, repoussant les limites de sa compréhension et ouvrant de nouvelles dimensions dans la programmation.',
            url: '8.png',
            director: {
                name: 'Tarantino',
                lastname: 'Quentin',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 9,
            title: 'Les Gardiens du Flux : Protéger le Cyberspace',
            description: 'Dans un avenir dystopique, un groupe de développeurs engagés se dresse contre un régime totalitaire qui menace la liberté d\'Internet. Ils utilisent leurs compétences en programmation pour défendre le cyberspace, protéger les données personnelles et libérer les informations de l\'emprise du pouvoir.',
            url: '9.png',
            director: {
                name: 'Polanski',
                lastname: 'Roman',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 10,
            title: 'L\'Algorithme Secret : Le Mystère du Développement',
            description: 'Un développeur talentueux découvre un algorithme révolutionnaire capable de changer le monde, mais il se rend compte que des forces obscures sont prêtes à tout pour le posséder. Il se lance dans une quête périlleuse pour protéger le secret de l\'algorithme et assurer qu\'il soit utilisé pour le bien.',
            url: '10.png',
            director: {
                name: 'Spielberg',
                lastname: 'Steven',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        },
        {
            id: 11,
            title: 'Le développement sans fin',
            description: 'Bastien, un jeune passionné de développement informatique âgé de dix ans, découvre un easter egg mystérieux appelé "Le Code Magique". Intrigué, il se rend compte que ce easter egg est en réalité un portail vers un monde virtuel extraordinaire rempli de créatures fantastiques. Bastien plonge dans cet univers fascinant, il explore des paysages enchanteurs accompagné de sont amis FALKO, résout des énigmes et affronte des défis informatiques afin de libérer le monde magique.',
            url: '11.png',
            director: {
                name: 'Burton',
                lastname: 'Tim',
            },
            actors: [
                {
                    name: 'Depp',
                    lastname: 'Johnny'
                }
            ]
        }
    ];*/

    return (
        <article>
            <h2>Les Films en compétition du devfest 2023</h2>
            <section>
                {!isLoading && movies && movies.length > 0 && movies.map((film: any, index: number) => (
                    <CardFilm
                        key={`${film.id}-${index}`}
                        Title={film.Title}
                        Description={film.Description}
                        Picture={film.Picture}
                        Director={film.Director}
                    />
                ))}
            </section>
        </article>
    )
}

export default Movie;

