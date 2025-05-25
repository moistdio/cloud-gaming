import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const DashboardPage = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Willkommen im Dashboard
      </Typography>
      <Card>
        <CardContent>
          <Typography>
            Hier können Sie Ihre Container verwalten und auf virtuelle Desktops zugreifen.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default DashboardPage 