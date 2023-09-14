import { Link, matchPath, Route, Routes, useLocation } from 'react-router-dom';
import {Box, Tab, Tabs} from "@mui/material";
import Home from "../../pages/Home.tsx";
import Administrator from "../../pages/Administrator.tsx";
import Jury from "../../pages/Jury.tsx";
import Actor from "../../pages/Actor.tsx";
import Movie from "../../pages/Movie.tsx";
import Director from "../../pages/Director.tsx";
import Competition from "../../pages/Competition.tsx";
import Account from "../../pages/Account.tsx";
import Vote from "../../pages/Vote.tsx";
import useConnectedUserContext from '../../context/ConnectedUserContextHook.tsx';

const useRouteMatch = (patterns: string[]) => {
    const { pathname } = useLocation();

    for (const element of patterns) {
        const pattern = element;
        const possibleMatch = matchPath(pattern, pathname);
        if (possibleMatch !== null) {
            return possibleMatch;
        }
    }
    return null;
}

const NavTab = () => {
    const routeMatch = useRouteMatch(['/', '/jury', '/acteur', '/film', '/realisateur', '/competition', '/account', '/vote']);
    const currentTab = routeMatch?.pattern?.path || '/';

    const { state: { connectedUser } } = useConnectedUserContext();
    const { isJury } = connectedUser.accessRights

    return (
        <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', textAlign: 'center' }}>
                <Tabs
                    centered
                    value={currentTab}
                    TabIndicatorProps={{style: {background:'#f2c684'}}}>
                    <Tab label="Accueil" value='/' to='/' component={Link}/>
                    <Tab label="Films" value='/film' to='/film' component={Link} />
                    <Tab label="Acteurs" value='/acteur' to='/acteur' component={Link} />
                    <Tab label="Realisateurs" value='/realisateur' to='/realisateur' component={Link} />
                    <Tab label="Jurys" value='/jury' to='/jury' component={Link} />
                    <Tab label="Compétitions" value="/competition" to="/competition" component={Link} />
                    {isJury && <Tab label="Voter👍👎" value="/vote" to="/vote" component={Link} />}
                </Tabs>
                <Routes>
                    <Route path="/" element={<Box sx={{ paddingLeft: 3, paddingRight: 3, width: "100%" }}><Home /></Box>}></Route>
                    <Route path="/admin" element={<Box sx={{ paddingLeft: 3, paddingRight: 3, width: "100%" }}><Administrator /></Box>}></Route>
                    <Route path="/account" element={<Box sx={{ paddingLeft: 3, paddingRight: 3, width: "100%" }}><Account /></Box>}></Route>
                    <Route path="/jury" element={<Box sx={{ paddingLeft: 3, paddingRight: 3, width: "100%" }}><Jury /></Box>}></Route>
                    <Route path="/acteur" element={<Box sx={{ paddingLeft: 3, paddingRight: 3, width: "100%" }}><Actor /></Box>}></Route>
                    <Route path="/realisateur" element={<Box sx={{ paddingLeft: 3, paddingRight: 3, width: "100%" }}><Director /></Box>}></Route>
                    <Route path="/film" element={<Box sx={{ paddingLeft: 3, paddingRight: 3, width: "100%" }}><Movie /></Box>}></Route>
                    <Route path="/competition" element={<Box sx={{ paddingLeft: 3, paddingRight: 3, width: "100%" }}><Competition /></Box>}></Route>
                    <Route path="/vote" element={<Box sx={{ paddingLeft: 3, paddingRight: 3, width: "100%" }}><Vote /></Box>}></Route>
                </Routes>
            </Box>
        </>
    )
}
export default NavTab;
