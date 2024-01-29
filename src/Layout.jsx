import React from "react";
import Login from "./pages/Login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import TemplateMapping from "./pages/TemplateMapping";
import Templates from "./pages/Templates";
import { useSelector } from "react-redux";

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
            </>
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Layout;
