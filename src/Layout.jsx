import React from "react";
import Login from "./pages/Login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import TemplateMapping from "./pages/TemplateMapping";
import Templates from "./pages/Templates";
import { useSelector } from "react-redux";
import Templateimage from "./pages/Templateimage";

const Layout = () => {
  const auth = useSelector((state) => state.auth.value);
  return (
    <>
      <BrowserRouter>
        <Routes>
          {!auth ? (
            <>
              <Route path="/" element={<Login />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Templates />} />
              <Route path="/mapping" element={<TemplateMapping />} />
              <Route path="/mappingimage" element={<Templateimage />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
