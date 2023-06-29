import React from "react"
import { Stack } from '@mui/material'
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Typography from "@mui/material/Typography";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { AppBar as AppBarMui } from '@mui/material';
import { MonthSelectedContext } from "../contexts/monthSelected";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from "../hooks/useAuth";

export const AppBar: React.FC = () => {
    const { dateToAnalyze, handleNextMonth, handlePreviousMonth } = React.useContext(MonthSelectedContext);

    const { signOut } = useAuth()

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return <AppBarMui component='nav'>
        <Toolbar sx={{ justifyContent: 'center' }}>
            <Stack flexDirection='row' alignItems='center' gap={2}>
                <IconButton onClick={handlePreviousMonth} color='inherit' size='small' aria-label="delete" >
                    <ArrowBackIosNewIcon fontSize='small' />
                </IconButton>
                <Typography variant='body1'>
                    {dateToAnalyze.format('MMM/YYYY')}
                </Typography>
                <IconButton onClick={handleNextMonth} color='inherit' size='small' aria-label="delete">
                    <ArrowForwardIosIcon fontSize='small' />
                </IconButton>
            </Stack>
            <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleClick}
                sx={{ mr: 1, position: 'absolute', right: 0 }}>
                <AccountCircle />
            </IconButton>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={signOut}>
                    <LogoutIcon sx={{ mr: 1.5 }} fontSize='small' />
                    Sair da conta
                </MenuItem>
            </Menu>
        </Toolbar>
    </AppBarMui>
}