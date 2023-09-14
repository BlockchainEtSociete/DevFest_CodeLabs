import './App.css'
import Header from './components/common/Header.tsx';
import {BrowserRouter as Router} from "react-router-dom";
import NavTab from "./components/common/NavTabs.tsx";
import Footer from "./components/common/Footer.tsx";
import ConnectedUserContextProvider from './context/ConnectedUserContextProvider.tsx';

function App() {
  return (
    <ConnectedUserContextProvider>
      <Router>
          <Header />
          <NavTab />
          <Footer />
      </Router>
    </ConnectedUserContextProvider>
  )
}

export default App;
