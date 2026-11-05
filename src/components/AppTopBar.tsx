import React from 'react';
import {
    AppBar as AppBarMui,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Typography,
    Tooltip,
} from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useColorMode } from '../contexts/colorMode';
import { MonthSelectedContext } from '../contexts/monthSelected';
import { useAuth } from '../hooks/useAuth';
import { BrandLogo } from './BrandLogo';

export const AppBar: React.FC = () => {
    const { dateToAnalyze, ready, handleNextMonth, handlePreviousMonth } = React.useContext(MonthSelectedContext);
    const { signOut } = useAuth();
    const { mode, toggleMode, preference, setPreference } = useColorMode();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBarMui
            component='nav'
            elevation={0}
            sx={{
                background: 'var(--nav)',
                color: 'var(--nav-text)',
                borderBottom: '1px solid rgba(213, 248, 255, 0.22)',
                overflow: 'hidden',
                '&::before, &::after': {
                    content: '""',
                    position: 'absolute',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                },
                '&::before': {
                    width: 180,
                    height: 180,
                    top: -120,
                    right: -48,
                    background: 'radial-gradient(circle, rgba(213, 248, 255, 0.28) 0%, rgba(213, 248, 255, 0) 72%)',
                },
                '&::after': {
                    width: 150,
                    height: 150,
                    bottom: -110,
                    left: -52,
                    background: 'radial-gradient(circle, rgba(199, 240, 216, 0.26) 0%, rgba(199, 240, 216, 0) 72%)',
                },
            }}
        >
            <Toolbar sx={{ minHeight: { xs: 62, sm: 66 }, px: { xs: 1, sm: 1.6 }, position: 'relative' }}>
                <Box
                    sx={{
                        width: 1,
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Stack
                        direction='row'
                        spacing={0.5}
                        alignItems='center'
                        sx={{ justifySelf: 'start', color: 'var(--nav-muted)', pl: { xs: 0.2, sm: 0.5 } }}
                    >
                        <BrandLogo inverse size={28} />
                    </Stack>

                    <Stack
                        direction='row'
                        spacing={0.5}
                        alignItems='center'
                        sx={{
                            px: 0.6,
                            py: 0.25,
                            borderRadius: 20,
                            backgroundColor: 'rgba(213, 248, 255, 0.14)',
                            border: '1px solid rgba(213, 248, 255, 0.3)',
                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 14px 24px -20px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        <IconButton
                            onClick={handlePreviousMonth}
                            disabled={!ready}
                            size='small'
                            aria-label='mes anterior'
                            sx={{
                                color: 'var(--nav-text)',
                                backgroundColor: 'rgba(217, 248, 255, 0.16)',
                                '&:hover': { backgroundColor: 'rgba(217, 248, 255, 0.26)' },
                            }}
                        >
                            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 15 }} />
                        </IconButton>

                        <Typography
                            sx={{
                                minWidth: { xs: 92, sm: 108 },
                                textAlign: 'center',
                                fontSize: { xs: 12, sm: 13 },
                                fontWeight: 700,
                                letterSpacing: '.05em',
                                color: 'var(--nav-text)',
                                textTransform: 'uppercase',
                            }}
                        >
                            {dateToAnalyze.format('MMM/YYYY')}
                        </Typography>

                        <IconButton
                            onClick={handleNextMonth}
                            disabled={!ready}
                            size='small'
                            aria-label='mes seguinte'
                            sx={{
                                color: 'var(--nav-text)',
                                backgroundColor: 'rgba(217, 248, 255, 0.16)',
                                '&:hover': { backgroundColor: 'rgba(217, 248, 255, 0.26)' },
                            }}
                        >
                            <ArrowForwardIosRoundedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Stack>

                    <Stack direction='row' spacing={0.5} sx={{ justifySelf: 'end' }}>
                        <Tooltip title={mode === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}>
                            <IconButton onClick={toggleMode} aria-label={mode === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                                sx={{ width: 36, height: 36, color: 'var(--nav-text)', bgcolor: 'rgba(255,255,255,.12)', '&:hover': { bgcolor: 'rgba(255,255,255,.22)' } }}>
                                {mode === 'dark' ? <LightModeRoundedIcon sx={{ fontSize: 20 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 20 }} />}
                            </IconButton>
                        </Tooltip>
                        <IconButton
                            id='account-menu-button'
                            size='large'
                            color='inherit'
                            aria-label='abrir menu de conta'
                            onClick={handleClick}
                            sx={{
                                color: 'var(--nav-text)',
                                backgroundColor: 'rgba(232, 252, 255, 0.12)',
                                border: '1px solid rgba(232, 252, 255, 0.24)',
                                width: 36,
                                height: 36,
                                '&:hover': { backgroundColor: 'rgba(232, 252, 255, 0.22)' },
                            }}
                        >
                            <AccountCircleRoundedIcon sx={{ fontSize: 21 }} />
                        </IconButton>
                    </Stack>
                </Box>

                <Menu
                    id='basic-menu'
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                        'aria-labelledby': 'account-menu-button',
                    }}
                    PaperProps={{
                        sx: {
                            mt: 1,
                            borderRadius: 2.5,
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow)',
                        },
                    }}
                >
                    <MenuItem onClick={() => { setPreference('system'); handleClose(); }}>
                        <SettingsBrightnessRoundedIcon sx={{ mr: 1.2 }} fontSize='small' />
                        Usar tema do sistema
                        {preference === 'system' && <CheckRoundedIcon sx={{ ml: 1.5 }} fontSize='small' />}
                    </MenuItem>
                    <MenuItem onClick={signOut}>
                        <LogoutIcon sx={{ mr: 1.2 }} fontSize='small' />
                        Sair da conta
                    </MenuItem>
                </Menu>


            </Toolbar>
        </AppBarMui>
    );
};
