import React, { useEffect, useState, useCallback } from "react";
import MappingDataComponent from "../services/MappingDataComponent";

import ButtonListComponent from "../services/ButtonListComponent";
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

function Templateimage({ images }) {
  const [newBoxName, setNewBoxName] = useState("");
  const [image, setImage] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [startCoordinates, setStartCoordinates] = useState({
    x: null,
    y: null,
  });
  const [drMode, setDrMode] = useState(false);
  const [endCoordinates, setEndCoordinates] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawingModeparent, setDrawingModeparent] = useState(false);
  const [drawingModeAnchor, setDrawingModeAnchor] = useState(false);
  const [drawingModechild, setDrawingModechild] = useState(false);
  const [drawingModeRollNo, setdrawingModeRollNo] = useState(false);
  const [drawingModeQuestionpaper, setDrawingModeQuestionpaper] =
    useState(false);
  const [boxNameInput, setBoxNameInput] = useState("");

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draggedBoxIndex, setDraggedBoxIndex] = useState(null);
  const [originalMousePosition, setOriginalMousePosition] = useState(null);
  const [translation, setTranslation] = useState({ x: 0, y: 0 });
  const [zoomFactor, setZoomFactor] = useState(1);
  // ****************************************************
  const handleMouseDownOnBox = (event, index) => {
    setDraggedBoxIndex(index);
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setOriginalMousePosition({ x, y });
  };

  const handleMouseUpOnBox = () => {
    setDraggedBoxIndex(null);
    setOriginalMousePosition(null);
  };

  const handleMouseMoveOnBox = (event) => {
    if (drMode && draggedBoxIndex !== null && originalMousePosition !== null) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const deltaX = x - originalMousePosition.x;
      const deltaY = y - originalMousePosition.y;

      const updatedBoxes = [...boxes];
      const draggedBox = updatedBoxes[draggedBoxIndex];

      draggedBox.start.x += deltaX;
      draggedBox.start.y += deltaY;
      draggedBox.end.x += deltaX;
      draggedBox.end.y += deltaY;

      if (draggedBox.mode === "parent") {
        draggedBox.children.forEach((childBox) => {
          childBox.start.x += deltaX;
          childBox.start.y += deltaY;
          childBox.end.x += deltaX;
          childBox.end.y += deltaY;
        });
      }

      setBoxes(updatedBoxes);
      setOriginalMousePosition({ x, y });
      draw();
    }
  };

  // ****************************************************

  // Function to add state to history
  const addToHistory = (newState) => {
    setHistory((prevHistory) => [
      ...prevHistory.slice(0, historyIndex + 1),
      newState,
    ]);
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };

  // Function to handle undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prevIndex) => prevIndex - 1);
      setBoxes(history[historyIndex - 1]);
    }
  };

  // useEffect to update history whenever boxes state changes
  useEffect(() => {
    addToHistory(boxes);
  }, [boxes]);

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const uniqueNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
    return parseInt(`${timestamp}${uniqueNumber}`) % 1000000;
  };

  const uploadImage = (image) => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    const img = new Image();
    img.src = URL.createObjectURL(image);
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    // console.log("Hey i am image", image);
    setImage(img);
    setTranslation({ x: 0, y: 0 }); // Reset translation when a new image is loaded
  };

  const handleMouseDown = (event) => {
    if (drMode) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomFactor - translation.x;
      const y = (event.clientY - rect.top) / zoomFactor - translation.y;

      // Check if the click is inside any of the boxes or their children
      let clickedBoxIndex = -1;
      let clickedChildIndex = -1;

      boxes.forEach((box, index) => {
        if (
          x >= box.start.x &&
          x <= box.end.x &&
          y >= box.start.y &&
          y <= box.end.y
        ) {
          clickedBoxIndex = index;
        }

        if (box.mode === "parent" && box.children) {
          box.children.forEach((childBox, childIndex) => {
            if (
              x >= childBox.start.x &&
              x <= childBox.end.x &&
              y >= childBox.start.y &&
              y <= childBox.end.y
            ) {
              clickedBoxIndex = index;
              clickedChildIndex = childIndex;
            }
          });
        }
      });

      // If a box or its child is clicked, select it
      if (clickedBoxIndex !== -1) {
        handleSelectBoxClick(clickedBoxIndex);
      }

      if (clickedChildIndex !== -1) {
        handleSelectChildBoxClick(clickedChildIndex, clickedBoxIndex);
      }

      // Check if the click is inside the selected box
      if (selectedBoxIndex !== null) {
        const selectedBox = boxes[selectedBoxIndex];
        const { start, end } = selectedBox;

        // Calculate the coordinates relative to the canvas
        const x = (event.clientX - rect.left) / zoomFactor - translation.x;
        const y = (event.clientY - rect.top) / zoomFactor - translation.y;

        // Check if the click is inside the selected box
        if (x >= start.x && x <= end.x && y >= start.y && y <= end.y) {
          setDragging(true);
          setStartCoordinates({ x, y });
          setOriginalMousePosition({ x, y });
        }
      }
    } else if (
      drawingModeparent ||
      drawingModechild ||
      drawingModeRollNo ||
      drawingModeQuestionpaper ||
      drawingModeAnchor
    ) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomFactor - translation.x;
      const y = (event.clientY - rect.top) / zoomFactor - translation.y;

      setStartCoordinates({ x, y });
      setEndCoordinates({ x, y });
      setDragging(true);
    }
  };

  // const handleMouseUp = () => {
  //   if (dragging && drMode) {
  //     // if (startCoordinates.x !== null && endCoordinates.x !== null) {
  //     //   // Update the coordinates of the selected box
  //     //   const deltaX = endCoordinates.x - startCoordinates.x;
  //     //   const deltaY = endCoordinates.y - startCoordinates.y;
  //     //   // if (selectedBoxIndex !== null) {
  //     //   //   const updatedBoxes = [...boxes];
  //     //   //   const selectedBox = updatedBoxes[selectedBoxIndex];
  //     //   //   // selectedBox.start.x += deltaX;
  //     //   //   // selectedBox.start.y += deltaY;
  //     //   //   // selectedBox.end.x += deltaX;
  //     //   //   // selectedBox.end.y += deltaY;
  //     //   //   // If the selected box is a parent, update the coordinates of its children
  //     //   //   if (selectedBox.mode === "parent") {
  //     //   //     selectedBox.children.forEach((childBox) => {
  //     //   //       childBox.start.x += deltaX;
  //     //   //       childBox.start.y += deltaY;
  //     //   //       childBox.end.x += deltaX;
  //     //   //       childBox.end.y += deltaY;
  //     //   //     });
  //     //   //   }
  //     //   //   // setBoxes(updatedBoxes);
  //     //   //   setBoxes([...boxes, updatedBoxes]);
  //     //   // }
  //     // }
  //     setDragging(false);
  //     setStartCoordinates({ x: null, y: null });
  //     setEndCoordinates({ x: null, y: null });
  //     setOriginalMousePosition(null);
  //   } else if (drawingMode) {
  //     setDragging(false);

  //     if (startCoordinates.x !== null && endCoordinates.x !== null) {
  //       const minHeight = 7; // Minimum height requirement
  //       const minWidth = 7; // Minimum width requirement

  //       // Calculate height and width of the box
  //       const height = Math.abs(endCoordinates.y - startCoordinates.y);
  //       const width = Math.abs(endCoordinates.x - startCoordinates.x);

  //       // Check if height and width meet the minimum requirement
  //       if (height >= minHeight && width >= minWidth) {
  //         let newBox;

  //         if (drawingModeparent) {
  //           newBox = {
  //             id: generateUniqueId(),
  //             name: newBoxName,
  //             start: { ...startCoordinates },
  //             end: { ...endCoordinates },
  //             mode: "parent",
  //             height: Math.abs(endCoordinates.y - startCoordinates.y),
  //             width: Math.abs(endCoordinates.x - startCoordinates.x),
  //             children: [],
  //           };
  //         } else if (drawingModechild) {
  //           newBox = {
  //             id: generateUniqueId(),
  //             name: newBoxName,
  //             start: { ...startCoordinates },
  //             end: { ...endCoordinates },
  //             mode: "child",
  //             height: Math.abs(endCoordinates.y - startCoordinates.y),
  //             width: Math.abs(endCoordinates.x - startCoordinates.x),
  //           };

  //           const insideParent = boxes.some(
  //             (box) =>
  //               box.mode === "parent" &&
  //               newBox.start.x > box.start.x &&
  //               newBox.start.y > box.start.y &&
  //               newBox.end.x < box.end.x &&
  //               newBox.end.y < box.end.y
  //           );
  //           console.log("insideParent", insideParent);

  //           if (insideParent) {
  //             const parentIndex = boxes.findIndex(
  //               (box) =>
  //                 box.mode === "parent" &&
  //                 newBox.start.x > box.start.x &&
  //                 newBox.start.y > box.start.y &&
  //                 newBox.end.x < box.end.x &&
  //                 newBox.end.y < box.end.y
  //             );
  //             console.log("parentIndex", parentIndex);

  //             const updatedBoxes = [...boxes];
  //             updatedBoxes[parentIndex].children.push(newBox);
  //             setBoxes(updatedBoxes);

  //             return;
  //           }
  //         } else {
  //           console.log("hello");
  //         }

  //         setBoxes([...boxes, newBox]);
  //         // console.log("hello jii ", boxes);
  //         setBoxNameInput("");
  //         console.log(
  //           "Boxes data:",
  //           JSON.stringify([...boxes, newBox], null, 2)
  //         );
  //       } else {
  //         console.log("Minimum height and width requirement not met");
  //       }
  //     }
  //   }
  // };

  const handleMouseUp = () => {
    if (dragging && drMode) {
      setDragging(false);
      setStartCoordinates({ x: null, y: null });
      setEndCoordinates({ x: null, y: null });
      setOriginalMousePosition(null);
    } else if (drawingMode) {
      setDragging(false);

      if (startCoordinates.x !== null && endCoordinates.x !== null) {
        const minHeight = 7; // Minimum height requirement
        const minWidth = 7; // Minimum width requirement

        // Calculate height and width of the box
        const height = Math.abs(endCoordinates.y - startCoordinates.y);
        const width = Math.abs(endCoordinates.x - startCoordinates.x);

        // Check if height and width meet the minimum requirement
        if (height >= minHeight && width >= minWidth) {
          let newBox;

          if (drawingModeparent) {
            newBox = {
              id: generateUniqueId(),
              name: newBoxName,
              start: { ...startCoordinates },
              end: { ...endCoordinates },
              mode: "parent",
              height: Math.abs(endCoordinates.y - startCoordinates.y),
              width: Math.abs(endCoordinates.x - startCoordinates.x),
              children: [],
            };
          } else if (drawingModechild) {
            newBox = {
              id: generateUniqueId(),
              name: newBoxName,
              start: { ...startCoordinates },
              end: { ...endCoordinates },
              mode: "child",
              height: Math.abs(endCoordinates.y - startCoordinates.y),
              width: Math.abs(endCoordinates.x - startCoordinates.x),
            };

            const insideParent = boxes.some(
              (box) =>
                box.mode === "parent" &&
                newBox.start.x > box.start.x &&
                newBox.start.y > box.start.y &&
                newBox.end.x < box.end.x &&
                newBox.end.y < box.end.y
            );
            console.log("insideParent", insideParent);

            if (insideParent) {
              const parentIndex = boxes.findIndex(
                (box) =>
                  box.mode === "parent" &&
                  newBox.start.x > box.start.x &&
                  newBox.start.y > box.start.y &&
                  newBox.end.x < box.end.x &&
                  newBox.end.y < box.end.y
              );
              console.log("parentIndex", parentIndex);

              const updatedBoxes = [...boxes];
              updatedBoxes[parentIndex].children.push(newBox);
              setBoxes(updatedBoxes);

              return;
            }
          } else if (drawingModeAnchor) {
            newBox = {
              id: generateUniqueId(),
              name: newBoxName,
              start: { ...startCoordinates },
              end: { ...endCoordinates },
              mode: "anchor",
              height: Math.abs(endCoordinates.y - startCoordinates.y),
              width: Math.abs(endCoordinates.x - startCoordinates.x),
            };
          } else if (drawingModeRollNo) {
            newBox = {
              id: generateUniqueId(),
              name: newBoxName,
              start: { ...startCoordinates },
              end: { ...endCoordinates },
              mode: "RollNo",
              height: Math.abs(endCoordinates.y - startCoordinates.y),
              width: Math.abs(endCoordinates.x - startCoordinates.x),
            };
          } else if (drawingModeQuestionpaper) {
            newBox = {
              id: generateUniqueId(),
              name: newBoxName,
              start: { ...startCoordinates },
              end: { ...endCoordinates },
              mode: "Questionpaper",
              height: Math.abs(endCoordinates.y - startCoordinates.y),
              width: Math.abs(endCoordinates.x - startCoordinates.x),
            };
          }

          if (newBox) {
            setBoxes([...boxes, newBox]);
            setBoxNameInput("");
            console.log(
              "Boxes data:",
              JSON.stringify([...boxes, newBox], null, 2)
            );
          } else {
            console.log(
              "Neither drawingModeparent nor drawingModechild is active."
            );
          }
        } else {
          console.log("Minimum height and width requirement not met");
        }
      }
    }
  };

  const handleMouseMove = (event) => {
    if (dragging && originalMousePosition) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomFactor - translation.x;
      const y = (event.clientY - rect.top) / zoomFactor - translation.y;

      const deltaX = x - originalMousePosition.x;
      const deltaY = y - originalMousePosition.y;

      // Update the coordinates of the selected box
      if (selectedBoxIndex !== null) {
        const updatedBoxes = [...boxes];
        const selectedBox = updatedBoxes[selectedBoxIndex];
        selectedBox.start.x += deltaX;
        selectedBox.start.y += deltaY;
        selectedBox.end.x += deltaX;
        selectedBox.end.y += deltaY;

        // If the selected box is a parent, update the coordinates of its children
        if (selectedBox.mode === "parent") {
          selectedBox.children.forEach((childBox) => {
            childBox.start.x += deltaX;
            childBox.start.y += deltaY;
            childBox.end.x += deltaX;
            childBox.end.y += deltaY;
          });
        }

        setBoxes(updatedBoxes);
      }

      setOriginalMousePosition({ x, y });
      draw();
    } else if (drawingMode && dragging) {
      const canvas = document.getElementById("canvas");
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomFactor - translation.x;
      const y = (event.clientY - rect.top) / zoomFactor - translation.y;
      setEndCoordinates({ x, y });
      draw();
    }
    // if (dragging) {
    //   const canvas = document.getElementById("canvas");
    //   const rect = canvas.getBoundingClientRect();
    //   const deltaX =
    //     (event.clientX - rect.left) / zoomFactor -
    //     translation.x -
    //     startCoordinates.x;
    //   const deltaY =
    //     (event.clientY - rect.top) / zoomFactor -
    //     translation.y -
    //     startCoordinates.y;

    //   setTranslation((prevTranslation) => ({
    //     x: prevTranslation.x + deltaX,
    //     y: prevTranslation.y + deltaY,
    //   }));

    //   startCoordinates.x =
    //     (event.clientX - rect.left) / zoomFactor - translation.x;
    //   startCoordinates.y =
    //     (event.clientY - rect.top) / zoomFactor - translation.y;

    //   draw();
    // }
  };

  // ZoomIn and ZoomOut functionality
  const handleZoomIn = () => {
    // setZoomFactor((prevZoomFactor) => console.log(prevZoomFactor,"hey i am prev zoom factor"));

    setZoomFactor((prevZoomFactor) => Math.min(prevZoomFactor + 0.1, 2));
  };

  const handleZoomOut = () => {
    // setZoomFactor((prevZoomFactor) => Math.max(prevZoomFactor - 0.1, 1));
    // // console.log(zoomFactor, "hey i am zoom out factor");
    setZoomFactor((prevZoomFactor) => {
      const newZoomFactor = Math.max(prevZoomFactor - 0.1, 1);
      // If zooming out would make the image smaller than the canvas, reset translation to keep the image aligned with the top-left corner

      if (image && image.width * newZoomFactor <= image.width) {
        setTranslation({ x: 0, y: 0 });
      }
      return newZoomFactor;
    });
  };

  const handleMove = (direction) => {
    let newTranslation = { ...translation };

    const canvas = document.getElementById("canvas");
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imageWidth = image.width * zoomFactor;
    const imageHeight = image.height * zoomFactor;

    // console.log("hey i am canvas width: " + canvasWidth);
    // console.log(
    //   "hey i am canvaswidth - imagewidth: ",
    //   canvasWidth - imageWidth
    // );

    // console.log(
    //   "hey i am  canvasWidth - imageWidth / zoomFactor: ",
    //   canvasWidth - imageWidth / zoomFactor
    // );
    // console.log("hey i am imagewidth/ zoomFactor: " + imageWidth / zoomFactor);
    const boundary = -(Math.abs(canvasWidth) - 40);
    // console.log("hey i am boundryyyyy " + boundary);

    // console.log("hey i am imagewidth and can: " + canvasWidth / zoomFactor);
    // console.log("hey i am zoomFactor: " + zoomFactor);
    // console.log("hey i am imagewidth: " + imageWidth);

    if (zoomFactor > 1) {
      switch (direction) {
        case "left":
          newTranslation.x = Math.min(newTranslation.x + 10, 0);
          break;
        case "right":
          // 1.1  1.2 ....2.0
          newTranslation.x = Math.max(
            newTranslation.x - 10,
            -80 * (zoomFactor * 10 - 10)
          );
          // console.log("hey i am new translation.x", newTranslation.x);
          break;
        case "top":
          newTranslation.y = Math.min(newTranslation.y + 10, 0);
          break;
        case "bottom":
          // -60
          newTranslation.y = Math.max(
            newTranslation.y - 10,
            -120 * (zoomFactor * 10 - 10)
          );

          // console.log("hey i am new translation.y bottom", newTranslation.y);

          break;
        default:
          break;
      }
    }
    setTranslation(newTranslation);
    draw();
  };

  const handleKeyDown = useCallback(
    (event) => {
      switch (event.key) {
        case "ArrowLeft":
          handleMove("left");
          break;
        case "ArrowRight":
          handleMove("right");
          break;
        case "ArrowUp":
          handleMove("top");
          break;
        case "ArrowDown":
          handleMove("bottom");
          break;
        default:
          break;
      }
    },
    [handleMove]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const draw = () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (image && image.complete && image.naturalWidth !== 0) {
      // console.log("hey i  am ....", canvas.width * zoomFactor);
      // console.log("hey i  am translation.x,....", translation.x);
      // console.log("hey i  am translation.x,....", translation.x);

      context.drawImage(
        image,
        translation.x,
        translation.y,
        canvas.width * zoomFactor,
        canvas.height * zoomFactor
        //   translation.x,
        //   translation.y,
        //   image.width * zoomFactor,
        //   image.height * zoomFactor
      );
      // context.drawImage(
      //   image,
      //   0,
      //   0,
      //   image.width,
      //   image.height,
      //   translation.x,
      //   translation.y,
      //   image.width * zoomFactor,
      //   image.height * zoomFactor
      // );
    }

    boxes.forEach((box, index) => {
      if (box.mode === "parent") {
        context.strokeStyle = "green";

        context.lineWidth = 5; // Set line width to 10px
        context.setLineDash([2, 2]); // Set line dash pattern for dashed line
      } else {
        context.strokeStyle = "red";

        context.lineWidth = 5; // Set line width to 10px
        context.setLineDash([2, 2]); // Set line dash pattern for dashed line
      }

      // Check if the current box is selected
      if (index === selectedBoxIndex) {
        // context.strokeStyle = "orange"; // Change stroke color for the selected box
        context.strokeStyle = "black"; // Set stroke color to black
        context.lineWidth = 5; // Set line width to 10px
        context.setLineDash([2, 2]); // Set line dash pattern for dashed line
      }

      context.lineWidth = 2;
      context.strokeRect(
        box.start.x * zoomFactor + translation.x,
        box.start.y * zoomFactor + translation.y,
        (box.end.x - box.start.x) * zoomFactor,
        (box.end.y - box.start.y) * zoomFactor
      );

      if (box.mode === "parent") {
        box.children.forEach((childBox, childIndex) => {
          // console.log("hey i am child index...", index);
          if (
            index === selectedBoxIndex &&
            childIndex === selectedchildBoxIndex
          ) {
            context.strokeStyle = "black"; // Change stroke color for the selected child box
          } else {
            // context.strokeStyle = "blue"; // Default stroke color for child boxes
            context.strokeStyle = "red"; // Set stroke color to black
            // context.lineWidth = 10; // Set line width to 10px
            // context.setLineDash([5, 5]); // Set line dash pattern for dashed line
          }

          // context.strokeStyle = "blue";
          context.strokeRect(
            childBox.start.x * zoomFactor + translation.x,
            childBox.start.y * zoomFactor + translation.y,
            childBox.width * zoomFactor,
            childBox.height * zoomFactor
          );
        });
      }
    });

    if (drawingMode && dragging) {
      context.strokeStyle = drawingModeparent ? "pink" : "yellow";
      context.lineWidth = 2;
      context.strokeRect(
        startCoordinates.x * zoomFactor + translation.x,
        startCoordinates.y * zoomFactor + translation.y,
        (endCoordinates.x - startCoordinates.x) * zoomFactor,
        (endCoordinates.y - startCoordinates.y) * zoomFactor
      );
      // Display box name for the dragged box
      context.fillStyle = "black";
      context.font = "12px Arial";
      context.fillText(
        newBoxName,
        startCoordinates.x * zoomFactor + 5,
        startCoordinates.y * zoomFactor + 15
      );
    }
  };

  //  selected box , copy ,paste
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
  const [selectedchildBoxIndex, setSelectedchildBoxIndex] = useState(null);

  const [copiedBox, setCopiedBox] = useState(null);
  const [isBoxCopied, setIsBoxCopied] = useState(false);
  // const handleSelectBoxClick = (index) => {
  //   setSelectedBoxIndex(index);
  //   setSelectedchildBoxIndex(null); // Unselect child box if any
  //   setIsBoxCopied(false);
  //   setBoxes((prevBoxes) => {
  //     const newBoxes = [...prevBoxes];
  //     const box = newBoxes[index];

  //     if (box.mode === "parent") {
  //       box.isOpen = !box.isOpen;
  //     }

  //     return newBoxes;
  //   });
  // };
  const handleSelectBoxClick = (index, event) => {
    // Toggle selection state if the clicked box is already selected

    // console.log("hey i am indexxxxx...", selectedBoxIndex);
    // if (index === selectedBoxIndex) {
    //   setSelectedBoxIndex(null);
    //   setSelectedchildBoxIndex(null); // Unselect child box if any
    //   setIsBoxCopied(false); // Reset copied flag
    // } else {

    setSelectedBoxIndex(index);
    setSelectedchildBoxIndex(null); // Unselect child box if any
    setIsBoxCopied(false); // Reset copied flag
    setDraggedBoxIndex(true);
    setBoxes((prevBoxes) => {
      // console.log("boxxxxxxxxxxxxxxxxxxxxxxxx", box);
      const newBoxes = [...prevBoxes];
      const box = newBoxes[index];
      if (box.mode === "parent") {
        box.isOpen = !box.isOpen;
      }

      return newBoxes;
    });
    // }
  };
  const handleSelectChildBoxClick = (childindex, index) => {
    // console.log("hey i am parent index....", index);

    // console.log("hey i am child index....", childindex);
    // setSelectedBoxIndex(index);
    // setSelectedchildBoxIndex(childindex);

    // setIsBoxCopied(false);
    if (selectedchildBoxIndex === childindex) {
      // If the same child box is clicked again, unselect it
      setSelectedchildBoxIndex(null);
      setIsBoxCopied(false); // Reset copied flag
    } else {
      setSelectedBoxIndex(index); // Select the parent box
      setSelectedchildBoxIndex(childindex); // Select the child box
      setIsBoxCopied(false); // Reset copied flag
    }
  };

  const handleCopyBoxClick = useCallback(() => {
    if (selectedBoxIndex !== null && boxes.length > 0) {
      // if (boxes[selectedBoxIndex].children.length > 0) {
      const selectedBox = boxes[selectedBoxIndex];
      // console.log(
      //   "hey i am selected box hehehehehhe..",
      //   selectedBox.children.length
      // );
      // console.log("hey i am selected box mode..", selectedBox.mode);
      // setCopiedBox(selectedBox);
      // setIsBoxCopied(true); // Set the flag to true when a box is copied
      // console.log("Box copied:", selectedBox);
      // } else {
      //   const selectedBox = boxes[selectedBoxIndex];
      //   setCopiedBox(selectedBox.children[selectedchildBoxIndex]);
      //   setIsBoxCopied(true);
      //   console.log("Hey i am copied child box....", copiedBox);
      // }

      if (selectedBox.mode === "parent") {
        if (selectedBox.children.length <= 0) {
          // console.log("hey i am selected box mode..", selectedBox.mode);
          setCopiedBox(selectedBox);
          setIsBoxCopied(true); // Set the flag to true when a box is copied
          // console.log("Box copied:", selectedBox);
        } else {
          // console.log("hey i am selected box mode..", selectedBox);
          // console.log(
          //   "hey i am selected box child mode..",
          //   selectedBox.children[selectedchildBoxIndex].id
          // );
          if (selectedchildBoxIndex !== null) {
            // If a child box is selected, copy only that child
            const selectedChildBox =
              selectedBox.children[selectedchildBoxIndex];
            // console.log("Child Box copied:", selectedChildBox);
            setCopiedBox(selectedChildBox);
            setIsBoxCopied(true);
          } else {
            // If no child box is selected, copy the entire parent along with its children
            if (selectedBox.mode === "parent") {
              // console.log("Parent Box copied:", selectedBox);
              setCopiedBox(selectedBox);
              setIsBoxCopied(true);
            }
          }

          // console.log("Hey i have child and parent both");
        }
      } else if (selectedBox.mode === "child") {
        // console.log("hey i am selected box mode..", selectedBox.mode);
        setCopiedBox(selectedBox);
        setIsBoxCopied(true); // Set the flag to true when a box is copied
        // console.log("Box copied:", selectedBox);
      }
    }
  }, [selectedBoxIndex, selectedchildBoxIndex, boxes]);

  // const handlePasteBoxClick = useCallback(() => {
  //   if (copiedBox) {
  //     // const updatedBoxes = [...boxes, { ...copiedBox }];
  //     // setBoxes(updatedBoxes);
  //     // console.log("Box pasted:", copiedBox);
  //     // Adjust the start and end coordinates of the copied box
  //     const adjustedCopiedBox = {
  //       ...copiedBox,
  //       id: generateUniqueId(),
  //       start: { x: 0, y: 0 },
  //       end: {
  //         x: copiedBox.width,
  //         y: copiedBox.height,
  //       },
  //     };
  //     // If the copied box is a parent box with children, adjust their positions
  //     if (copiedBox.mode === "parent" && copiedBox.children.length > 0) {
  //       adjustedCopiedBox.children = copiedBox.children.map((childBox) => {
  //         const newChildId = generateUniqueId(); // Generate a new ID for each copied child box
  //         return {
  //           ...childBox,
  //           id: newChildId,
  //           start: {
  //             x: childBox.start.x - copiedBox.start.x,
  //             y: childBox.start.y - copiedBox.start.y,
  //           },
  //           end: {
  //             x: childBox.end.x - copiedBox.start.x,
  //             y: childBox.end.y - copiedBox.start.y,
  //           },
  //         };
  //       });
  //     }
  //     const updatedBoxes = [...boxes, adjustedCopiedBox];
  //     setBoxes(updatedBoxes);
  //     console.log("Box pasted:", adjustedCopiedBox);
  //   }
  // }, [copiedBox, boxes]);

  // ctrl + c
  const handlePasteBoxClick = useCallback(() => {
    if (copiedBox) {
      const adjustmentY = 20; // Adjusted distance above the copied box

      const adjustedCopiedBox = {
        ...copiedBox,
        id: generateUniqueId(),
        start: {
          x: copiedBox.start.x,
          y: copiedBox.start.y - adjustmentY, // Move 20px above the copied box
        },
        end: {
          x: copiedBox.end.x,
          y: copiedBox.end.y - adjustmentY, // Move 20px above the copied box
        },
      };

      // If the copied box is a parent box with children, adjust their positions
      if (copiedBox.mode === "parent" && copiedBox.children.length > 0) {
        adjustedCopiedBox.children = copiedBox.children.map((childBox) => {
          const newChildId = generateUniqueId(); // Generate a new ID for each copied child box
          return {
            ...childBox,
            id: newChildId,
            start: {
              x: childBox.start.x,
              y: childBox.start.y - adjustmentY, // Move 20px above the copied box
            },
            end: {
              x: childBox.end.x,
              y: childBox.end.y - adjustmentY, // Move 20px above the copied box
            },
          };
        });
      }

      const updatedBoxes = [...boxes, adjustedCopiedBox];
      setBoxes(updatedBoxes);
      // console.log("Box pasted:", adjustedCopiedBox);
    }
  }, [copiedBox, boxes]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if Ctrl (or Command on Mac) key is pressed and the pressed key is 'c'
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        handleCopyBoxClick();
      }
    };

    // Add event listener for keydown
    document.addEventListener("keydown", handleKeyDown);

    // Remove the event listener when the component is unmounted
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCopyBoxClick]);

  // ctrl + v
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if Ctrl (or Command on Mac) key is pressed and the pressed key is 'v'
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        handlePasteBoxClick();
      }
    };

    // Add event listener for keydown
    document.addEventListener("keydown", handleKeyDown);

    // Remove the event listener when the component is unmounted
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePasteBoxClick]);

  // till here copy paste functionality
  // Ctrl + C functionality

  const handleDeleteSelectedBox = () => {
    if (selectedBoxIndex !== null) {
      if (selectedchildBoxIndex !== null) {
        // If a child box is selected, delete only that child box
        const updatedBoxes = [...boxes];
        updatedBoxes[selectedBoxIndex].children.splice(
          selectedchildBoxIndex,
          1
        );
        setSelectedchildBoxIndex(null); // Unselect the child box
        setBoxes(updatedBoxes);
        // console.log("Child Box deleted");
      } else {
        // If no child box is selected, delete the entire parent box
        const updatedBoxes = [...boxes];
        updatedBoxes.splice(selectedBoxIndex, 1);
        setSelectedBoxIndex(null);
        setBoxes(updatedBoxes);
        console.log("Box deleted");
      }
    }
  };

  useEffect(() => {
    draw();
  }, [draw, image, boxes, drawingMode, zoomFactor, newBoxName, translation]);

  useEffect(() => {
    if (images) {
      uploadImage(images);
    }
  }, [images]);

  const handleRename = (e) => {
    // console.log("hey i am e.target.value of rename...", e.target);
    if (selectedBoxIndex !== null && newBoxName.trim() !== "") {
      setBoxes((prevBoxes) => {
        const newBoxes = [...prevBoxes];

        newBoxes[selectedBoxIndex].name = newBoxName.trim();
        // console.log("hey i am newBoxessssssssssss", newBoxes);
        return newBoxes;
      });
      setNewBoxName(""); // Reset the new name input field
    }
  };

  useEffect(() => {
    if (selectedBoxIndex !== null) {
      setNewBoxName(boxes[selectedBoxIndex].name);
    }
  }, [selectedBoxIndex, boxes]);

  // Define event listener function for arrow key presses
  const handleArrowKeyPress = (event) => {
    if (
      zoomFactor <= 1 &&
      selectedBoxIndex !== null &&
      (event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault(); // Prevent scrolling when arrow keys are pressed

      const step = 1; // Adjust this value for finer or coarser movement

      const updatedBoxes = [...boxes];
      const selectedBox = updatedBoxes[selectedBoxIndex];
      let deltaX = 0;
      let deltaY = 0;

      switch (event.key) {
        case "ArrowLeft":
          deltaX = -step;
          break;
        case "ArrowRight":
          deltaX = step;
          break;
        case "ArrowUp":
          deltaY = -step;
          break;
        case "ArrowDown":
          deltaY = step;
          break;
        default:
          break;
      }

      // Update the coordinates of the selected box
      selectedBox.start.x += deltaX;
      selectedBox.start.y += deltaY;
      selectedBox.end.x += deltaX;
      selectedBox.end.y += deltaY;

      // If the selected box is a parent, update the coordinates of its children
      if (selectedBox.mode === "parent") {
        selectedBox.children.forEach((childBox) => {
          childBox.start.x += deltaX;
          childBox.start.y += deltaY;
          childBox.end.x += deltaX;
          childBox.end.y += deltaY;
        });
      }

      setBoxes(updatedBoxes);
      draw();
    }
  };

  // Add event listener for arrow key presses
  useEffect(() => {
    window.addEventListener("keydown", handleArrowKeyPress);

    // Remove event listener when component unmounts
    return () => {
      window.removeEventListener("keydown", handleArrowKeyPress);
    };
  }, [boxes, selectedBoxIndex]); // Make sure to include any dependencies needed

  // const toggleDrawingMode = () => {
  //   setDrawingMode(!drawingMode);
  //   setDragging(false);
  // };
  const toggleDrawingMode = () => {
    if (drMode) {
      setDrawingMode(false);
    } else {
      setDrawingMode(!drawingMode);
    }

    if (drawingMode) {
      setDragging(false);
    }
  };

  const toggleDrawingModeparent = () => {
    setDrawingModeparent(!drawingModeparent);
    setDragging(false);

    if (drawingModechild) {
      setDrawingModechild(!drawingModechild);
    }

    if (drawingModeRollNo) {
      setdrawingModeRollNo(!drawingModeRollNo);
    }
    if (drawingModeQuestionpaper) {
      setDrawingModeQuestionpaper(!drawingModeQuestionpaper);
    }
    if (drawingModeAnchor) {
      setDrawingModeAnchor(!drawingModeAnchor);
    }
  };

  const toggleDrawingModechild = () => {
    // if(drawingModechild == false){}
    setDrawingModechild(!drawingModechild);
    setDragging(false);

    if (drawingModeparent) {
      setDrawingModeparent(!drawingModeparent);
    }
    if (drawingModeRollNo) {
      setdrawingModeRollNo(!drawingModeRollNo);
    }
    if (drawingModeQuestionpaper) {
      setDrawingModeQuestionpaper(!drawingModeQuestionpaper);
    }
    if (drawingModeAnchor) {
      setDrawingModeAnchor(!drawingModeAnchor);
    }
  };
  const toggleDrawingModeAnchor = () => {
    setDrawingModeparent(!drawingModeAnchor);
    setDragging(false);

    if (drawingModechild) {
      setDrawingModechild(!drawingModechild);
    }
    if (drawingModeparent) {
      setDrawingModeparent(!drawingModeparent);
    }
    if (drawingModeRollNo) {
      setdrawingModeRollNo(!drawingModeRollNo);
    }
    if (drawingModeQuestionpaper) {
      setDrawingModeQuestionpaper(!drawingModeQuestionpaper);
    }
  };
  const toggleDrawingModeRollNo = () => {
    setDrawingModeparent(!drawingModeparent);
    setDragging(false);

    if (drawingModechild) {
      setDrawingModechild(!drawingModechild);
    }
    if (drawingModeparent) {
      setDrawingModeparent(!drawingModeparent);
    }
    if (drawingModeAnchor) {
      setDrawingModeAnchor(!drawingModeAnchor);
    }
    if (drawingModeQuestionpaper) {
      setDrawingModeQuestionpaper(!drawingModeQuestionpaper);
    }
  };
  const toggleDrawingModeQuestionpaper = () => {
    setDrawingModeparent(!drawingModeparent);
    setDragging(false);

    if (drawingModechild) {
      setDrawingModechild(!drawingModechild);
    }
    if (drawingModeparent) {
      setDrawingModeparent(!drawingModeparent);
    }
    if (drawingModeAnchor) {
      setDrawingModeAnchor(!drawingModeAnchor);
    }
    if (drawingModeRollNo) {
      setDrawingModeQuestionpaper(!drawingModeRollNo);
    }
  };
  const toggleDrMode = () => {
    setDrMode(!drMode);

    if (!drMode) {
      setDrawingMode(false);
      setDrawingModeparent(false);
      setDrawingModechild(false);
      setDrawingModeAnchor(false);
      setDrawingModeQuestionpaper(false);
      setdrawingModeRollNo(false);
      setDragging(false);
    }
  };

  return (
    <>
      <div className="map_header ria shadow">
        <div className="container">
          <ButtonListComponent
            newBoxName={newBoxName}
            setNewBoxName={setNewBoxName}
            handleRename={handleRename}
            toggleDrawingMode={toggleDrawingMode}
            toggleDrawingModeparent={toggleDrawingModeparent}
            toggleDrawingModechild={toggleDrawingModechild}
            toggleDrawingModeAnchor={toggleDrawingModeAnchor}
            toggleDrawingModeRollNo={toggleDrawingModeRollNo}
            toggleDrawingModeQuestionpaper={toggleDrawingModeQuestionpaper}
            drawingMode={drawingMode}
            drawingModeparent={drawingModeparent}
            drawingModechild={drawingModechild}
            handleCopyBoxClick={handleCopyBoxClick}
            handlePasteBoxClick={handlePasteBoxClick}
            selectedBoxIndex={selectedBoxIndex}
            selectedchildBoxIndex={selectedchildBoxIndex}
            boxes={boxes}
            copiedBox={copiedBox}
            isBoxCopied={isBoxCopied}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            handleDeleteSelectedBox={handleDeleteSelectedBox}
            boxNameInput={boxNameInput}
            setBoxNameInput={setBoxNameInput}
            drMode={drMode}
            toggleDrMode={toggleDrMode}
            handleUndo={handleUndo}
            isCopyDisabled={boxes.length === 0} // Pass the disabled prop based on the condition
          />
          {/* <button onClick={toggleDrMode}>
            {drMode ? "True" : "False"} Drag
          </button> */}
        </div>
        {/* <div>
          <button onClick={() => handleMove("left")}>Move Left</button>
          <button onClick={() => handleMove("right")}>Move Right</button>
          <button onClick={() => handleMove("top")}>Move Top</button>
          <button onClick={() => handleMove("bottom")}>Move Bottom</button>
        </div> */}
        <div className="buttons-container">
          {zoomFactor > 1 && (
            <>
              <button className="button" onClick={() => handleMove("left")}>
                <FaArrowLeft />
              </button>
              <button className="button" onClick={() => handleMove("right")}>
                <FaArrowRight />
              </button>
              <button className="button" onClick={() => handleMove("top")}>
                <FaArrowUp />
              </button>
              <button className="button" onClick={() => handleMove("bottom")}>
                <FaArrowDown />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-12 col-md-8">
            <canvas
              id="canvas"
              width={800} // Set the width of the canvas as needed
              height={1200} // Set the height of the canvas as needed
              // className="w-100"

              style={{
                border: "1px solid green",
                marginTop: "40px",
                marginRight: "100px",
                // cursor: dragging ? "grabbing" : "grab",
                cursor:
                  drMode && dragging
                    ? "grabbing"
                    : dragging
                    ? "move"
                    : drMode
                    ? "grab"
                    : "auto",

                //  cursor:  dragging ? "grab" : "auto",
              }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            />

            {/* <MappingDisplayComponent
              boxes={boxes}
              selectedBoxIndex={selectedBoxIndex}
              handleSelectBoxClick={handleSelectBoxClick}
              handleMouseDownOnBox = {handleMouseDownOnBox}
              handleMouseUpOnBox = {handleMouseUpOnBox}
              handleMouseMoveOnBox = {handleMouseMoveOnBox}
            /> */}
          </div>
          <div>
            {boxes.map((box, index) => (
              <div
                key={index}
                onClick={() => handleSelectBoxClick(index)}
                onMouseDown={(event) => handleMouseDownOnBox(event, index)}
                onMouseUp={handleMouseUpOnBox}
                onMouseMove={handleMouseMoveOnBox}
                style={{
                  border:
                    selectedBoxIndex === index
                      ? "2px solid orange"
                      : "1px solid black",
                  margin: "5px",
                  padding: "5px",
                  display: "inline-block",
                }}
              >
                <p>
                  Box {index + 1} ID: {box.id}
                  <br />
                  Box {index + 1} Name:{" "}
                  {index === selectedBoxIndex ? newBoxName : box.name}
                  <br />
                  Box {index + 1} Coordinates: ({box.start.x}, {box.start.y}) -
                  ({box.end.x}, {box.end.y})
                </p>
                {box.mode === "parent" && (
                  <div>
                    <p>Child Boxes:</p>
                    {box.children.map((childBox, childIndex) => (
                      <p key={childIndex}>
                        Box {childIndex + 1} ID: {childBox.id}
                        <br />
                        Child Box {childIndex + 1} Coordinates: (
                        {childBox.start.x}, {childBox.start.y}) - (
                        {childBox.end.x}, {childBox.end.y})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <MappingDataComponent
            boxes={boxes}
            selectedBoxIndex={selectedBoxIndex}
            selectedchildBoxIndex={selectedchildBoxIndex}
            handleSelectBoxClick={handleSelectBoxClick}
            handleSelectChildBoxClick={handleSelectChildBoxClick}
          />
        </div>
      </div>
    </>
  );
}
export default Templateimage;
