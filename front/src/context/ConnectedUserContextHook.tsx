import { useContext } from "react";
import { ConnectedUserContext, ConnectedUserContextType } from "./ConnectedUserContext";

const useConnectedUserContext = () => useContext(ConnectedUserContext) as unknown as ConnectedUserContextType;

export default useConnectedUserContext;