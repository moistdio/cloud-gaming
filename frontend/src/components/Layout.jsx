import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Typography } from '@mui/material'

const Layout = () => {
  return (
    <Box sx={{ minHeight: '100vh', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cloud Gaming Dashboard
      </Typography>
      <Outlet />
    </Box>
  )
}

export default Layout 