import "./index.css"
import "./Login.css"
import ReactDOM from "react-dom/client"
import 'bootstrap/dist/css/bootstrap.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./Login.jsx"
import Create from "./Create.jsx"
import Songs from "./Songs.jsx"
import Navbar from "./components/Navbar.jsx"

function Main() {
  return (
    <BrowserRouter>
      <Navbar></Navbar>
      <Routes>
        <Route path="*" element={<Login />} />
        <Route path="/create" element={<Create />} />
        <Route path="/songs" element={<Songs />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<Main />)