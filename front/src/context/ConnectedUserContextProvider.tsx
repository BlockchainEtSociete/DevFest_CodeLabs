import { ReactNode, useEffect, useReducer, useCallback,  } from 'react';
import { ConnectedUserContext } from "./ConnectedUserContext";
import { reducer, Actions, initialState } from "./ConnectedUserContextState";
import { provider } from "../provider/providers.ts";
import { computeAccessRights } from "../services/AccessRights.service.ts";

export default ({children}: {children:ReactNode}) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const initUser = useCallback(async () => {
        if (window.ethereum.isConnected()) {
            const signer = await provider?.getSigner()
            if (signer) {
                dispatch({type: Actions.UPDATE_USER, data: signer})
                const accessRights = await computeAccessRights(signer.address)
                dispatch({type: Actions.UPDATE_RIGHTS, data: accessRights})
            }
        } else {
            dispatch({type: Actions.DISCARD_USER})
        }
    }, [])

    useEffect(() => {
        initUser()
        const events = ["chainChanged", "accountsChanged", "connect", "disconnect"];
        const handleChange = () => {
            initUser();
        };
    
        events.forEach(e => window.ethereum.on(e, handleChange));
        return () => {
            events.forEach(e => window.ethereum.removeListener(e, handleChange));
        };
    }, []);

    return (
        <ConnectedUserContext.Provider value={{state, dispatch}}>
            {children}
        </ConnectedUserContext.Provider>
    )
}