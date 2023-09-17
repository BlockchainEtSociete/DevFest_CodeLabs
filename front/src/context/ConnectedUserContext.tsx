import { createContext, Dispatch } from 'react';
import { initialState, Action, State } from "./ConnectedUserContextState";

export interface ConnectedUserContextType {
  state: State,
  dispatch : Dispatch<Action>
}

const initContext: ConnectedUserContextType = {
  state: initialState,
  dispatch: () => initialState
}

export const ConnectedUserContext = createContext(initContext);