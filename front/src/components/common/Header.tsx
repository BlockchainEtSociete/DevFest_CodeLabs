import {Box} from "@mui/material";
import AppBar from "./AppBar.tsx";
const Header = () => {

    return (
        <Box sx={{textAlign: 'center', margin: '20px', clear: 'both'}}>
            <h1>DevFest Festival</h1>
            <AppBar />
            <img src="/banniere.png" alt="banniere" height='auto' width='60%' />
        </Box>
    )
}

export default Header;
