import { useContext } from "react";
import { ConnectedUserContext } from "./ConnectedUserContext";

const useConnectedUserContext = () => useContext(ConnectedUserContext)

export default useConnectedUserContext;