import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { loginHandler } from "../redux/slices/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const loginSubmit = (e) => {
    e.preventDefault();
    const { username, password } = form;
    if (username === "" || password === "") {
      toast.warning("Please enter all required fields");
      return;
    }
    const { REACT_APP_USERNAME, REACT_APP_PASSWORD } = process.env;
    if (username === REACT_APP_USERNAME && password === REACT_APP_PASSWORD) {
      dispatch(
        loginHandler({
          username: "",
          password: "",
        })
      );
      setForm({
        username: "",
        password: "",
      });
    } else {
      toast.error("Username and password must be correct");
    }
  };

  const inputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  return (
    <>
      <div className="d-flex flex-column flex-root" style={{ height: "100vh" }}>
        <div className="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center bgi-no-repeat bgi-size-contain bgi-attachment-fixed">
          <div className="d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20">
            <div className="w-lg-500px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto">
              <form className="form w-100" onSubmit={loginSubmit}>
                <div className="text-center mb-10">
                  <h1 className="text-dark mb-3">
                    Sign In to OMR Mapping Portal
                  </h1>
                </div>
                <div className="fv-row mb-10">
                  <label className="form-label fs-6 fw-bolder text-dark">
                    Username <span className="clr_red">*</span>
                  </label>

                  <input
                    className="form-control form-control-lg form-control-solid"
                    type="username"
                    name="username"
                    autoComplete="off"
                    onChange={inputChange}
                  />
                </div>
                <div className="fv-row mb-10">
                  <div className="d-flex flex-stack mb-2">
                    <label className="form-label fw-bolder text-dark fs-6 mb-0">
                      Password <span className="clr_red">*</span>
                    </label>
                  </div>
                  <input
                    className="form-control form-control-lg form-control-solid"
                    type="password"
                    name="password"
                    autoComplete="off"
                    onChange={inputChange}
                  />
                </div>
                <div className="text-center">
                  <button
                    type="submit"
                    className="btn btn-lg btn-primary w-100 mb-5"
                  >
                    {!isLoading ? (
                      <span className="indicator-label">Continue</span>
                    ) : (
                      <span className="indicator-label">Please wait...</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
