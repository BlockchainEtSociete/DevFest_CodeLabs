import { AccessRights, ConnectedUser } from '../types/ConnectedUser';
import { JsonRpcSigner } from 'ethers';

export interface State {
    connectedUser: ConnectedUser
}
const initialState: State = {
    connectedUser: { accessRights: { canAddPeople: false, canAddMovie: false, canAddCompetition: false, canAddJury: false, isJury: false }, address: '' }
}

enum Actions {
    UPDATE_USER,
    UPDATE_RIGHTS,
    DISCARD_USER
}

export interface Action {
    type: Actions;
    data?: JsonRpcSigner | AccessRights;
}

const reducer = (state: State, action: Action) => {
    const { type, data } = action;
    switch (type) {
        case Actions.UPDATE_USER:
            state.connectedUser.signer = data as JsonRpcSigner
            state.connectedUser.address = (data as JsonRpcSigner)?.address || ''
            return { ...state }
        case Actions.UPDATE_RIGHTS:
            state.connectedUser.accessRights = data as AccessRights
            return { ...state }
        case Actions.DISCARD_USER:
            state.connectedUser = initialState.connectedUser
            return { ...state }
    }
};

export {
    initialState,
    Actions,
    reducer
}