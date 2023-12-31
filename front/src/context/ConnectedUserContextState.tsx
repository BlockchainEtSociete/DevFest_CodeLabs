import { AccessRights, ConnectedUser } from '../types/ConnectedUser';
import { JsonRpcSigner } from 'ethers';

export interface State {
    connectedUser: ConnectedUser
}
const initialState: State = {
    connectedUser: { accessRights: { canAddPeople: false, canAddMovie: false, canAddCompetition: false, canAddJury: false, isJury: false }, address: '', juryId: -1 }
}

enum Actions {
    UPDATE_USER,
    UPDATE_RIGHTS,
    DISCARD_USER
}

export interface Action {
    type: Actions;
    data?: JsonRpcSigner | {accessRights: AccessRights, juryId: number};
}

const reducer = (state: State, action: Action) => {
    const { type, data } = action;
    switch (type) {
        case Actions.UPDATE_USER:
            state.connectedUser.signer = data as JsonRpcSigner
            state.connectedUser.address = (data as JsonRpcSigner)?.address || ''
            return { ...state }
        case Actions.UPDATE_RIGHTS:
            const { accessRights, juryId } = data as { accessRights: AccessRights, juryId: number };
            state.connectedUser.accessRights = accessRights;
            state.connectedUser.juryId = juryId;
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