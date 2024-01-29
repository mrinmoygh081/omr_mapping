import "./assets/css/loading.css";
import "./assets/css/style.bundle.css";
import "./assets/css/main.css";
import Layout from "./Layout";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <Layout />
      <ToastContainer />
    </>
  );
}

export default App;
