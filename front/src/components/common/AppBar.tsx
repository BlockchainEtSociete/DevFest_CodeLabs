import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import PersonPinIcon from "@mui/icons-material/PersonPin";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import useConnectedUserContext from '../../context/ConnectedUserContextHook.tsx';
import { isUserAdmin } from '../../types/ConnectedUser.ts';

function ResponsiveAppBar() {
    const {state: { connectedUser }} = useConnectedUserContext()

    const navigate = useNavigate();
    const [isMenuOpen, toggleMenu] = useState(false)

    async function accountNavigate() {
        navigate("/account")
        toggleMenu(false)
    }

    async function administrationNavigate() {
        navigate("/admin")
        toggleMenu(false)
    }

    return (
        <AppBar>
            <Box sx={{ flexGrow: 0, position: 'absolute', top: '7px', right: '30px', display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Open settings">
                    <IconButton onClick={() => toggleMenu(true)} sx={{ p: 0 }}>
                        {
                            connectedUser && connectedUser.address !== ''
                                ? <p style={{ display: 'flex', alignItems: 'center' }}><span>{connectedUser.address.substring(0, 5)}...{connectedUser.address.substring(38, 42)}</span>  <PersonPinIcon fontSize="large" /></p>
                                : <p style={{ display: 'flex', alignItems: 'center' }}><span>Mon compte</span>  <PersonPinIcon fontSize="large" /></p>
                        }
                    </IconButton>
                </Tooltip>
                <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={isMenuOpen}
                    onClose={() => toggleMenu(false)}
                >
                    {connectedUser.address && <MenuItem onClick={() => { accountNavigate() }}>
                        <Typography textAlign="center">Mon Compte</Typography>
                    </MenuItem>}
                    {connectedUser.address && isUserAdmin(connectedUser) && <MenuItem onClick={() => { administrationNavigate() }}>
                        <Typography textAlign="center">Administration</Typography>
                    </MenuItem>}
                </Menu>
            </Box>
        </AppBar >
    );
}
export default ResponsiveAppBar;
