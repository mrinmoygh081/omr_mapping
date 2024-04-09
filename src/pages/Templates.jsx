import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddForm = () => {
    // setIsLoading(true);
    const templateName = document.getElementById("templateName").value;
    const imageFile = document.getElementById("imageFile").files[0];

    setTemplates((prevTemplates) => [
      ...prevTemplates,
      { name: templateName, image: imageFile },
    ]);
  };
  // Function to navigate to "/mapping" with image data
  const handleNavigateToMapping = (template) => {
    navigate("/mapping", { state: { template } });
  };

  return (
    <>
      <Header title={"Saved Templates"} />
      <div className="container my-5">
        <div className="row">
          <div className="col-12 col-md-8">
            <div className="card card-xxl-stretch mb-5 mb-xxl-8">
              <div className="card-body py-3">
                <div className="tab-content">
                  <div className="table-responsive">
                    <table className="table table-striped table-bordered m-0">
                      <thead>
                        <tr className="border-0">
                          <th className=" min-w-150px">Saved Templates</th>
                          <th className=" min-w-140px">Action</th>
                        </tr>
                      </thead>
                      {/* <tbody>
                        <tr>
                          <td className="fw-semibold">Template </td>
                          <td>
                            <button
                              className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
                              title="View"
                              onClick={() => navigate("/mapping")}
                            >
                              <FaSearch />
                            </button>
                          </td>
                        </tr>
                      </tbody> */}
                      <tbody>
                        {templates.map((template, index) => (
                          <tr key={index}>
                            <td className="fw-semibold">{template.name}</td>
                            <td>
                              <button
                                className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
                                title="View"
                                onClick={() =>
                                  handleNavigateToMapping(template)
                                }
                              >
                                <FaSearch />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card card-xxl-stretch mb-5 mb-xxl-8">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold fs-3 mb-1">
                    Add New Template
                  </span>
                </h3>
              </div>
              <div className="card-body py-3">
                {/* <div className="pt-5">
                  <label htmlFor="templateName">Template Name</label>
                  <input
                    type="text"
                    className="form-control pb-2"
                    id="templateName"
                    name="name"
                    placeholder="Enter template name"
                  />
                </div>
                <div className="py-5">
                  <label htmlFor="templateName">OMR Image</label>
                  <input
                    type="file"
                    className="form-control pb-2"
                    id="templateName"
                    name="image"
                  />
                </div> */}
                <div className="pt-5">
                  <label htmlFor="templateName">Template Name</label>
                  <input
                    type="text"
                    className="form-control pb-2"
                    id="templateName"
                    name="name"
                    placeholder="Enter template name"
                  />
                </div>
                <div className="py-5">
                  <label htmlFor="imageFile">OMR Image</label>
                  <input
                    type="file"
                    className="form-control pb-2"
                    id="imageFile"
                    name="image"
                  />
                </div>
                <div className="text-start py-3">
                  <button
                    className="btn fw-bold btn-primary"
                    type="button"
                    onClick={handleAddForm}
                  >
                    {isLoading ? "Loading..." : "ADD"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Templates;
