import React from "react";
import { AiFillEye } from "react-icons/ai";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import MainSequenceProvider from "../context/MainSequenceProvider";
import MainSequenceContext from "../context/MainSequenceContext";


function MainSequenceCheckBox({ id }) {
  const { mainSequenceId, setMainSequenceId} = React.useContext(MainSequenceContext);
  const toggleMain = () => setMainSequenceId(id);
  const tooltipText = <div className="tooltip-text">See sequence in main editor</div>;
  return (
    <MainSequenceProvider>
      <div className="node-corner">
        <div>
          <input id={`checkbox-main${id}`} type="checkbox" className="hidden-checkbox" onChange={toggleMain} checked={id === mainSequenceId} />
          <label htmlFor={`checkbox-main${id}`}>
            <Tooltip title={tooltipText} arrow placement="top">
              <Box>
                <AiFillEye className="node-corner-icon" />
              </Box>
            </Tooltip>
          </label>
        </div>
      </div>
    </MainSequenceProvider>
  );
}

export default MainSequenceCheckBox;
