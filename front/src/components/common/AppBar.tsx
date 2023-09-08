import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import PersonPinIcon from "@mui/icons-material/PersonPin";
import SnackbarAlert from "../common/SnackbarAlert.tsx";
import {AlertColor} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {useSyncExternalStore, useState, useEffect} from "react";
import { connectedUserStore } from "../../provider/ConnectedUserStore.ts";
import { provider } from "../../provider/providers.ts";

function ResponsiveAppBar() {
    const navigate = useNavigate();
    const [, setRefresh] = useState(false);
    const connectedUser = useSyncExternalStore(connectedUserStore.subscribe, connectedUserStore.getSnapshot)
    const [isMenuOpen, toggleMenu] = useState(false)

    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')

    // Refresh appbar on chain or account change
    useEffect(() => {
        const events = ["chainChanged", "accountsChanged"];
        const handleChange = async () => {
            const signer = await provider?.getSigner()

            if (signer) {
                await connectedUserStore.updateConnectedUser(signer)
                setRefresh(refresh => !refresh)
                toggleMenu(false)
            }
        };

        events.forEach(e => window.ethereum.on(e, handleChange));
        return () => {
            events.forEach(e => window.ethereum.removeListener(e, handleChange));
        };
    }, [connectedUserStore, connectedUser]);

    async function accountNavigate() {
        if (connectedUser.address) {
            navigate("/account")
            toggleMenu(false)
        }
    }

    async function administrationNavigate() {
        if (connectedUser.address && connectedUserStore.isAdmin()) {
            navigate("/admin")
            toggleMenu(false)
        }
    }

    const connect = async () => {
        if (provider) {
            setOpen(false)
            provider.send("eth_requestAccounts", []).then(async () => {
                const signer = await provider?.getSigner()

                if (signer) {
                    await connectedUserStore.updateConnectedUser(signer)
                    toggleMenu(false)
                }
            })
        }
    }

    const disconnect = () => {
        connectedUserStore.resetConnectedUser()
        navigate("/");
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
                    {connectedUser.address && connectedUserStore.isAdmin() && <MenuItem onClick={() => { administrationNavigate() }}>
                        <Typography textAlign="center">Administration</Typography>
                    </MenuItem>}
                    {
                        connectedUser.address !== ''
                            ? <MenuItem onClick={disconnect}>
                                <Typography textAlign="center">Logout</Typography>
                            </MenuItem>
                            : <MenuItem onClick={connect}>
                                <Typography textAlign="center">Connexion</Typography>
                            </MenuItem>
                    }
                </Menu>
            </Box>
            <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
        </AppBar >
    );
}
export default ResponsiveAppBar;
