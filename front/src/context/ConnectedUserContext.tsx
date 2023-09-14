import { createContext, Dispatch } from 'react';
import { initialState, Action, State } from "./ConnectedUserContextState";

export interface ConnectedUserContextType {
  state: State,
  dispatch : Dispatch<Action>
}

const initContext = {
  state: initialState,
  dispatch: () => initialState
}
const context = createContext(initContext)

export const ConnectedUserContext = createContext(context);