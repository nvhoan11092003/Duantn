import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import { HomePage } from "../../../pages"


const LayoutWebsite = () => {
  return (
      <div>
          <Header/>
          <HomePage/>
          <Outlet/>
          <Footer/>
    </div>
  )
}

export default LayoutWebsite