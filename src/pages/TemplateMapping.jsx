import React, { useEffect, useState } from "react";
import { FaMinus, FaPlus, FaSearch } from "react-icons/fa";
import { PiCursor, PiCursorBold } from "react-icons/pi";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import { CiEdit } from "react-icons/ci";

import map1 from "../data/map1.json";

const TemplateMapping = () => {
  const [data, setData] = useState(map1);

  // useEffect(() => {
  //   if (map1) {
  //     setData(map1);
  //   }
  // }, [map1]);

  const handleDropDown = (item) => {
    console.log(item);
  };

  return (
    <>
      <div className="map_header shadow">
        <div className="container">
          <ul>
            <li>
              <button
                className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
                title="Zoom"
              >
                <FaSearch />
              </button>
            </li>
            <li>
              <button
                className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
                title="Zoom"
              >
                <CiEdit />
              </button>
            </li>
            <li>
              <button
                className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
                title="Zoom"
              >
                <PiCursorBold />
              </button>
            </li>
            <li>
              <button
                className="btn btn-icon btn-dark btn-active-color-primary btn-sm me-1"
                title="Zoom"
              >
                <FaSearch />
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-12 col-md-8">
            <div className="mapping_image">
              <img
                src={require("../uploads/omr.jpg")}
                alt=""
                className="w-100"
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="mapping_data">
              <ul>
                {data &&
                  data.map((item, i) => (
                    <li key={i}>
                      <p onClick={() => handleDropDown(item)}>
                        {item?.type === "checker-group" ? (
                          item?.isOpen ? (
                            <>
                              <FaPlus className="plusminus" />{" "}
                              <BsCheckAll className="type" />{" "}
                              <span>{item?.name}</span>
                            </>
                          ) : (
                            <>
                              <FaMinus className="plusminus" />{" "}
                              <BsCheckAll className="type" />{" "}
                              <span>{item?.name}</span>
                            </>
                          )
                        ) : (
                          <span>
                            <BsCheck className="type" /> {item?.name}
                          </span>
                        )}
                      </p>
                      {item?.type === "checker-group" && (
                        <ul className="drop">
                          {item?.child.length > 0 &&
                            item?.child.map((it, index) => (
                              <li key={index}>{it?.name}</li>
                            ))}
                        </ul>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateMapping;
