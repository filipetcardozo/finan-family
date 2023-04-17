import React from 'react';
import { Divider, Skeleton } from "@mui/material";
import { Box } from "@mui/material";

export const LoadingHomePage = () => {

    return <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Skeleton variant='text' sx={{ width: 200 }} />
        <Skeleton variant='text' sx={{ width: 160, mb: 5 }} />

        <Skeleton variant='text' sx={{ width: 200 }} />
        <Skeleton variant='text' sx={{ width: 160, mb: 5 }} />

        <Skeleton variant='text' sx={{ width: 200 }} />
        <Skeleton variant='text' sx={{ width: 160 }} />
    </Box>
}