
import { Button, IconButton, Tooltip } from '@mui/material'
import React from 'react'

function DetailPageSectionAction({ icon, onClick, title = '', iconButtonMode = true }) {
  if (iconButtonMode) {
    return (
      <Tooltip title={title} arrow placement="top">
        <IconButton onClick={onClick}>
          {icon}
        </IconButton>
      </Tooltip>
    )
  } else {
    return (
      <Button
        size="small"
        variant="text"
        startIcon={icon}
        onClick={onClick}
      >
        {title}
      </Button>
    )
  }
}

export default DetailPageSectionAction
